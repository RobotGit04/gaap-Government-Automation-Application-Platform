import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/auth.store';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CITIZEN' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { user, token } = res.data.data;
      setAuth(user, token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950/30 via-surface-950 to-surface-950" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/30">
            <Shield size={26} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Create Account</h1>
          <p className="text-surface-400 mt-1.5">Join GAAP – simplify government applications</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" value={form.name} onChange={update('name')} className="input-field" placeholder="Rajesh Kumar Singh" required />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" value={form.email} onChange={update('email')} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" value={form.phone} onChange={update('phone')} className="input-field" placeholder="9876543210" required />
            </div>
            <div>
              <label className="label">Account Type</label>
              <select value={form.role} onChange={update('role')} className="input-field">
                <option value="CITIZEN">Citizen</option>
                <option value="AGENT">Agent</option>
              </select>
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={form.password} onChange={update('password')} className="input-field" placeholder="Min 8 characters" minLength={8} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-surface-400 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
