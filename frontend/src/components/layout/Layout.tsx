import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Plus, Settings, LogOut,
  Menu, X, Shield, ChevronRight, Bell
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['CITIZEN', 'AGENT', 'ADMIN'] },
  { path: '/applications/new', label: 'New Application', icon: Plus, roles: ['CITIZEN', 'AGENT'] },
  { path: '/admin', label: 'Admin Panel', icon: Shield, roles: ['ADMIN'] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-30 h-full w-64 flex-shrink-0 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-surface-900 border-r border-surface-700/50 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-surface-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">GAAP</div>
              <div className="text-surface-400 text-xs mt-0.5">Gov Application Platform</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800'
                  }`}
              >
                <Icon size={18} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-surface-700/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-800/50 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-surface-400 text-xs capitalize">{user?.role?.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-surface-400 hover:text-red-400
              hover:bg-red-400/10 rounded-xl text-sm transition-all duration-200"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-surface-900/50 border-b border-surface-700/50 flex items-center px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-surface-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <button className="p-2 text-surface-400 hover:text-white transition-colors relative">
            <Bell size={18} />
          </button>
          <div className="h-8 w-px bg-surface-700" />
          <div className="text-sm">
            <span className="text-surface-400">Hello, </span>
            <span className="text-white font-medium">{user?.name?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
