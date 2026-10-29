'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, RefreshCw, CheckCircle2, AlertCircle, Plus, Eye } from 'lucide-react';

export interface MultiFileUploadProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  accept?: string;
  helperText?: string;
  maxFiles?: number;
}

export default function MultiFileUpload({
  label,
  values,
  onChange,
  folder = 'gallery',
  accept = 'image/jpeg,image/png,image/webp,image/jpg',
  helperText = 'Select multiple files from your computer',
  maxFiles = 20
}: MultiFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadBatch = async (files: FileList | File[]) => {
    setErrorMessage(null);
    setIsUploading(true);
    setUploadCount({ current: 0, total: files.length });

    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadCount({ current: i + 1, total: files.length });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        const json = await res.json();
        if (res.ok && json.success && json.url) {
          newUrls.push(json.url);
        } else {
          console.warn(`Failed to upload ${file.name}:`, json.error);
        }
      } catch (err: any) {
        console.warn(`Error uploading ${file.name}:`, err);
      }
    }

    setIsUploading(false);
    if (newUrls.length > 0) {
      onChange([...values, ...newUrls]);
    } else {
      setErrorMessage('No files were successfully uploaded. Please try again.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadBatch(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadBatch(e.dataTransfer.files);
    }
  };

  const removeAt = (index: number) => {
    const copy = [...values];
    copy.splice(index, 1);
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-300">
          {label} ({values.length} uploaded)
        </label>
        <span className="text-[10px] text-slate-400">Multiple files supported</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Grid of uploaded items */}
      {values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {values.map((url, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Quick add tile */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-xl border border-dashed border-white/20 hover:border-[#F98A5B] bg-white/5 hover:bg-[#F98A5B]/10 aspect-square flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 text-[#F98A5B]" />
            <span className="text-[10px] font-bold">Add More</span>
          </button>
        </div>
      )}

      {/* Main dropzone if empty or upload action */}
      {values.length === 0 && (
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
              ? 'border-[#F98A5B] bg-[#F98A5B]/10'
              : 'border-white/15 bg-[#141419] hover:bg-[#181820] hover:border-white/30'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F98A5B]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                <span className="text-[#F98A5B] underline underline-offset-2">Select multiple files</span> from computer
              </p>
              <p className="text-[10px] text-slate-400 mt-1">{helperText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Batch Upload Progress */}
      {isUploading && (
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3 text-xs font-mono text-white">
          <RefreshCw className="w-4 h-4 animate-spin text-[#F98A5B]" />
          <span>
            Uploading file {uploadCount.current} of {uploadCount.total} to Cloud Storage...
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
