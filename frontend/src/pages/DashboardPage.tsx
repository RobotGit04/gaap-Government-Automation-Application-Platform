import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText, Plus, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Loader2, RotateCcw
} from 'lucide-react';
import { applicationAPI } from '../services/api';
import { useAuthStore } from '../store/auth.store';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Draft', color: 'text-surface-400 bg-surface-800 border-surface-600', icon: <FileText size={12} /> },
  DATA_COLLECTED: { label: 'Data Collected', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', icon: <Clock size={12} /> },
  VALIDATED: { label: 'Validated', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30', icon: <CheckCircle2 size={12} /> },
  SUBMITTED: { label: 'Submitted', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', icon: <Clock size={12} /> },
  FAILED: { label: 'Failed', color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: <XCircle size={12} /> },
  RETRYING: { label: 'Retrying', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30', icon: <RotateCcw size={12} /> },
  APPROVED: { label: 'Approved', color: 'text-green-400 bg-green-400/10 border-green-400/30', icon: <CheckCircle2 size={12} /> },
  REJECTED: { label: 'Rejected', color: 'text-red-400 bg-red-400/10 border-red-400/30', icon: <XCircle size={12} /> },
};

const TYPE_LABELS: Record<string, string> = {
  PASSPORT: '🛂 Passport',
  DRIVING_LICENSE: '🚗 Driving License',
  SUBSIDY: '💰 Subsidy',
  BIRTH_CERTIFICATE: '📋 Birth Certificate',
  INCOME_CERTIFICATE: '📄 Income Certificate',
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationAPI.getMyApplications().then(r => r.data.data),
  });

  const applications = data || [];

  const stats = {
    total: applications.length,
    approved: applications.filter((a: any) => a.status === 'APPROVED').length,
    pending: applications.filter((a: any) => ['DRAFT', 'DATA_COLLECTED', 'VALIDATED', 'SUBMITTED', 'RETRYING'].includes(a.status)).length,
    failed: applications.filter((a: any) => a.status === 'FAILED').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
          <p className="text-surface-400 mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        <Link to="/applications/new" className="btn-primary">
          <Plus size={18} />
          New Application
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-surface-800' },
          { label: 'Approved', value: stats.approved, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'In Progress', value: stats.pending, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Failed', value: stats.failed, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-surface-400 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Applications list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-white">My Applications</h2>
          <span className="text-surface-400 text-sm">{applications.length} total</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-brand-400" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="text-surface-600 mx-auto mb-3" />
            <p className="text-surface-400 font-medium">No applications yet</p>
            <p className="text-surface-500 text-sm mt-1">Start by creating a new government application</p>
            <Link to="/applications/new" className="btn-primary inline-flex mt-4">
              <Plus size={16} />
              Create First Application
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.map((app: any) => {
              const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.DRAFT;
              const progress = app.totalSteps > 0 ? (app.currentStep / app.totalSteps) * 100 : 0;

              return (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center gap-4 p-4 bg-surface-800/50 hover:bg-surface-800 
                    border border-surface-700/30 hover:border-surface-600 rounded-xl 
                    transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-white font-medium text-sm">
                        {TYPE_LABELS[app.type] || app.type}
                      </span>
                      <span className={`status-badge border ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-surface-400 text-xs whitespace-nowrap">
                        Step {app.currentStep}/{app.totalSteps}
                      </span>
                    </div>
                    <p className="text-surface-500 text-xs mt-1">
                      {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-surface-500 group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
