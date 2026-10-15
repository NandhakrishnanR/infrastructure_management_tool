import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  PlusCircle,
  HardDrive,
  CheckSquare,
  Activity,
  ShieldCheck,
  Cpu,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'My Requests', to: '/requests', icon: Server },
    { name: 'Request VM', to: '/requests/new', icon: PlusCircle },
    { name: 'VM Inventory', to: '/inventory', icon: HardDrive },
    // Admin only
    ...(isAdmin
      ? [{ name: 'Approvals', to: '/approvals', icon: CheckSquare, badge: 'Admin' }]
      : []),
    { name: 'Provisioning Jobs', to: '/jobs', icon: Activity },
    ...(isAdmin
      ? [
          { name: 'Audit Logs', to: '/audit-logs', icon: ShieldCheck, badge: 'Admin' },
          { name: 'Resource Quotas', to: '/quotas', icon: Sliders, badge: 'Admin' },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col min-h-screen text-slate-300 border-r border-slate-800 flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white block">InfraPilot</span>
          <span className="text-[10px] text-blue-400 font-mono uppercase tracking-wider block">Enterprise Cloud</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Infrastructure Portal
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 border border-slate-600">
              {user?.name?.slice(0, 2).toUpperCase() || 'IP'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-block text-[10px] text-slate-400 truncate">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
