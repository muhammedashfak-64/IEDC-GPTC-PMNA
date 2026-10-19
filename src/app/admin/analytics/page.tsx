'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { TrendingUp, BarChart2, Download, Users, Award, Calendar, Lightbulb } from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

export default function AnalyticsReportsPage() {
  const { addToast } = useAdmin();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(console.error);
  }, []);

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    datasets: [
      {
        label: 'Cumulative Registrations',
        data: [120, 180, 240, 310, 380, 450, 540, 650],
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const barChartData = {
    labels: ['State Hackathon 2026', 'IoT Bootcamp', 'Idea Fest', 'YIP Orientation'],
    datasets: [
      {
        label: 'Event Attendance',
        data: [120, 60, 150, 95],
        backgroundColor: '#E5E5EA',
        borderRadius: 8
      }
    ]
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#A1A1AA', font: { family: 'monospace', size: 11 } }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#71717A' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#71717A' } }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            MODULE 21 / CORE &amp; ANALYTICS
          </span>
          <h1 className="text-2xl font-black text-white">Analytics &amp; Program Reports</h1>
          <p className="text-slate-400 text-xs">
            Comprehensive metric tracking for Kerala Startup Mission accreditation and college audit records.
          </p>
        </div>

        <button
          onClick={() => addToast('Report Downloaded', 'Analytics executive summary exported as PDF.', 'success')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Summary PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-base">Annual Innovation Member Growth</h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#121216] border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-base">Workshop Attendance by Program</h3>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
