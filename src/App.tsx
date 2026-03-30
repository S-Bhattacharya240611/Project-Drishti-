/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { Shield, Eye, Volume2, Settings, Power, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial permissions
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        setHasPermissions(true);
        stream.getTracks().forEach(t => t.stop());
      })
      .catch(() => setHasPermissions(false));
  }, []);

  const toggleSystem = () => {
    if (!hasPermissions && !isActive) {
      alert("Please grant camera permissions to use the assistive vision system.");
      return;
    }
    setIsActive(!isActive);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">Drishti Assist</h1>
              <p className="text-xs text-zinc-400 font-medium">Offline Vision System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-zinc-800 rounded-full text-zinc-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              100% On-Device
            </div>
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="font-mono text-sm text-zinc-300">{status}</span>
          </div>
          <button
            onClick={toggleSystem}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 ${
              isActive 
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20'
            }`}
          >
            <Power className="w-5 h-5" />
            {isActive ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>

        {/* Main Camera View */}
        <div className="mb-8">
          <CameraView isActive={isActive} onStatusChange={setStatus} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Volume2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-medium">Audio Feedback</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Provides non-intrusive, prioritized voice alerts. High-danger obstacles interrupt lower-priority information to ensure safety.
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="font-medium">Indian Streets Optimized</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Logic tuned for mixed traffic, informal crossings, and crowded environments. Prioritizes approaching vehicles and close pedestrians.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Info className="w-5 h-5 text-emerald-400" />
              <h3 className="font-medium">Privacy First</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              All ML inference runs locally via WebAssembly. No video feeds or location data are ever sent to the cloud.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
