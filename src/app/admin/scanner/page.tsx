'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  QrCode,
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Ticket,
  Calendar,
  Building,
  ArrowLeft,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Search,
  FlipHorizontal
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

interface ScanHistoryItem {
  id: string;
  studentName: string;
  registrationCode: string;
  department?: string;
  timestamp: string;
  status: 'ATTENDANCE_MARKED' | 'ALREADY_MARKED' | 'ERROR';
  message: string;
}

function QRScannerContent() {
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get('event') || '';
  const router = useRouter();
  const { user } = useAdmin();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(preselectedEventId);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Verification & Feedback States
  const [scanProcessing, setScanProcessing] = useState(false);
  const [latestResult, setLatestResult] = useState<{
    status: 'ATTENDANCE_MARKED' | 'ALREADY_MARKED' | 'ERROR';
    title: string;
    message: string;
    participant?: any;
    timestamp?: string;
  } | null>(null);

  // Session History
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Manual fallback input
  const [manualCode, setManualCode] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const scannerRef = useRef<any>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Fetch published events for attendance
  useEffect(() => {
    fetch('/api/admin/events')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setEvents(json.data);
          if (!selectedEventId && json.data.length > 0) {
            setSelectedEventId(json.data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed fetching events for scanner:', err))
      .finally(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (preselectedEventId) {
      setSelectedEventId(preselectedEventId);
    }
  }, [preselectedEventId]);

  // Audio beep generator using Web Audio API
  const playScanBeep = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 high beep
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 double beep
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        setTimeout(() => {
          try {
            const ctx2 = new AudioContext();
            const osc2 = ctx2.createOscillator();
            const gain2 = ctx2.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx2.destination);
            osc2.frequency.setValueAtTime(440, ctx2.currentTime);
            gain2.gain.setValueAtTime(0.15, ctx2.currentTime);
            osc2.start();
            osc2.stop(ctx2.currentTime + 0.1);
          } catch {}
        }, 120);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime); // low error buzz
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio autoplay restrictions
    }
  };

  // Start live QR scanner
  const startScanner = async () => {
    setCameraError(null);
    if (!selectedEventId) {
      setCameraError('Please select an event before scanning passes.');
      return;
    }

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Check if scanner instance already exists
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      };

      await html5QrCode.start(
        { facingMode: facingMode },
        qrConfig,
        (decodedText) => {
          handlePassScanned(decodedText);
        },
        () => {
          // Ignore parse errors per frame
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      let msg = err.message || 'Unable to access device camera.';
      if (msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        msg = 'Camera permission was denied. Please allow camera access in your browser address bar and reload.';
      } else if (msg.includes('secure context') || (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost')) {
        msg = 'Camera scanning requires HTTPS or localhost. Please ensure the website is accessed over a secure HTTPS connection.';
      }
      setCameraError(msg);
      setIsScanning(false);
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Toggle front/rear camera
  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isScanning) {
      await stopScanner();
      setTimeout(() => {
        setFacingMode(nextMode);
        startScanner();
      }, 200);
    }
  };

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, []);

  // Process a scanned or typed pass
  const handlePassScanned = async (qrData: string) => {
    const now = Date.now();
    // Debounce rapid repeat frames of the same QR code (2.5 second cooldown)
    if (lastScannedCodeRef.current === qrData && now - lastScannedTimeRef.current < 2500) {
      return;
    }

    lastScannedCodeRef.current = qrData;
    lastScannedTimeRef.current = now;

    if (!selectedEventId) {
      setLatestResult({
        status: 'ERROR',
        title: 'NO EVENT SELECTED',
        message: 'Please choose an active event from the dropdown before scanning.'
      });
      playScanBeep('error');
      return;
    }

    setScanProcessing(true);

    try {
      const res = await fetch(`/api/admin/events/${selectedEventId}/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });

      const json = await res.json();

      if (json.success) {
        const participant = json.data;
        if (json.alreadyMarked) {
          playScanBeep('warning');
          setLatestResult({
            status: 'ALREADY_MARKED',
            title: 'ALREADY MARKED PRESENT',
            message: `Participant was already marked present at ${new Date(json.attendedAt).toLocaleTimeString('en-IN')}`,
            participant,
            timestamp: new Date().toLocaleTimeString('en-IN')
          });
          setHistory((prev) => [
            {
              id: participant.id || `hist-${Date.now()}`,
              studentName: participant.studentName,
              registrationCode: participant.registrationCode,
              department: participant.department,
              timestamp: new Date().toLocaleTimeString('en-IN'),
              status: 'ALREADY_MARKED',
              message: 'Already Present'
            },
            ...prev.slice(0, 24)
          ]);
        } else {
          playScanBeep('success');
          setLatestResult({
            status: 'ATTENDANCE_MARKED',
            title: 'ATTENDANCE MARKED SUCCESSFULLY',
            message: `Welcome, ${participant.studentName}! Marked Present for event.`,
            participant,
            timestamp: new Date().toLocaleTimeString('en-IN')
          });
          setHistory((prev) => [
            {
              id: participant.id || `hist-${Date.now()}`,
              studentName: participant.studentName,
              registrationCode: participant.registrationCode,
              department: participant.department,
              timestamp: new Date().toLocaleTimeString('en-IN'),
              status: 'ATTENDANCE_MARKED',
              message: 'Marked Present'
            },
            ...prev.slice(0, 24)
          ]);
        }
      } else {
        playScanBeep('error');
        setLatestResult({
          status: 'ERROR',
          title: json.code || 'SCAN VERIFICATION FAILED',
          message: json.error || 'The scanned QR code is invalid or unrecognized.'
        });
      }
    } catch (err: any) {
      playScanBeep('error');
      setLatestResult({
        status: 'ERROR',
        title: 'NETWORK / SCAN ERROR',
        message: err.message || 'Failed connecting to server.'
      });
    } finally {
      setScanProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setManualSubmitting(true);
    handlePassScanned(manualCode.trim()).finally(() => {
      setManualSubmitting(false);
      setManualCode('');
    });
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={selectedEventId ? `/admin/events/${selectedEventId}` : '/admin/events'}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Management
            </Link>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#F98A5B]" /> QR Attendance Scanner
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Scan attendee QR passes at event reception to mark attendance live in Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title={soundEnabled ? 'Mute Beep Sounds' : 'Enable Beep Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {selectedEventId && (
            <Link
              href={`/admin/events/${selectedEventId}`}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>View Event Roster</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#F98A5B]" />
            </Link>
          )}
        </div>
      </div>

      {/* Event Selection Bar */}
      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Active Event for Attendance Check-In <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setLatestResult(null);
            }}
            disabled={loadingEvents}
            className="w-full bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {e.date} ({e.category})
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="flex items-center gap-3 text-xs text-slate-300 shrink-0">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#F98A5B]" /> {selectedEvent.date}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#EC3A74]" /> {selectedEvent.venue || 'Campus Venue'}
            </span>
          </div>
        )}
      </div>

      {/* Main Scanner Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Viewport & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
            {/* Viewport Box */}
            <div className="relative aspect-square max-w-[420px] mx-auto rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col items-center justify-center">
              {/* HTML5 QR Code Mount Element */}
              <div
                id="qr-reader-container"
                className={`w-full h-full ${!isScanning ? 'hidden' : ''}`}
              />

              {!isScanning && (
                <div className="p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                    <Camera className="w-8 h-8 text-[#F98A5B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Camera Idle</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Click &quot;Start Scanning Camera&quot; to begin scanning attendee passes.
                    </p>
                  </div>
                </div>
              )}

              {/* Viewfinder Target Graphic (when scanning) */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-[#F98A5B] rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(249,138,91,0.3)]">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />
                  </div>
                </div>
              )}

              {scanProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                  <div className="p-4 rounded-2xl bg-[#1A1A22] border border-white/20 text-white font-bold text-xs flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#F98A5B] animate-spin" />
                    <span>Verifying Pass...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Error Message */}
            {cameraError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Scanner Control Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-white/10">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] hover:opacity-90 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#F98A5B]/20 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Start Scanning Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="px-6 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <CameraOff className="w-4 h-4 text-rose-400" />
                  <span>Stop Camera</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleCameraFacing}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                title="Switch Camera (Front / Rear)"
              >
                <FlipHorizontal className="w-4 h-4 text-[#F98A5B]" />
                <span>Camera ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
              </button>
            </div>
          </div>

          {/* Manual Input Fallback */}
          <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#F98A5B]" /> Manual Pass Check-In Fallback
            </h3>
            <p className="text-[11px] text-slate-400">
              If a participant&apos;s phone screen is cracked or camera is unavailable, enter their Pass ID (e.g. REG-2026-12345) below.
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="REG-2026-XXXXX or Pass Token"
                className="flex-1 bg-[#18181D] border border-white/10 focus:border-[#F98A5B] rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none"
              />
              <button
                type="submit"
                disabled={manualSubmitting || !manualCode.trim()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs cursor-pointer disabled:opacity-40"
              >
                {manualSubmitting ? 'Checking...' : 'Check In'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scan Feedback & Session History (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Result Feedback Card */}
          <div
            className={`p-5 rounded-3xl border transition-all space-y-3 ${
              !latestResult
                ? 'bg-[#121216] border-white/10 text-slate-400'
                : latestResult.status === 'ATTENDANCE_MARKED'
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xl shadow-emerald-500/10'
                : latestResult.status === 'ALREADY_MARKED'
                ? 'bg-amber-950/20 border-amber-500/40 shadow-xl shadow-amber-500/10'
                : 'bg-rose-950/20 border-rose-500/40 shadow-xl shadow-rose-500/10'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                LATEST SCAN VERIFICATION
              </span>
              {latestResult && (
                <span className="text-[10px] font-mono text-slate-400">
                  {latestResult.timestamp}
                </span>
              )}
            </div>

            {!latestResult ? (
              <div className="py-8 text-center space-y-2">
                <Ticket className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Scan a participant pass to see real-time check-in details.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {latestResult.status === 'ATTENDANCE_MARKED' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : latestResult.status === 'ALREADY_MARKED' ? (
                    <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h3
                      className={`font-black text-sm ${
                        latestResult.status === 'ATTENDANCE_MARKED'
                          ? 'text-emerald-400'
                          : latestResult.status === 'ALREADY_MARKED'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {latestResult.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">{latestResult.message}</p>
                  </div>
                </div>

                {latestResult.participant && (
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Participant:</span>
                      <span className="font-bold text-white">{latestResult.participant.studentName}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Pass Code:</span>
                      <span className="text-[#F98A5B] font-bold">{latestResult.participant.registrationCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="text-slate-200">{latestResult.participant.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-emerald-400">PRESENT / ATTENDED</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session History Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#121216] border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F98A5B]" /> Session Scan Log ({history.length})
              </h3>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                >
                  Clear Log
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No passes scanned yet in this session.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{item.studentName}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.registrationCode} • {item.department || 'General'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'ATTENDANCE_MARKED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {item.message}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QRScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs">
          Loading QR Attendance Scanner...
        </div>
      }
    >
      <QRScannerContent />
    </Suspense>
  );
}
