'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, FileText, Image as ImageIcon, X, RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon, Eye, Film } from 'lucide-react';

export interface FileUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  helperText?: string;
  isDocument?: boolean;
  isVideo?: boolean;
  required?: boolean;
  placeholder?: string;
}

export default function FileUpload({
  label,
  value,
  onChange,
  folder = 'website',
  accept = 'image/jpeg,image/png,image/webp,image/jpg',
  helperText,
  isDocument = false,
  isVideo = false,
  required = false,
  placeholder = 'Select file from computer or enter URL'
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);
    setProgress(15);

    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'Document'
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      setProgress(45);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      setProgress(85);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload file.');
      }

      setProgress(100);
      onChange(json.url);
      setSuccessMessage(`Uploaded: ${json.filename || file.name}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed. Please try again.');
      setFileDetails(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setFileDetails(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasDocExt = Boolean(value && value.match(/\.(pdf|docx|doc|xlsx|csv)(\?.*)?$/i));
  const hasImgExt = Boolean(value && (value.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i) || value.startsWith('data:image')));
  const isCurrentValueAnImage = hasImgExt || (!hasDocExt && !isDocument && !isVideo);
  const isCurrentValueADoc = hasDocExt || isDocument;

  return (
    <div className="space-y-2">
      {/* Label and Top Actions */}
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-300 flex items-center gap-1.5">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <LinkIcon className="w-3 h-3 text-[#F98A5B]" />
          <span>{showUrlInput ? 'Back to File Picker' : 'Enter URL manually'}</span>
        </button>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Mode A: URL input (secondary / backward compatible) */}
      {showUrlInput ? (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'https://...'}
              className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Paste direct external URL or switch back to upload directly from your computer folders.
          </span>
        </div>
      ) : (
        /* Mode B: Direct Local Computer Upload (Primary & Prominent) */
        <div className="space-y-2">
          {value ? (
            /* Selected / Uploaded File Card */
            <div className="p-3.5 rounded-2xl bg-[#18181F] border border-white/15 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 overflow-hidden">
                {/* Visual Thumbnail */}
                {isCurrentValueAnImage ? (
                  <div className="w-14 h-14 rounded-xl border border-white/15 bg-black/40 overflow-hidden relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={value}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : isVideo ? (
                  <div className="w-14 h-14 rounded-xl border border-white/15 bg-[#F98A5B]/10 flex items-center justify-center shrink-0">
                    <Film className="w-6 h-6 text-[#F98A5B]" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-white/15 bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                )}

                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">
                    {fileDetails?.name || value.split('/').pop() || 'Uploaded File'}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {fileDetails?.size ? `${fileDetails.size} • ` : ''}
                    {value.startsWith('http') ? 'Cloud Storage' : 'Local file'}
                  </p>
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#F98A5B] hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View / Open File</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Replace with another file from your computer"
                >
                  <RefreshCw className={`w-3 h-3 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Drag and Drop & Native File Picker Zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group ${
                isDragOver
                  ? 'border-[#F98A5B] bg-[#F98A5B]/10 scale-[0.99]'
                  : 'border-white/15 bg-[#141419] hover:bg-[#181820] hover:border-white/30'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:scale-110 transition-all">
                  {isDocument ? (
                    <FileText className="w-6 h-6 text-blue-400" />
                  ) : isVideo ? (
                    <Film className="w-6 h-6 text-[#F98A5B]" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-[#F98A5B]" />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white">
                    <span className="text-[#F98A5B] underline underline-offset-2">Choose File</span>
                    <span>or drag & drop here</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Select directly from folders on your PC. {helperText || 'Max size 25MB.'}
                  </p>
                </div>

                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                  <UploadCloud className="w-3 h-3 text-[#F98A5B]" />
                  <span>Upload from Computer</span>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-white/10">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#F98A5B]" />
                  Uploading to Cloud Storage...
                </span>
                <span className="text-[#F98A5B] font-bold">{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F98A5B] to-[#EC3A74] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
