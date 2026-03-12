import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/auth.store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@gaap.gov.in', password: 'admin@123' },
      agent: { email: 'agent@gaap.gov.in', password: 'agent@123' },
      citizen: { email: 'citizen@example.com', password: 'citizen@123' },
    };
    const c = creds[role];
    setEmail(c.email);
    setPassword(c.password);
    setLoading(true);
    try {
      const res = await authAPI.login(c.email, c.password);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success(`Logged in as ${role}`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch {
      toast.error('Demo login failed - make sure backend is running');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950/30 via-surface-950 to-surface-950" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/30">
            <Shield size={26} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">GAAP</h1>
          <p className="text-surface-400 mt-1.5">Government Application Automation Platform</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="font-display font-semibold text-xl text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-700/50">
            <p className="text-surface-400 text-sm text-center mb-3">Quick demo access</p>
            <div className="grid grid-cols-3 gap-2">
              {['citizen', 'agent', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => demoLogin(role)}
                  disabled={loading}
                  className="py-2 px-3 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-xl text-xs text-surface-300 hover:text-white capitalize transition-all"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-surface-400 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
