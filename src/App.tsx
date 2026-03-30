/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { Shield, Eye, Volume2, Settings, Power, AlertTriangle, Info, Languages } from 'lucide-react';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [lang, setLang] = useState<'en-IN' | 'hi-IN'>('en-IN');

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermissions(false);
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        setHasPermissions(true);
        stream.getTracks().forEach(t => t.stop());
      })
      .catch(() => setHasPermissions(false));
  }, []);

  const toggleLang = () => {
    setLang(prev => prev === 'en-IN' ? 'hi-IN' : 'en-IN');
  };

  const toggleSystem = () => {
    if (!hasPermissions && !isActive) {
      alert("Please grant camera permissions.");
      return;
    }
    setIsActive(!isActive);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* SOTA Glass Header */}
      <header className="border-b border-zinc-800 bg-black/60 sticky top-0 z-20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Drishti SOTA</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Autonomous Vision</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold transition-all border border-zinc-700 active:scale-95"
            >
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              {lang === 'en-IN' ? 'English' : 'हिंदी'}
            </button>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Status Dashboard */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-tighter">System Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="font-mono text-sm font-bold text-zinc-200 uppercase">{status}</span>
                </div>
             </div>
          </div>
          <button
            onClick={toggleSystem}
            className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-black transition-all active:scale-95 shadow-2xl ${
              isActive 
                ? 'bg-red-500/10 text-red-500 border-2 border-red-500/50 hover:bg-red-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-500 border-b-4 border-blue-800'
            }`}
          >
            <Power className="w-5 h-5" />
            {isActive ? 'SHUTDOWN' : 'ACTIVATE SYSTEM'}
          </button>
        </div>

        {/* Vision Matrix */}
        <div className="mb-8">
          <CameraView isActive={isActive} onStatusChange={setStatus} language={lang} />
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-80 hover:opacity-100 transition-opacity">
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <Volume2 className="w-5 h-5 text-blue-400 mb-3" />
            <h3 className="font-bold text-sm mb-1 uppercase tracking-wider">Haptic Guidance</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Directional vibrations provide silent alerts in noisy traffic environments.</p>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-amber-400 mb-3" />
            <h3 className="font-bold text-sm mb-1 uppercase tracking-wider">Vernacular AI</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Localized Hindi and English voice alerts optimized for the Indian sub-continent.</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <Shield className="w-5 h-5 text-emerald-400 mb-3" />
            <h3 className="font-bold text-sm mb-1 uppercase tracking-wider">SOTA Edge</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">100% On-Device WASM acceleration. No data leaves the device, ensuring total privacy.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
