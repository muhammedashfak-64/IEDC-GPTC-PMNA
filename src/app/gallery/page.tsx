'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Filter, X } from 'lucide-react';

export default function PublicGalleryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState('All');
  const [lightboxImg, setLightboxImg] = useState<any>(null);

  useEffect(() => {
    fetch('/api/public/gallery')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setImages(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const albums = Array.from(new Set(images.map((i) => i.albumName).filter(Boolean)));
  const filtered = images.filter((i) => selectedAlbum === 'All' || i.albumName === selectedAlbum);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 min-h-screen relative z-10 font-sans">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs font-mono font-bold tracking-wider uppercase">
          <ImageIcon className="w-4 h-4 text-amber-300" /> Campus Moments &amp; Hackathon Albums
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          IEDC Photo Gallery
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Explore photographs from state hackathons, hands-on maker space workshops, project prototype demonstrations, and campus startup events.
        </p>
      </div>

      {/* Album Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedAlbum('All')}
          className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors ${
            selectedAlbum === 'All' ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
          }`}
        >
          All Photos ({images.length})
        </button>
        {albums.map((alb) => (
          <button
            key={alb}
            onClick={() => setSelectedAlbum(alb)}
            className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors ${
              selectedAlbum === alb ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            {alb} ({images.filter((i) => i.albumName === alb).length})
          </button>
        ))}
      </div>

      {/* Masonry / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setLightboxImg(item)}
            className="group cursor-pointer rounded-3xl overflow-hidden bg-[#121216] border border-white/10 hover:border-white/20 transition-all space-y-3 p-3"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40">
              <img
                src={item.mediaUrl}
                alt={item.altText || item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/20">
                {item.albumName}
              </div>
            </div>

            <div className="px-2 pb-1 space-y-1">
              <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {item.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="max-w-4xl w-full bg-[#121216] border border-white/20 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 px-2">
              <div>
                <h3 className="font-bold text-white text-base">{lightboxImg.title}</h3>
                <span className="text-[11px] font-mono text-slate-400">{lightboxImg.albumName}</span>
              </div>
              <button
                onClick={() => setLightboxImg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img src={lightboxImg.mediaUrl} alt="" className="max-h-[70vh] w-auto object-contain" />
            </div>

            <p className="text-xs text-slate-300 px-2 leading-relaxed">{lightboxImg.caption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
