
'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { Cpu, Plus, Search, Trash2, Edit3, Code2, ExternalLink, CheckCircle2 } from 'lucide-react';
import FileUpload from '@/components/admin/FileUpload';

export default function AdminProjectsPage() {
  const { addToast } = useAdmin();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: 'Electronics Engineering',
    technology: 'ESP32, Python, OpenCV',
    year: '2026',
    status: 'Incubated',
    author: '',
    mentor: 'Prof. Muhammed Rashid',
    githubUrl: '',
    demoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
    teamMembers: '',
    publicationStatus: 'Published'
  });

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/projects')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProjects(json.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      department: 'Electronics Engineering',
      technology: 'ESP32, Python, LoRa',
      year: '2026',
      status: 'Incubated',
      author: '',
      mentor: 'Prof. Muhammed Rashid',
      githubUrl: '',
      demoUrl: '',
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80',
      teamMembers: '',
      publicationStatus: 'Published'
    });
    setShowModal(true);
  };

  const openEdit = (proj: any) => {
    setEditingProject(proj);
    setFormData({
      title: proj.title,
      description: proj.description,
      department: proj.department,
      technology: Array.isArray(proj.technology) ? proj.technology.join(', ') : proj.technology,
      year: proj.year || '2026',
      status: proj.status || 'Prototype',
      author: proj.author,
      mentor: proj.mentor || '',
      githubUrl: proj.githubUrl || '',
      demoUrl: proj.demoUrl || '',
      imageUrl: proj.imageUrl || '',
      teamMembers: Array.isArray(proj.teamMembers) ? proj.teamMembers.join(', ') : proj.teamMembers,
      publicationStatus: proj.publicationStatus || 'Published'
    });
    setShowModal(true);
  };

  const handleTogglePublish = async (proj: any) => {
    const newStatus = proj.publicationStatus === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: proj.id, publicationStatus: newStatus })
      });
      if (res.ok) {
        addToast('Project Status Updated', `${proj.title} marked as ${newStatus}`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete project "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Deleted', `Project ${title} removed.`, 'info');
        loadData();
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        const res = await fetch('/api/admin/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProject.id, ...formData })
        });
        if (res.ok) {
          addToast('Project Updated', `Saved changes to ${formData.title}`, 'success');
          setShowModal(false);
          loadData();
        }
      } else {
        const res = await fetch('/api/admin/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          addToast('Project Added', `Published ${formData.title}`, 'success');
          setShowModal(false);
          loadData();
        }
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const filtered = projects.filter((p) =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 11 / INNOVATION &amp; ACADEMICS
          </span>
          <h1 className="text-2xl font-black text-white">Student Projects &amp; Prototypes</h1>
          <p className="text-slate-400 text-xs">
            Showcase student-engineered hardware rovers, IoT devices, software apps, and patent-pending inventions.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-2 hover:bg-slate-200 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-[#121216] border border-white/10 relative">
        <Search className="w-4 h-4 absolute left-7 top-7 text-slate-400" />
        <input
          type="text"
          placeholder="Search by project title, department, or student author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#18181D] border border-white/10 focus:border-white/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((proj) => (
          <div key={proj.id} className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={proj.imageUrl || '/campus-main.jpeg'}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                  />
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{proj.title}</h3>
                    <span className="text-[11px] font-mono text-slate-400">{proj.department} • {proj.year}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePublish(proj)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border cursor-pointer ${proj.publicationStatus === 'Published'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                    }`}
                >
                  {proj.publicationStatus === 'Published' ? 'Published' : 'Draft'}
                </button>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{proj.description}</p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(Array.isArray(proj.technology) ? proj.technology : (proj.technology || '').split(',')).map((tech: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-300 border border-white/10">
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-400">
                Lead: <span className="text-white font-medium">{proj.author}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {proj.githubUrl && (
                  <a href={proj.githubUrl} target="_blank" rel="noreferrer" title="Source Code" className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                    <Code2 className="w-4 h-4" />
                  </a>
                )}
                {proj.demoUrl && (
                  <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => openEdit(proj)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(proj.id, proj.title)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProject ? 'Edit Project' : 'Add Student Project'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Solar Campus Rover"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed prototype explanation..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#18181D] border border-white/10 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering (EEE)</option>
                    <option value="Electronics Engineering">Electronics Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Technology Stack</label>
                  <input
                    type="text"
                    placeholder="ESP32, Python, OpenCV"
                    value={formData.technology}
                    onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Project Lead / Author</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul V & Team"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Faculty Mentor</label>
                  <input
                    type="text"
                    placeholder="Prof. Muhammed Rashid"
                    value={formData.mentor}
                    onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">GitHub Repository Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">Live Demo Link</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.demoUrl}
                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                    className="w-full bg-[#18181D] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <FileUpload
                  label="Project Prototype Photograph"
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  folder="projects"
                  accept="image/jpeg,image/png,image/webp"
                  helperText="Upload hardware prototype, circuitry, or interface screenshot from your PC"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold">
                  {editingProject ? 'Save Changes' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
