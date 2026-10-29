'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';
import {
  Calendar,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit3,
  UserPlus,
  Share2,
  Eye,
  RefreshCw,
  Stamp,
  Sliders,
  Archive,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Layers,
  Trophy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  QrCode
} from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';
import ProgramQuotaManager from '@/components/admin/ProgramQuotaManager';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProgramWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToast } = useAdmin();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'participants' | 'quotas' | 'leaders' | 'template' | 'certificates' | 'reports'>('attendance');

  // Program / Event State
  const [program, setProgram] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection States for bulk downloads & actions
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set());

  // Certificate Filter States
  const [certSearch, setCertSearch] = useState('');
  const [certTypeFilter, setCertTypeFilter] = useState('All');
  const [certStatusFilter, setCertStatusFilter] = useState('All');

  // Attendance & Filter States
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Absent'>('All');
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Participant Management States
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantDeptFilter, setParticipantDeptFilter] = useState('All');
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [participantForm, setParticipantForm] = useState({
    studentName: '',
    registerNumber: '',
    email: '',
    phone: '',
    department: 'Electronics Engineering',
    academicYear: 'Second Year',
    collegeName: 'Govt Polytechnic College Perinthalmanna'
  });

  // Leader Management States
  const [showAddLeaderModal, setShowAddLeaderModal] = useState(false);
  const [leaderForm, setLeaderForm] = useState({
    name: '',
    role: 'Student Lead',
    department: 'Electronics Engineering',
    email: '',
    phone: '',
    certificateEligible: true
  });

  // Certificate Generator States
  const [generating, setGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<any>(null);
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [liveSamplePdf, setLiveSamplePdf] = useState('/api/admin/certificates/sample-preview?type=participation');
  const [participationSamplePdf, setParticipationSamplePdf] = useState('/api/admin/certificates/sample-preview?type=participation');
  const [winnerSamplePdf, setWinnerSamplePdf] = useState('/api/admin/certificates/sample-preview?type=winner');
  const [previewTarget, setPreviewTarget] = useState<'participation' | 'winner'>('participation');
  const [sampleGenerating, setSampleGenerating] = useState(false);
  const [certTemplateTab, setCertTemplateTab] = useState<'participation' | 'winner'>('participation');
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

  // Participation Template Config State
  const [templateConfig, setTemplateConfig] = useState({
    nameY: 305,
    nameFontSize: 34,
    nameColor: '#8B0000',
    paraX: 0,
    paraY: 252,
    paraFontSize: 12.5,
    paraMaxWidth: 580,
    paraLineSpacing: 18,
    paraColor: '#1F2937',
    paraAlign: 'center',
    paraBold: false,
    showCertId: true,
    certIdY: 45
  });

  // Winner Template Config State
  const [winnerTemplateConfig, setWinnerTemplateConfig] = useState({
    nameY: 305,
    nameFontSize: 34,
    nameColor: '#8B0000',
    paraX: 0,
    paraY: 252,
    paraFontSize: 12.5,
    paraMaxWidth: 580,
    paraLineSpacing: 18,
    paraColor: '#1F2937',
    paraAlign: 'center',
    paraBold: false,
    showCertId: true,
    certIdY: 45,
    subtitleY: 398,
    introY: 363
  });

  // Load all program data
  const loadProgramData = async () => {
    setLoading(true);
    try {
      const [evtRes, regRes, ldrRes, certRes, tplRes] = await Promise.all([
        fetch('/api/admin/events').then((r) => r.json()),
        fetch(`/api/admin/events/${id}/attendance`).then((r) => r.json()),
        fetch(`/api/admin/events/${id}/leaders`).then((r) => r.json()),
        fetch('/api/admin/certificates').then((r) => r.json()),
        fetch('/api/admin/certificate-templates').then((r) => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (tplRes?.success && Array.isArray(tplRes.data)) {
        setAvailableTemplates(tplRes.data);
      }

      if (evtRes.success) {
        const found = (evtRes.data || []).find((e: any) => e.id === id);
        if (found) {
          setProgram(found);
          if (found.templateConfig) {
            setTemplateConfig((prev) => ({ ...prev, ...found.templateConfig }));
          }
          if (found.winnerTemplateConfig) {
            setWinnerTemplateConfig((prev) => ({ ...prev, ...found.winnerTemplateConfig }));
          }
        }
      }

      if (regRes.success) setRegistrations(regRes.data || []);
      if (ldrRes.success) setLeaders(ldrRes.data || []);
      if (certRes.success) {
        const programCerts = (certRes.data || []).filter((c: any) => c.eventId === id);
        setCertificates(programCerts);
      }
    } catch (err: any) {
      console.error(err);
      addToast('Failed loading program workspace data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgramData();
  }, [id]);

  // Attendance Handlers
  const handleToggleAttendance = async (reg: any) => {
    const isCurrentlyPresent = reg.attendance === 'Present' || reg.status === 'Attended';
    const nextAttendance = isCurrentlyPresent ? 'Absent' : 'Present';
    setMarkingId(reg.id);

    try {
      const res = await fetch(`/api/admin/events/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: reg.id,
          attendance: nextAttendance
        })
      });
      const json = await res.json();
      if (json.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === reg.id
              ? {
                  ...r,
                  attendance: nextAttendance,
                  status: nextAttendance === 'Present' ? 'Attended' : 'Confirmed',
                  attendedAt: nextAttendance === 'Present' ? new Date().toISOString() : null
                }
              : r
          )
        );
        addToast(
          `Marked ${reg.studentName} as ${nextAttendance}`,
          nextAttendance === 'Present' ? 'success' : 'info'
        );
      } else {
        addToast(json.error || 'Failed updating attendance', 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const handleBulkAttendance = async (attendance: 'Present' | 'Absent') => {
    if (!confirm(`Are you sure you want to mark ALL ${registrations.length} participants as ${attendance}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/events/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          attendance
        })
      });
      const json = await res.json();
      if (json.success) {
        setRegistrations((prev) =>
          prev.map((r) => ({
            ...r,
            attendance,
            status: attendance === 'Present' ? 'Attended' : 'Confirmed',
            attendedAt: attendance === 'Present' ? new Date().toISOString() : null
          }))
        );
        addToast(`Marked all participants as ${attendance}`, 'success');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Add / Edit Participant
  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        // Edit participant details (spelling, phone, dept)
        const res = await fetch('/api/admin/registrations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingParticipant.id,
            status: editingParticipant.status,
            ...participantForm
          })
        });
        const json = await res.json();
        if (json.success) {
          setRegistrations((prev) =>
            prev.map((r) => (r.id === editingParticipant.id ? { ...r, ...participantForm } : r))
          );
          addToast('Participant details updated successfully', 'success');
          setShowAddParticipantModal(false);
          setEditingParticipant(null);
        }
      } else {
        // Add manual participant
        const res = await fetch('/api/public/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: id,
            ...participantForm,
            consent: true
          })
        });
        const json = await res.json();
        if (json.success) {
          setRegistrations((prev) => [json.registration, ...prev]);
          addToast('Participant added successfully', 'success');
          setShowAddParticipantModal(false);
        } else {
          addToast(json.error || 'Failed adding participant', 'error');
        }
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Add Leader
  const handleSaveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/events/${id}/leaders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaderForm)
      });
      const json = await res.json();
      if (json.success) {
        setLeaders((prev) => [json.data, ...prev]);
        setShowAddLeaderModal(false);
        addToast(`Leader ${json.data.name} added successfully`, 'success');
      } else {
        addToast(json.error || 'Failed adding leader', 'error');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleDeleteLeader = async (leaderId: string) => {
    if (!confirm('Are you sure you want to remove this leader?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/leaders?id=${leaderId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setLeaders((prev) => prev.filter((l) => l.id !== leaderId));
        addToast('Leader removed', 'info');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Batch Generate Certificates
  const handleGenerateCertificates = async (regenerate = false) => {
    const eligibleParticipants = registrations.filter(
      (r) => program?.requiresAttendance === false || r.attendance === 'Present' || r.status === 'Attended'
    );
    const eligibleLeaders = leaders.filter((l) => l.certificateEligible !== false);
    const totalEligible = eligibleParticipants.length + eligibleLeaders.length;

    if (totalEligible === 0) {
      addToast(
        'No Eligible Participants',
        'Mark at least one participant as Present before generating certificates.',
        'warning'
      );
      return;
    }

    const confirmMsg = regenerate
      ? `Regenerate certificates for all ${totalEligible} eligible participant${totalEligible === 1 ? '' : 's'} (${eligibleParticipants.length} attendees + ${eligibleLeaders.length} leaders)?`
      : `Generate certificates for ${totalEligible} eligible participant${totalEligible === 1 ? '' : 's'} (${eligibleParticipants.length} attendees + ${eligibleLeaders.length} leaders)?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setGenerating(true);
    setGenerationSummary(null);

    try {
      const res = await fetch(`/api/admin/events/${id}/certificates/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeLeaders: true,
          regenerateExisting: regenerate
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setGenerationSummary(json);
        setCertificates(json.certificates || []);

        const failed = json.failedCount || json.failed || 0;
        const succeeded = json.succeeded || json.generatedCount || 0;
        const skipped = json.skipped || 0;
        const requested = json.requested || totalEligible;

        if (failed > 0 && succeeded > 0) {
          addToast(
            'Partial Certificate Generation',
            `Generated ${succeeded} of ${requested} certificates. ${failed} failed.`,
            'warning'
          );
        } else if (failed > 0 && succeeded === 0) {
          addToast(
            'Certificate Generation Failed',
            `Generation failed: ${json.failures?.[0]?.error || 'Please check template configuration.'}`,
            'error'
          );
        } else {
          addToast(
            'Certificates Generated',
            `Successfully generated ${succeeded} certificates for eligible attendees (${skipped} existing unchanged).`,
            'success'
          );
        }
        loadProgramData();
      } else {
        const errDetail = json.failures?.[0]?.error || json.error || 'Generation failed';
        addToast('Certificate Generation Failed', errDetail, 'error');
        setGenerationSummary({
          success: false,
          error: errDetail,
          failures: json.failures || []
        });
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Single Certificate Regeneration
  const handleRegenerateSingleCert = async (cert: any) => {
    try {
      addToast('Regenerating...', `Regenerating certificate for ${cert.participantName}`, 'info');
      const res = await fetch(`/api/admin/events/${id}/certificates/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regenerateExisting: true,
          singleRegistrationId: cert.registrationId || undefined,
          singleCertificateId: cert.certificateId
        })
      });
      const json = await res.json();
      if (json.success) {
        addToast('Regenerated', `Certificate regenerated for ${cert.participantName}`, 'success');
        loadProgramData();
      } else {
        throw new Error(json.error || 'Failed to regenerate certificate');
      }
    } catch (err: any) {
      addToast('Regeneration Failed', err.message, 'error');
    }
  };

  // Toggle Publication for Single Certificate
  const handleToggleSingleCertPublication = async (cert: any) => {
    const nextStatus = cert.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cert.id,
          status: nextStatus
        })
      });
      const json = await res.json();
      if (json.success) {
        setCertificates((prev) =>
          prev.map((c) => (c.id === cert.id ? { ...c, status: nextStatus } : c))
        );
        addToast(
          nextStatus === 'Published' ? 'Certificate Published' : 'Certificate Unpublished',
          `Certificate for ${cert.participantName} is now ${nextStatus}`,
          'success'
        );
      } else {
        throw new Error(json.error || 'Failed to update publication status');
      }
    } catch (err: any) {
      addToast('Update Failed', err.message, 'error');
    }
  };

  // Generate Sample Preview using a real participant from attendance
  const handleGenerateSample = async (type: 'participation' | 'winner' = certTemplateTab) => {
    try {
      setSampleGenerating(true);
      const isWinner = type === 'winner';
      const sampleParticipant = registrations.find((r) => r.attendance === 'Present')?.studentName || registrations[0]?.studentName || 'MUHAMMED ASHFAK O';
      const configToUse = isWinner ? winnerTemplateConfig : templateConfig;
      const customPara = isWinner ? program?.winnerCertificateParagraph : program?.certificateParagraph;

      const res = await fetch('/api/admin/certificates/sample-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          recipientName: sampleParticipant,
          programName: program?.title || 'Innovation Workshop',
          programDate: program?.date || new Date().toISOString().split('T')[0],
          certificateType: isWinner ? 'Achievement' : 'Participation',
          certificateTitle: isWinner
            ? (program?.winnerCertificateTitle || 'WINNER CERTIFICATE')
            : (program?.certificateTitle || 'CERTIFICATE OF PARTICIPATION'),
          awardCategory: program?.awardCategory || 'First Prize Winner',
          customParagraph: customPara || undefined,
          certificateTemplateUrl: program?.certificateTemplateUrl || undefined,
          templateConfig: configToUse
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (isWinner) {
          setWinnerSamplePdf(json.pdfUrl);
          setPreviewTarget('winner');
        } else {
          setParticipationSamplePdf(json.pdfUrl);
          setPreviewTarget('participation');
        }
        setLiveSamplePdf(json.pdfUrl);
        addToast(`${isWinner ? 'Winner' : 'Participation'} sample preview generated for ${sampleParticipant}`, 'success');
      } else {
        throw new Error(json.error || 'Failed generating sample preview');
      }
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setSampleGenerating(false);
    }
  };

  // Save template settings (both Participation & Winner configurations)
  const handleSaveConfiguration = async () => {
    try {
      const cleanTemplateConfig = {
        nameY: Number(templateConfig.nameY) || 305,
        nameFontSize: Number(templateConfig.nameFontSize) || 34,
        nameColor: templateConfig.nameColor || '#8B0000',
        paraX: Number(templateConfig.paraX) || 0,
        paraY: Number(templateConfig.paraY) || 252,
        paraFontSize: Number(templateConfig.paraFontSize) || 12.5,
        paraLineSpacing: Number(templateConfig.paraLineSpacing) || 18,
        paraMaxWidth: Number(templateConfig.paraMaxWidth) || 580,
        paraColor: templateConfig.paraColor || '#1F2937',
        paraAlign: templateConfig.paraAlign || 'center',
        paraBold: Boolean(templateConfig.paraBold),
        showCertId: Boolean(templateConfig.showCertId),
        certIdY: Number(templateConfig.certIdY) || 45
      };

      const cleanWinnerConfig = {
        nameY: Number(winnerTemplateConfig.nameY) || 305,
        nameFontSize: Number(winnerTemplateConfig.nameFontSize) || 34,
        nameColor: winnerTemplateConfig.nameColor || '#8B0000',
        paraX: Number(winnerTemplateConfig.paraX) || 0,
        paraY: Number(winnerTemplateConfig.paraY) || 252,
        paraFontSize: Number(winnerTemplateConfig.paraFontSize) || 12.5,
        paraLineSpacing: Number(winnerTemplateConfig.paraLineSpacing) || 18,
        paraMaxWidth: Number(winnerTemplateConfig.paraMaxWidth) || 580,
        paraColor: winnerTemplateConfig.paraColor || '#1F2937',
        paraAlign: winnerTemplateConfig.paraAlign || 'center',
        paraBold: Boolean(winnerTemplateConfig.paraBold),
        showCertId: Boolean(winnerTemplateConfig.showCertId),
        certIdY: Number(winnerTemplateConfig.certIdY) || 45,
        subtitleY: Number(winnerTemplateConfig.subtitleY) || 398,
        introY: Number(winnerTemplateConfig.introY) || 363
      };

      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          templateConfig: cleanTemplateConfig,
          winnerTemplateConfig: cleanWinnerConfig,
          certificateTitle: program.certificateTitle || 'CERTIFICATE OF PARTICIPATION',
          certificateParagraph: program.certificateParagraph || '',
          winnerCertificateTitle: program.winnerCertificateTitle || 'WINNER CERTIFICATE',
          winnerCertificateParagraph: program.winnerCertificateParagraph || '',
          awardCategory: program.awardCategory || 'First Prize Winner',
          certificateTemplateUrl: program.certificateTemplateUrl || ''
        })
      });
      const json = await res.json();
      if (json.success) {
        addToast('Template configuration saved successfully', 'success');
        if (json.data) {
          setProgram((prev: any) => ({ ...prev, ...json.data }));
        }
      } else {
        throw new Error(json.error || 'Failed saving configuration');
      }
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  // Publish / Unpublish Certificates
  const handleTogglePublication = async (publish: boolean) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/certificates/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish })
      });
      const json = await res.json();
      if (json.success) {
        setProgram((prev: any) => ({ ...prev, certificateStatus: json.status }));
        setCertificates((prev) => prev.map((c) => ({ ...c, status: json.status })));
        addToast(
          publish
            ? 'Certificates published! Students can now retrieve them on the public portal.'
            : 'Certificates unpublished.',
          'success'
        );
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  // Download ZIP (supports PDF & PNG, All or Selected)
  const handleDownloadCertificatesZip = async (format: 'pdf' | 'png' = 'pdf', useSelected = false) => {
    let targetIds: string[] | undefined = undefined;
    if (useSelected) {
      if (selectedCertIds.size === 0) {
        addToast('No Selection', 'Please select at least one certificate from the table.', 'warning');
        return;
      }
      targetIds = Array.from(selectedCertIds);
    }

    setDownloadingZip(true);
    try {
      const url = `/api/admin/events/${id}/certificates/zip?format=${format}${
        targetIds && targetIds.length > 0 ? `&ids=${encodeURIComponent(targetIds.join(','))}` : ''
      }`;
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Failed to download ${format.toUpperCase()} ZIP.`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeTitle = (program?.title || 'Program').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Certificates_${safeTitle}_${useSelected ? 'SELECTED_' : 'ALL_'}${format.toUpperCase()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      addToast(
        'ZIP Downloaded',
        `Successfully downloaded ${useSelected ? selectedCertIds.size : certificates.length} ${format.toUpperCase()} certificates.`,
        'success'
      );
    } catch (err: any) {
      addToast('ZIP Download Failed', err.message, 'error');
    } finally {
      setDownloadingZip(false);
    }
  };

  // Backwards compatibility alias
  const handleDownloadZip = () => handleDownloadCertificatesZip('pdf', false);

  // Export Program-Specific Participants to Genuine Excel (.xlsx)
  const handleExportParticipantsExcel = (mode: 'all' | 'filtered' | 'selected' | 'present' | 'absent' = 'filtered') => {
    let list = registrations;
    if (mode === 'filtered') {
      const q = participantSearch.toLowerCase();
      list = registrations.filter((r) => {
        const matchDept = participantDeptFilter === 'All' || r.department === participantDeptFilter;
        const matchSearch =
          !q ||
          (r.studentName || '').toLowerCase().includes(q) ||
          (r.registerNumber || '').toLowerCase().includes(q) ||
          (r.email || '').toLowerCase().includes(q) ||
          (r.phone || '').includes(q);
        return matchDept && matchSearch;
      });
    } else if (mode === 'selected') {
      list = registrations.filter((r) => selectedParticipantIds.has(r.id));
      if (list.length === 0) {
        addToast('No Selection', 'Please select at least one participant using checkboxes.', 'warning');
        return;
      }
    } else if (mode === 'present') {
      list = registrations.filter((r) => r.attendance === 'Present' || r.status === 'Attended');
    } else if (mode === 'absent') {
      list = registrations.filter((r) => !(r.attendance === 'Present' || r.status === 'Attended'));
    }

    if (list.length === 0) {
      addToast('No Data', `No participants found for ${mode} export.`, 'warning');
      return;
    }

    const rows = list.map((r, i) => {
      const isPresent = r.attendance === 'Present' || r.status === 'Attended';
      const isEligible = program?.requiresAttendance === false || isPresent;
      const cert = certificates.find((c) => c.registrationId === r.id || c.participantName === r.studentName);

      return {
        'Sl No': i + 1,
        'Registration ID': r.registrationCode || r.id,
        'Full Name': r.studentName,
        'Admission Number': r.registerNumber || 'N/A',
        'Department': r.department,
        'Academic Year': r.academicYear || '2nd Year',
        'Email Address': r.email,
        'Mobile Number': r.phone || 'N/A',
        'Attendance': isPresent ? 'Present' : 'Absent',
        'Certificate Eligibility': isEligible ? 'Eligible' : 'Ineligible (Absent)',
        'Certificate Status': cert ? `${cert.status} (${cert.certificateId})` : 'Not Generated',
        'Registration Date': r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN') : 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 8 },  // Sl No
      { wch: 20 }, // Reg ID
      { wch: 26 }, // Full Name
      { wch: 18 }, // Admission No
      { wch: 25 }, // Department
      { wch: 15 }, // Year
      { wch: 28 }, // Email
      { wch: 16 }, // Phone
      { wch: 14 }, // Attendance
      { wch: 22 }, // Eligibility
      { wch: 28 }, // Cert Status
      { wch: 22 }  // Reg Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    const safeTitle = (program?.title || 'Program').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Participants_${safeTitle}_${mode.toUpperCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
    addToast('Excel Downloaded', `Exported ${list.length} participants (${mode}) to genuine .xlsx`, 'success');
  };

  const handleExportExcel = () => handleExportParticipantsExcel('all');

  // Export Participants to PDF
  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`IEDC GPTC PMNA — ${program?.title || 'Program Participants'}`, 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()} | Total Registrations: ${registrations.length} | Venue: ${program?.venue || 'Campus'}`,
      14,
      22
    );

    const headers = [
      ['#', 'Reg ID', 'Student Name', 'College', 'Department', 'Phone', 'Status', 'Attendance', 'Cert ID']
    ];
    const data = registrations.map((r, i) => [
      i + 1,
      r.registrationCode || r.id,
      r.studentName,
      (r.collegeName || 'GPTC PMNA').slice(0, 20),
      r.department,
      r.phone,
      r.status === 'Waitlisted' ? `Waitlist #${r.waitlistPosition || 1}` : r.status,
      r.attendance || (r.status === 'Attended' ? 'Present' : 'Absent'),
      r.certificateId || '-'
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [20, 20, 25], textColor: [255, 255, 255] }
    });

    doc.save(`IEDC_${program?.title?.replace(/[^a-zA-Z0-9_-]/g, '_')}_Report.pdf`);
    addToast('PDF report downloaded', 'success');
  };

  // Filtered lists
  const presentCount = registrations.filter(
    (r) => r.attendance === 'Present' || r.status === 'Attended'
  ).length;
  const absentCount = registrations.length - presentCount;

  const filteredAttendanceList = registrations.filter((r) => {
    const isPresent = r.attendance === 'Present' || r.status === 'Attended';
    if (attendanceFilter === 'Present' && !isPresent) return false;
    if (attendanceFilter === 'Absent' && isPresent) return false;

    if (attendanceSearch) {
      const q = attendanceSearch.toLowerCase();
      const matchName = (r.studentName || '').toLowerCase().includes(q);
      const matchReg = (r.registerNumber || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || '').includes(q);
      if (!matchName && !matchReg && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/events"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#F98A5B] uppercase font-bold tracking-wider">
                PROGRAM MANAGEMENT WORKSPACE
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  program?.certificateStatus === 'Published'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                Certs: {program?.certificateStatus || 'Draft'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {program?.title || 'Program Management'}
            </h1>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/scanner?event=${id}`}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            <span>QR Scanner</span>
          </Link>

          <Link
            href={`/register?event=${id}`}
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> Public Form
          </Link>

          <button
            onClick={() => handleGenerateCertificates(false)}
            disabled={generating}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#F98A5B]/20 hover:opacity-95 transition-all disabled:opacity-50"
          >
            <Award className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Certificates'}
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip || certificates.length === 0}
            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadingZip ? 'Zipping...' : 'Download ZIP'}
          </button>
        </div>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-iedc p-4 rounded-2xl border border-white/10">
          <div className="text-xs text-slate-400">Total Registered</div>
          <div className="text-2xl font-black text-white mt-1">{registrations.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Capacity: {program?.totalSeats || '50'}</div>
        </div>

        <div className="glass-iedc p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-xs text-emerald-400 font-bold">Marked Present</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{presentCount}</div>
          <div className="text-[10px] text-emerald-400/70 mt-1">
            Rate: {registrations.length > 0 ? Math.round((presentCount / registrations.length) * 100) : 0}%
          </div>
        </div>

        <div className="glass-iedc p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="text-xs text-rose-400 font-bold">Marked Absent</div>
          <div className="text-2xl font-black text-rose-300 mt-1">{absentCount}</div>
          <div className="text-[10px] text-rose-400/70 mt-1">Ineligible for Certs</div>
        </div>

        <div className="glass-iedc p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <div className="text-xs text-blue-400 font-bold">Generated Certs</div>
          <div className="text-2xl font-black text-blue-300 mt-1">{certificates.length}</div>
          <div className="text-[10px] text-blue-400/70 mt-1">
            Leaders: {leaders.length} eligible
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2">
        {[
          { id: 'attendance', label: `1. Attendance (${presentCount}/${registrations.length})`, icon: CheckCircle2 },
          { id: 'participants', label: `2. Participants (${registrations.length})`, icon: Users },
          { id: 'leaders', label: `3. Leaders & Organizers (${leaders.length})`, icon: Award },
          { id: 'template', label: '4. Certificate Template', icon: Stamp },
          { id: 'certificates', label: `5. Generated Certificates (${certificates.length})`, icon: Award },
          { id: 'reports', label: '6. Reports & Downloads', icon: Download },
          { id: 'quotas', label: 'Quotas & Seats', icon: Layers },
          { id: 'overview', label: 'Program Settings', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[#F98A5B] text-[#F98A5B] bg-[#F98A5B]/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ATTENDANCE MARKING SYSTEM                         */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-iedc p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or reg number..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                />
              </div>

              <div className="flex items-center bg-[#0B0B0D] border border-white/10 rounded-xl p-0.5 text-xs">
                {(['All', 'Present', 'Absent'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAttendanceFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      attendanceFilter === filter
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/scanner?event=${id}`}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Open QR Scanner</span>
              </Link>
              <button
                onClick={() => handleBulkAttendance('Present')}
                className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark All Present
              </button>
              <button
                onClick={() => handleBulkAttendance('Absent')}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" /> Mark All Absent
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="glass-iedc rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase font-mono tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Participant Name</th>
                    <th className="py-3 px-4">Register Number</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4 text-center w-36">Attendance Status</th>
                    <th className="py-3 px-4 text-center w-36">Mark Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredAttendanceList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No participants match the selected attendance filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceList.map((reg, idx) => {
                      const isPresent = reg.attendance === 'Present' || reg.status === 'Attended';
                      return (
                        <tr
                          key={reg.id}
                          className={`hover:bg-white/5 transition-colors ${
                            isPresent ? 'bg-emerald-500/[0.02]' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {reg.studentName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {reg.registerNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {reg.department}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {reg.phone}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isPresent
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {isPresent ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Present
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Absent
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleAttendance(reg)}
                              disabled={markingId === reg.id}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 w-full transition-all ${
                                isPresent
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isPresent}
                                readOnly
                                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                              />
                              <span>{isPresent ? 'Present' : 'Mark Present'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PARTICIPANTS MANAGEMENT & EXPORTS                */}
      {/* ======================================================== */}
      {activeTab === 'participants' && (() => {
        const filteredParticipantsList = registrations.filter((r) => {
          const matchDept = participantDeptFilter === 'All' || r.department === participantDeptFilter;
          const q = participantSearch.toLowerCase().trim();
          const matchSearch =
            !q ||
            (r.studentName || '').toLowerCase().includes(q) ||
            (r.registerNumber || '').toLowerCase().includes(q) ||
            (r.email || '').toLowerCase().includes(q) ||
            (r.phone || '').includes(q);
          return matchDept && matchSearch;
        });

        const toggleSelectAllParticipants = () => {
          if (selectedParticipantIds.size === filteredParticipantsList.length && filteredParticipantsList.length > 0) {
            setSelectedParticipantIds(new Set());
          } else {
            setSelectedParticipantIds(new Set(filteredParticipantsList.map((r) => r.id)));
          }
        };

        const toggleSelectOneParticipant = (regId: string) => {
          setSelectedParticipantIds((prev) => {
            const next = new Set(prev);
            if (next.has(regId)) next.delete(regId);
            else next.add(regId);
            return next;
          });
        };

        return (
          <div className="space-y-4">
            {/* Filter & Export Toolbar */}
            <div className="glass-iedc p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student, reg no, or email..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>

                  <select
                    value={participantDeptFilter}
                    onChange={(e) => setParticipantDeptFilter(e.target.value)}
                    className="bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Departments</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical and Electronics Engineering">Electrical &amp; Electronics Engineering (EEE)</option>
                    <option value="Electronics Engineering">Electronics Engineering</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingParticipant(null);
                    setParticipantForm({
                      studentName: '',
                      registerNumber: '',
                      email: '',
                      phone: '',
                      department: 'Electronics Engineering',
                      academicYear: 'Second Year',
                      collegeName: 'Govt Polytechnic College Perinthalmanna'
                    });
                    setShowAddParticipantModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#F98A5B]/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Add Participant
                </button>
              </div>

              {/* Dedicated Excel & PDF Export Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
                  Export Options:
                </span>

                {selectedParticipantIds.size > 0 && (
                  <button
                    onClick={() => handleExportParticipantsExcel('selected')}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Export ${selectedParticipantIds.size} selected participants`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download Selected ({selectedParticipantIds.size}) — Excel</span>
                  </button>
                )}

                <button
                  onClick={() => handleExportParticipantsExcel('all')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download all participants as genuine .xlsx"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download All ({registrations.length}) — Excel</span>
                </button>

                <button
                  onClick={() => handleExportParticipantsExcel('filtered')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  title="Download filtered participants as .xlsx"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Filtered ({filteredParticipantsList.length}) — Excel</span>
                </button>

                <button
                  onClick={() => handleExportParticipantsExcel('present')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download present attendees as .xlsx"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Present ({presentCount}) — Excel</span>
                </button>

                <button
                  onClick={() => handleExportParticipantsExcel('absent')}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download absent participants as .xlsx"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download Absent ({absentCount}) — Excel</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  title="Download Participant List report as PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download Participant List — PDF</span>
                </button>
              </div>
            </div>

            {/* Participant Table */}
            <div className="glass-iedc rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase font-mono tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredParticipantsList.length > 0 &&
                            filteredParticipantsList.every((r) => selectedParticipantIds.has(r.id))
                          }
                          onChange={toggleSelectAllParticipants}
                          className="rounded border-slate-700 text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D] cursor-pointer"
                          title="Select all matching participants"
                        />
                      </th>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-4">Reg Code</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Admission No</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-center">Attendance</th>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredParticipantsList.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-semibold">No participants found matching the criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredParticipantsList.map((reg, idx) => {
                        const cert = certificates.find(
                          (c) => c.registrationId === reg.id || c.participantName === reg.studentName
                        );
                        const isSelected = selectedParticipantIds.has(reg.id);

                        return (
                          <tr
                            key={reg.id}
                            className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-[#F98A5B]/[0.05]' : ''}`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOneParticipant(reg.id)}
                                className="rounded border-slate-700 text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D] cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-3 px-4 font-mono text-[#F98A5B]">
                              {reg.registrationCode || reg.id}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">{reg.studentName}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{reg.registerNumber || 'N/A'}</td>
                            <td className="py-3 px-4">{reg.department}</td>
                            <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">{reg.email}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{reg.phone || 'N/A'}</td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  reg.attendance === 'Present' || reg.status === 'Attended'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {reg.attendance || (reg.status === 'Attended' ? 'Present' : 'Absent')}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-400">
                              {cert ? (
                                <span className="text-[#F98A5B] font-bold">{cert.certificateId}</span>
                              ) : (
                                <span className="text-slate-500 italic">Not Generated</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setEditingParticipant(reg);
                                  setParticipantForm({
                                    studentName: reg.studentName,
                                    registerNumber: reg.registerNumber,
                                    email: reg.email,
                                    phone: reg.phone,
                                    department: reg.department,
                                    academicYear: reg.academicYear || '2nd Year',
                                    collegeName: reg.collegeName || 'Govt Polytechnic College Perinthalmanna'
                                  });
                                  setShowAddParticipantModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit participant details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* TAB: REGISTRATION QUOTAS & SEAT ALLOCATION               */}
      {/* ======================================================== */}
      {activeTab === 'quotas' && (
        <ProgramQuotaManager
          eventId={id}
          eventTitle={program?.title || 'Campus Program'}
          eventLevel={program?.level || 'College'}
          addToast={addToast}
          onRefreshAll={loadProgramData}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 3: LEADERS & ORGANIZERS                              */}
      {/* ======================================================== */}
      {activeTab === 'leaders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between glass-iedc p-4 rounded-2xl border border-white/10">
            <div>
              <h2 className="text-sm font-bold text-white">Event Leaders & Organizers</h2>
              <p className="text-xs text-slate-400">
                Add student leads, coordinators, volunteers, and faculty who will receive certificates for this program.
              </p>
            </div>
            <button
              onClick={() => setShowAddLeaderModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F98A5B]/20"
            >
              <UserPlus className="w-4 h-4" /> Add Leader
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaders.map((ldr) => (
              <div
                key={ldr.id}
                className="glass-iedc p-4 rounded-2xl border border-white/10 flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{ldr.name}</div>
                  <div className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F98A5B]/15 text-[#F98A5B] border border-[#F98A5B]/30">
                    {ldr.role}
                  </div>
                  <div className="text-xs text-slate-400">{ldr.department}</div>
                  <div className="text-xs font-mono text-slate-500">{ldr.phone || ldr.email}</div>
                  <div className="text-[10px] text-emerald-400 font-bold mt-2">
                    ✓ Certificate Eligible
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLeader(ldr.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="Remove leader"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: CERTIFICATE TEMPLATES & VISUAL DESIGNER           */}
      {/* ======================================================== */}
      {activeTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#F98A5B]" /> Certificate Designer & Presets
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  Vector Engine
                </span>
              </div>

              {/* Master Template Notice & Active Indicator */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Active Template Status:</span>
                  {program?.certificateTemplateUrl ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                      CUSTOM UPLOAD ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/30">
                      DEFAULT MASTER VECTOR
                    </span>
                  )}
                </div>
                {program?.certificateTemplateUrl ? (
                  <div className="text-[11px] text-slate-400 break-all font-mono">
                    File: {program.certificateTemplateUrl.split('/').pop()}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Official vector artwork with mosaic border cubes, institutional logos, and authentic signatures preserved.
                  </p>
                )}
                {program?.certificateTemplateUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setProgram((p: any) => ({ ...p, certificateTemplateUrl: '' }));
                      addToast('Reset to default master template (click Save Configuration to persist)', 'info');
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
                  >
                    Reset to Default Master Template
                  </button>
                )}
              </div>

              {/* Template Selection from Library */}
              {availableTemplates.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                    Select from Template Library
                  </label>
                  <select
                    value={program?.certificateTemplateUrl || ''}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setProgram((p: any) => ({ ...p, certificateTemplateUrl: selectedVal }));
                      if (selectedVal) {
                        const tpl = availableTemplates.find(
                          (t) => (t.cleanUrl || t.url || t.pdfUrl) === selectedVal
                        );
                        if (tpl?.templateConfig) {
                          setTemplateConfig((prev) => ({ ...prev, ...tpl.templateConfig }));
                        }
                      }
                    }}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="">Default Master Vector Template</option>
                    {availableTemplates.map((t) => (
                      <option key={t.id} value={t.cleanUrl || t.url || t.pdfUrl}>
                        {t.title} ({t.type || 'Master'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Master Template Upload */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase block mb-1">
                  Or Upload New Master File (PNG, JPG, PDF)
                </label>
                <FileUpload
                  label="Certificate Master File"
                  value={program?.certificateTemplateUrl || ''}
                  onChange={(url) => setProgram((p: any) => ({ ...p, certificateTemplateUrl: url }))}
                  folder="certificate-templates"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                />
              </div>

              {/* Sub-Tabs: Participation vs Winner Configuration */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCertTemplateTab('participation');
                      setPreviewTarget('participation');
                      setLiveSamplePdf(participationSamplePdf);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      certTemplateTab === 'participation'
                        ? 'bg-[#F98A5B]/20 border-[#F98A5B] text-white shadow-md shadow-[#F98A5B]/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-[#F98A5B]" />
                    <span>Participation Cert</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCertTemplateTab('winner');
                      setPreviewTarget('winner');
                      setLiveSamplePdf(winnerSamplePdf);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      certTemplateTab === 'winner'
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Winner Cert</span>
                  </button>
                </div>

                {/* ======================================================== */}
                {/* SUB-TAB A: PARTICIPATION CONFIGURATION                   */}
                {/* ======================================================== */}
                {certTemplateTab === 'participation' && (
                  <div className="space-y-3 pt-2">
                    {/* Certificate Title */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Certificate Title / Heading
                      </label>
                      <input
                        type="text"
                        value={program?.certificateTitle || 'CERTIFICATE OF PARTICIPATION'}
                        onChange={(e) => setProgram({ ...program, certificateTitle: e.target.value })}
                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="CERTIFICATE OF PARTICIPATION"
                      />
                    </div>

                    {/* Participation Paragraph */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Participation Description / Paragraph
                      </label>
                      <textarea
                        rows={3}
                        value={program?.certificateParagraph || ''}
                        onChange={(e) => setProgram({ ...program, certificateParagraph: e.target.value })}
                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl p-3 text-xs text-white"
                        placeholder="In recognition of your outstanding participation and dedication in..."
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Preserves original capitalization as entered.
                      </p>
                    </div>

                    {/* Typography & Coordinate Controls */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Name Y Position (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={templateConfig.nameY}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, nameY: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Name Font Size (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={templateConfig.nameFontSize}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, nameFontSize: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Paragraph Y Position (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={templateConfig.paraY}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, paraY: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Paragraph Font Size (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={templateConfig.paraFontSize}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, paraFontSize: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Line Spacing (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={templateConfig.paraLineSpacing}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, paraLineSpacing: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Max Paragraph Width (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={templateConfig.paraMaxWidth}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, paraMaxWidth: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Text Alignment</label>
                        <select
                          value={templateConfig.paraAlign || 'center'}
                          onChange={(e: any) => setTemplateConfig({ ...templateConfig, paraAlign: e.target.value })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          <option value="center">Centered</option>
                          <option value="left">Left Aligned</option>
                          <option value="right">Right Aligned</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Paragraph Font Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={typeof templateConfig.paraColor === 'string' ? templateConfig.paraColor : '#1F2937'}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, paraColor: e.target.value })}
                            className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={typeof templateConfig.paraColor === 'string' ? templateConfig.paraColor : '#1F2937'}
                            onChange={(e) => setTemplateConfig({ ...templateConfig, paraColor: e.target.value })}
                            className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(templateConfig.paraBold)}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, paraBold: e.target.checked })}
                          className="rounded border-white/20 text-[#F98A5B] focus:ring-0"
                        />
                        <span>Bold Paragraph Text</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(templateConfig.showCertId)}
                          onChange={(e) => setTemplateConfig({ ...templateConfig, showCertId: e.target.checked })}
                          className="rounded border-white/20 text-[#F98A5B] focus:ring-0"
                        />
                        <span>Show Certificate ID</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* SUB-TAB B: WINNER CONFIGURATION                          */}
                {/* ======================================================== */}
                {certTemplateTab === 'winner' && (
                  <div className="space-y-3 pt-2">
                    {/* Certificate Title */}
                    <div>
                      <label className="text-[11px] text-amber-300 font-bold block mb-1">
                        Winner Certificate Title / Heading
                      </label>
                      <input
                        type="text"
                        value={program?.winnerCertificateTitle || 'WINNER CERTIFICATE'}
                        onChange={(e) => setProgram({ ...program, winnerCertificateTitle: e.target.value })}
                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="WINNER CERTIFICATE or CERTIFICATE OF ACHIEVEMENT"
                      />
                    </div>

                    {/* Award Position / Category */}
                    <div>
                      <label className="text-[11px] text-amber-300 font-bold block mb-1">
                        Winner Position / Award Category
                      </label>
                      <input
                        type="text"
                        value={program?.awardCategory || 'First Prize Winner'}
                        onChange={(e) => setProgram({ ...program, awardCategory: e.target.value })}
                        className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="e.g. First Prize Winner, Second Prize, Best Innovation"
                      />
                    </div>

                    {/* Winner Description / Paragraph */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-amber-300 font-bold block">
                          Winner Description / Paragraph
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">
                          ✓ Exact Case Preserved
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={program?.winnerCertificateParagraph || ''}
                        onChange={(e) => setProgram({ ...program, winnerCertificateParagraph: e.target.value })}
                        className="w-full bg-[#0B0B0D] border border-white/15 focus:border-amber-400 rounded-xl p-3 text-xs text-white"
                        placeholder="In recognition of your outstanding achievement and winning performance in the Drone Workshop, organized by the IEDC Cell, Government Polytechnic College Perinthalmanna."
                      />

                      {/* Warning if empty */}
                      {!program?.winnerCertificateParagraph?.trim() && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">Winner description is empty</div>
                            <div className="text-[11px] text-amber-200/80">
                              Enter the complete winner appreciation sentence manually. It will NOT fall back to or copy the participant description.
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-500 mt-1">
                        Stored and retrieved independently. Never appends or reuses the participant paragraph.
                      </p>
                    </div>

                    {/* Typography & Coordinate Controls for Winner */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Name Y Position (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={winnerTemplateConfig.nameY}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, nameY: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Name Font Size (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={winnerTemplateConfig.nameFontSize}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, nameFontSize: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Description Y Position (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={winnerTemplateConfig.paraY}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraY: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Description Font Size (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={winnerTemplateConfig.paraFontSize}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraFontSize: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Description X Position (pt, 0=auto)</label>
                        <input
                          type="number"
                          step="any"
                          value={winnerTemplateConfig.paraX || 0}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraX: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Line Spacing (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={winnerTemplateConfig.paraLineSpacing}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraLineSpacing: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Max Description Width (pt)</label>
                        <input
                          type="number"
                          step="any"
                          value={winnerTemplateConfig.paraMaxWidth}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraMaxWidth: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Text Alignment</label>
                        <select
                          value={winnerTemplateConfig.paraAlign || 'center'}
                          onChange={(e: any) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraAlign: e.target.value })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          <option value="center">Centered</option>
                          <option value="left">Left Aligned</option>
                          <option value="right">Right Aligned</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Subtitle Y Position (pt)</label>
                        <input
                          type="number"
                          value={winnerTemplateConfig.subtitleY || 398}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, subtitleY: Number(e.target.value) || 0 })}
                          className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Font Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={typeof winnerTemplateConfig.paraColor === 'string' ? winnerTemplateConfig.paraColor : '#1F2937'}
                            onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraColor: e.target.value })}
                            className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={typeof winnerTemplateConfig.paraColor === 'string' ? winnerTemplateConfig.paraColor : '#1F2937'}
                            onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraColor: e.target.value })}
                            className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(winnerTemplateConfig.paraBold)}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, paraBold: e.target.checked })}
                          className="rounded border-white/20 text-amber-500 focus:ring-0"
                        />
                        <span>Bold Winner Description</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(winnerTemplateConfig.showCertId)}
                          onChange={(e) => setWinnerTemplateConfig({ ...winnerTemplateConfig, showCertId: e.target.checked })}
                          className="rounded border-white/20 text-amber-500 focus:ring-0"
                        />
                        <span>Show Certificate ID</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={sampleGenerating}
                    onClick={() => handleGenerateSample('participation')}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sampleGenerating && previewTarget === 'participation' ? 'animate-spin' : ''}`} />
                    <span>Sample Participation</span>
                  </button>

                  <button
                    type="button"
                    disabled={sampleGenerating}
                    onClick={() => handleGenerateSample('winner')}
                    className="flex-1 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trophy className={`w-3.5 h-3.5 ${sampleGenerating && previewTarget === 'winner' ? 'animate-spin' : ''}`} />
                    <span>Sample Winner</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfiguration}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs shadow-md shadow-[#F98A5B]/20 cursor-pointer hover:opacity-95 transition-opacity"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Master PDF Preview Canvas */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              {/* Preview Mode Switcher */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTarget('participation');
                    setLiveSamplePdf(participationSamplePdf);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTarget === 'participation'
                      ? 'bg-[#F98A5B] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Participation Preview
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewTarget('winner');
                    setLiveSamplePdf(winnerSamplePdf);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewTarget === 'winner'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Winner Preview
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <a
                  href={liveSamplePdf}
                  download={`IEDC_${previewTarget === 'winner' ? 'Winner' : 'Participation'}_Sample_${id}.pdf`}
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </a>
                <a
                  href={liveSamplePdf}
                  target="_blank"
                  className="text-xs font-bold text-[#F98A5B] hover:underline flex items-center gap-1"
                >
                  Fullscreen <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="aspect-[1.414/1] w-full min-h-[420px] rounded-2xl border border-white/15 bg-neutral-900/60 overflow-hidden shadow-2xl relative flex items-center justify-center">
              <iframe
                src={`${liveSamplePdf}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0 pointer-events-auto"
                title="Certificate Live Engine Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: CERTIFICATES & DISTRIBUTION                       */}
      {/* ======================================================== */}
      {activeTab === 'certificates' && (() => {
        const filteredCerts = certificates.filter((c) => {
          const q = certSearch.toLowerCase().trim();
          const matchSearch =
            !q ||
            (c.participantName || '').toLowerCase().includes(q) ||
            (c.certificateId || '').toLowerCase().includes(q) ||
            (c.registrationId || '').toLowerCase().includes(q);
          const matchType = certTypeFilter === 'All' || c.certificateType === certTypeFilter;
          const matchStatus = certStatusFilter === 'All' || c.status === certStatusFilter;
          return matchSearch && matchType && matchStatus;
        });

        const toggleSelectAllCerts = () => {
          if (selectedCertIds.size === filteredCerts.length && filteredCerts.length > 0) {
            setSelectedCertIds(new Set());
          } else {
            setSelectedCertIds(new Set(filteredCerts.map((c) => c.id || c.certificateId)));
          }
        };

        const toggleSelectOneCert = (id: string) => {
          setSelectedCertIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        };

        return (
          <div className="space-y-6">
            {/* Generation Summary Box (when batch generated) */}
            {generationSummary && (
              <div
                className={`p-4 rounded-2xl border ${
                  (generationSummary.failedCount || generationSummary.failed || 0) > 0
                    ? 'bg-rose-950/30 border-rose-500/40'
                    : 'bg-emerald-950/30 border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Award
                      className={`w-5 h-5 ${
                        (generationSummary.failedCount || generationSummary.failed || 0) > 0
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    />
                    <h4 className="text-sm font-bold text-white">Certificate Generation Summary</h4>
                  </div>
                  <button
                    onClick={() => setGenerationSummary(null)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Dismiss ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-slate-400 block text-[10px] uppercase font-mono">Eligible Attendees</span>
                    <span className="text-base font-bold text-white">
                      {generationSummary.requested ||
                        (generationSummary.totalEligibleParticipants || 0) +
                          (generationSummary.totalEligibleLeaders || 0)}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-emerald-400 block text-[10px] uppercase font-mono">Successfully Generated</span>
                    <span className="text-base font-bold text-emerald-300">
                      {generationSummary.succeeded || generationSummary.generatedCount || 0}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-rose-500/20">
                    <span className="text-rose-400 block text-[10px] uppercase font-mono">Failed</span>
                    <span className="text-base font-bold text-rose-300">
                      {generationSummary.failedCount || generationSummary.failed || 0}
                    </span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-amber-400 block text-[10px] uppercase font-mono">Skipped (Existed)</span>
                    <span className="text-base font-bold text-amber-300">{generationSummary.skipped || 0}</span>
                  </div>
                </div>

                {generationSummary.failures && generationSummary.failures.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-rose-500/20 text-xs">
                    <div className="font-bold text-rose-300 mb-1">Failed Records:</div>
                    <ul className="space-y-1 text-slate-300">
                      {generationSummary.failures.map((f: any, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-rose-200">
                          <span className="text-rose-400">•</span>
                          <span className="font-bold">{f.recipient}:</span> {f.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar & Batch ZIP Toolbar */}
            <div className="glass-iedc p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Generated Certificates Workspace</h3>
                  <p className="text-xs text-slate-400">
                    Verify, preview, publish, and bulk download generated PDF and PNG certificates.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleGenerateCertificates(false)}
                    disabled={generating}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F98A5B]/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    {generating ? 'Processing...' : 'Generate Certificates'}
                  </button>

                  <button
                    onClick={() => handleGenerateCertificates(true)}
                    disabled={generating}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Regenerating...' : 'Regenerate All'}
                  </button>

                  {program?.certificateStatus === 'Published' ? (
                    <button
                      onClick={() => handleTogglePublication(false)}
                      className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      Unpublish All
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTogglePublication(true)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      ✓ Publish All to Students
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk ZIP & Search Toolbar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-white/5">
                {/* Search & Filter */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative flex-1 sm:w-60 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search recipient or cert ID..."
                      value={certSearch}
                      onChange={(e) => setCertSearch(e.target.value)}
                      className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#F98A5B]"
                    />
                  </div>

                  <select
                    value={certTypeFilter}
                    onChange={(e) => setCertTypeFilter(e.target.value)}
                    className="bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Types</option>
                    <option value="Participation">Participation</option>
                    <option value="Achievement">Achievement / Winner</option>
                    <option value="Organizer">Organizer / Lead</option>
                  </select>

                  <select
                    value={certStatusFilter}
                    onChange={(e) => setCertStatusFilter(e.target.value)}
                    className="bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                {/* Bulk ZIP Downloads */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCertIds.size > 0 && (
                    <>
                      <button
                        onClick={() => handleDownloadCertificatesZip('pdf', true)}
                        disabled={downloadingZip}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                        title="Download selected certificates as PDFs ZIP"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" />
                        <span>Selected PDFs ZIP ({selectedCertIds.size})</span>
                      </button>

                      <button
                        onClick={() => handleDownloadCertificatesZip('png', true)}
                        disabled={downloadingZip}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                        title="Download selected certificates as PNGs ZIP"
                      >
                        <Download className="w-3.5 h-3.5 text-purple-400" />
                        <span>Selected PNGs ZIP ({selectedCertIds.size})</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDownloadCertificatesZip('pdf', false)}
                    disabled={downloadingZip || certificates.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                    title="Download all certificates as PDFs in a ZIP file"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>All PDFs ZIP ({certificates.length})</span>
                  </button>

                  <button
                    onClick={() => handleDownloadCertificatesZip('png', false)}
                    disabled={downloadingZip || certificates.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                    title="Download all certificates as PNGs in a ZIP file"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>All PNGs ZIP ({certificates.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Certificates Table with 9 Required Columns */}
            <div className="glass-iedc rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-400 uppercase font-mono tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredCerts.length > 0 &&
                            filteredCerts.every((c) => selectedCertIds.has(c.id || c.certificateId))
                          }
                          onChange={toggleSelectAllCerts}
                          className="rounded border-slate-700 text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D] cursor-pointer"
                          title="Select all certificates"
                        />
                      </th>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-4 font-bold">Recipient Name</th>
                      <th className="py-3 px-4 font-bold">Registration ID</th>
                      <th className="py-3 px-4 font-bold">Certificate ID</th>
                      <th className="py-3 px-4 font-bold">Certificate Type</th>
                      <th className="py-3 px-4 text-center font-bold">Attendance</th>
                      <th className="py-3 px-4 text-center font-bold">Generation Status</th>
                      <th className="py-3 px-4 text-center font-bold">Publication Status</th>
                      <th className="py-3 px-4 font-bold">Generated Date</th>
                      <th className="py-3 px-4 text-right font-bold">Available Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredCerts.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500">
                          <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm font-semibold">No certificates generated yet.</p>
                          <p className="text-xs mt-1">
                            Click &quot;Generate Certificates&quot; above to create certificates for all eligible present attendees.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCerts.map((cert, idx) => {
                        const certKey = cert.id || cert.certificateId;
                        const isSelected = selectedCertIds.has(certKey);
                        const reg = registrations.find(
                          (r) => r.id === cert.registrationId || r.studentName === cert.participantName
                        );
                        const attendanceStatus = reg?.attendance || (reg?.status === 'Attended' ? 'Present' : 'Present');
                        const safeName = (cert.participantName || 'Participant').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

                        return (
                          <tr
                            key={certKey}
                            className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-[#F98A5B]/[0.05]' : ''}`}
                          >
                            <td className="py-3 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOneCert(certKey)}
                                className="rounded border-slate-700 text-[#F98A5B] focus:ring-[#F98A5B] bg-[#18181D] cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                              {cert.participantName}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                              {cert.registrationId || reg?.registrationCode || reg?.id || 'N/A'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-[#F98A5B] whitespace-nowrap">
                              {cert.certificateId}
                            </td>
                            <td className="py-3 px-4 text-slate-300">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-medium text-[11px]">
                                {cert.certificateType || 'Participation'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                {attendanceStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                Ready (PDF+PNG)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleToggleSingleCertPublication(cert)}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  cert.status === 'Published'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                }`}
                                title="Click to toggle publication"
                              >
                                {cert.status === 'Published' ? 'Published' : 'Draft'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {cert.issueDate || cert.createdAt || cert.eventDate || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Preview */}
                                <a
                                  href={cert.pdfStorageUrl || `/certificates/${cert.certificateId}.pdf`}
                                  target="_blank"
                                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-mono text-[11px]"
                                  title="Preview PDF Certificate in new tab"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-400" /> Preview
                                </a>

                                {/* Download PDF */}
                                <a
                                  href={cert.pdfStorageUrl || `/certificates/${cert.certificateId}.pdf`}
                                  download={`Certificate_${safeName}_IEDC.pdf`}
                                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                  title="Download high-resolution PDF certificate"
                                >
                                  <Download className="w-3.5 h-3.5" /> PDF
                                </a>

                                {/* Download PNG */}
                                <a
                                  href={`/api/public/certificates/${cert.id || cert.certificateId}/png`}
                                  download={`Certificate_${safeName}_IEDC.png`}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                  title="Download companion PNG certificate"
                                >
                                  <Download className="w-3.5 h-3.5" /> PNG
                                </a>

                                {/* Regenerate */}
                                <button
                                  onClick={() => handleRegenerateSingleCert(cert)}
                                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-[#F98A5B] transition-colors cursor-pointer"
                                  title="Regenerate this certificate"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* TAB 6: REPORTS & DOWNLOADS                               */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="glass-iedc p-5 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold text-white">Reports &amp; Direct Downloads</h3>
            <p className="text-xs text-slate-400 mt-1">
              One-click instant exports for event registration records, attendance manifests, and certificate bundles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. All Participants Master Excel */}
            <div className="glass-iedc p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Full Participant Master (Excel)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Complete dataset of all {registrations.length} registered students including admission number, department, email, phone, attendance, and certificate ID.
                </p>
              </div>
              <button
                onClick={() => handleExportParticipantsExcel('all')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" /> Download .XLSX ({registrations.length})
              </button>
            </div>

            {/* 2. Present Participants Excel */}
            <div className="glass-iedc p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Present Attendees Only (Excel)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Export verified attendees ({presentCount} students) eligible for certificates with timestamped attendance records.
                </p>
              </div>
              <button
                onClick={() => handleExportParticipantsExcel('present')}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" /> Download Present .XLSX ({presentCount})
              </button>
            </div>

            {/* 3. Absent Participants Excel */}
            <div className="glass-iedc p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3">
                  <XCircle className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Absent Students (Excel)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Export absent participants ({absentCount} students) who did not attend the program.
                </p>
              </div>
              <button
                onClick={() => handleExportParticipantsExcel('absent')}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" /> Download Absent .XLSX ({absentCount})
              </button>
            </div>

            {/* 4. Participant List PDF */}
            <div className="glass-iedc p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Printable Participant Manifest (PDF)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Formatted landscape A4 PDF document suitable for official college reporting and desk registration verification.
                </p>
              </div>
              <button
                onClick={handleExportPdf}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" /> Download Printable PDF
              </button>
            </div>

            {/* 5. All Certificates PDF ZIP */}
            <div className="glass-iedc p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">All Certificates Bundle (PDF ZIP)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Archive containing individual high-quality PDF certificates for all {certificates.length} generated recipients.
                </p>
              </div>
              <button
                onClick={() => handleDownloadCertificatesZip('pdf', false)}
                disabled={certificates.length === 0 || downloadingZip}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download All PDFs (ZIP)
              </button>
            </div>

            {/* 6. All Certificates PNG ZIP */}
            <div className="glass-iedc p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">All Certificates Images (PNG ZIP)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Archive containing individual PNG images for social media sharing and digital distribution ({certificates.length} recipients).
                </p>
              </div>
              <button
                onClick={() => handleDownloadCertificatesZip('png', false)}
                disabled={certificates.length === 0 || downloadingZip}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download All PNGs (ZIP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: PROGRAM SETTINGS                                  */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="glass-iedc p-6 rounded-2xl border border-white/10 space-y-4 max-w-4xl">
          <h3 className="text-base font-bold text-white">Program Details & Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Program Title</label>
              <input
                type="text"
                value={program?.title || ''}
                onChange={(e) => setProgram({ ...program, title: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select
                value={program?.category || 'Workshop'}
                onChange={(e) => setProgram({ ...program, category: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Bootcamp">Bootcamp</option>
                <option value="Competition">Competition</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Training Program">Training Program</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Event Date</label>
              <input
                type="date"
                value={program?.date || ''}
                onChange={(e) => setProgram({ ...program, date: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Venue</label>
              <input
                type="text"
                value={program?.venue || ''}
                onChange={(e) => setProgram({ ...program, venue: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Organizing Body / Cell</label>
              <input
                type="text"
                value={program?.organizingBody || 'the IEDC Cell, Government Polytechnic College Perinthalmanna'}
                onChange={(e) => setProgram({ ...program, organizingBody: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Certificate Heading</label>
              <input
                type="text"
                value={program?.certificateHeading || 'CERTIFICATE OF PARTICIPATION'}
                onChange={(e) => setProgram({ ...program, certificateHeading: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Program Description</label>
            <textarea
              rows={3}
              value={program?.description || ''}
              onChange={(e) => setProgram({ ...program, description: e.target.value })}
              className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl p-3 text-xs text-white"
            />
          </div>

          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/events', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(program)
                });
                const json = await res.json();
                if (json.success) addToast('Program details updated', 'success');
              } catch (e: any) {
                addToast(e.message, 'error');
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white font-bold text-xs shadow-md shadow-[#F98A5B]/20"
          >
            Save Program Details
          </button>
        </div>
      )}

      {/* Add / Edit Participant Modal */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-iedc p-6 rounded-2xl border border-white/10 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingParticipant ? 'Edit Participant Details' : 'Add Participant Manually'}
            </h3>

            <form onSubmit={handleSaveParticipant} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={participantForm.studentName}
                  onChange={(e) => setParticipantForm({ ...participantForm, studentName: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Admission / Reg No</label>
                  <input
                    type="text"
                    required
                    value={participantForm.registerNumber}
                    onChange={(e) => setParticipantForm({ ...participantForm, registerNumber: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={participantForm.phone}
                    onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <select
                  value={participantForm.department}
                  onChange={(e) => setParticipantForm({ ...participantForm, department: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical and Electronics Engineering">Electrical &amp; Electronics Engineering (EEE)</option>
                  <option value="Electronics Engineering">Electronics Engineering</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={participantForm.email}
                  onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Leader Modal */}
      {showAddLeaderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="glass-iedc p-6 rounded-2xl border border-white/10 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Add Program Leader / Organizer</h3>

            <form onSubmit={handleSaveLeader} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Leader Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Anuroop P"
                  value={leaderForm.name}
                  onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Role / Designation</label>
                <select
                  value={leaderForm.role}
                  onChange={(e) => setLeaderForm({ ...leaderForm, role: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Student Lead">Student Lead</option>
                  <option value="Program Coordinator">Program Coordinator</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Faculty Coordinator">Faculty Coordinator</option>
                  <option value="Principal">Principal</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g. Electronics Engineering"
                  value={leaderForm.department}
                  onChange={(e) => setLeaderForm({ ...leaderForm, department: e.target.value })}
                  className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Mobile</label>
                  <input
                    type="text"
                    value={leaderForm.phone}
                    onChange={(e) => setLeaderForm({ ...leaderForm, phone: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={leaderForm.email}
                    onChange={(e) => setLeaderForm({ ...leaderForm, email: e.target.value })}
                    className="w-full bg-[#0B0B0D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddLeaderModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] text-white text-xs font-bold"
                >
                  Add Leader
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
