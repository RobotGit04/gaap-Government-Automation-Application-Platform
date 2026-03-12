import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, FileText, TrendingUp, RotateCcw, Shield, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { adminAPI } from '../services/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#475569',
  DATA_COLLECTED: '#3b82f6',
  VALIDATED: '#06b6d4',
  SUBMITTED: '#eab308',
  FAILED: '#ef4444',
  RETRYING: '#f97316',
  APPROVED: '#22c55e',
  REJECTED: '#dc2626',
};

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.dashboard().then(r => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (!data) return null;

  const { overview, byStatus, byType, recentApplications, retryStats } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Admin Dashboard</h1>
        <p className="text-surface-400 mt-1">Platform analytics and monitoring</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: overview.totalApplications, icon: <FileText size={20} />, color: 'text-brand-400', bg: 'bg-brand-400/10' },
          { label: 'Total Users', value: overview.totalUsers, icon: <Users size={20} />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Success Rate', value: `${overview.successRate}%`, icon: <TrendingUp size={20} />, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Total Retries', value: retryStats.totalRetries, icon: <RotateCcw size={20} />, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        ].map(kpi => (
          <div key={kpi.label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color} flex-shrink-0`}>
              {kpi.icon}
            </div>
            <div>
              <div className={`font-display font-bold text-2xl ${kpi.color}`}>{kpi.value}</div>
              <div className="text-surface-400 text-xs mt-0.5">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Applications by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus} margin={{ left: -20, right: 10 }}>
              <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byStatus.map((entry: any, index: number) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.status] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Applications by Type */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Applications by Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byType}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ type, count }) => `${type.replace(/_/g, ' ')}: ${count}`}
                labelLine={false}
              >
                {byType.map((_: any, index: number) => (
                  <Cell key={index} fill={['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f97316'][index % 5]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Retry Analytics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-400/10 rounded-xl flex items-center justify-center">
            <RotateCcw size={18} className="text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{retryStats.totalRetries}</div>
            <div className="text-surface-400 text-xs">Total Retries</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{retryStats.successfulRetries}</div>
            <div className="text-surface-400 text-xs">Successful Retries</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-red-400/10 rounded-xl flex items-center justify-center">
            <XCircle size={18} className="text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{retryStats.failedRetries}</div>
            <div className="text-surface-400 text-xs">Failed Retries</div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Recent Applications</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-surface-700">
                <th className="pb-3 text-surface-400 font-medium">User</th>
                <th className="pb-3 text-surface-400 font-medium">Type</th>
                <th className="pb-3 text-surface-400 font-medium">Status</th>
                <th className="pb-3 text-surface-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {recentApplications.map((app: any) => (
                <tr key={app.id} className="hover:bg-surface-800/30 transition-colors">
                  <td className="py-3 text-white">{app.user?.name || 'N/A'}</td>
                  <td className="py-3 text-surface-300">{app.type.replace(/_/g, ' ')}</td>
                  <td className="py-3">
                    <span
                      className="status-badge text-xs border"
                      style={{
                        color: STATUS_COLORS[app.status],
                        background: `${STATUS_COLORS[app.status]}15`,
                        borderColor: `${STATUS_COLORS[app.status]}40`,
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 text-surface-400 text-xs">
                    {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
              {recentApplications.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-surface-500">No applications yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
