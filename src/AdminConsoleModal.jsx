import React from 'react';
import { X } from 'lucide-react';
import AdminConsole from './AdminConsole';

export default function AdminConsoleModal({ isOpen = false, onClose = () => {}, ...props }) {
  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-3xl bg-[#0b0818] border border-purple-500/50 p-5 sm:p-6 space-y-3 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close Admin Console" className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer z-10">
          <X className="w-5 h-5" />
        </button>
        <div className="pr-8">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold">SHORTSPILOT.IN OWNER PANEL</span>
          <h3 className="text-base font-extrabold text-white mt-1">🔐 Owner Master Admin Console</h3>
        </div>
        <AdminConsole {...props} />
      </div>
    </div>
  );
}
