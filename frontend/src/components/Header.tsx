import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Terminal, Shield, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Terminal className="w-3.5 h-3.5 text-blue-600" />
          <span>Terraform Local Provider: Active</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Simulated Engine (Cost-Free)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user?.role === 'ADMIN' && (
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3.5 h-3.5" />
            Admin Privileges Enabled
          </span>
        )}

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-800">{user?.email}</p>
          <p className="text-[10px] text-slate-400 capitalize">{user?.role?.toLowerCase()} Mode</p>
        </div>
      </div>
    </header>
  );
};
