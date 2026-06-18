import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => { setAuth(data); navigate('/dashboard'); },
    onError: () => toast.error('Invalid email or password'),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to OmniPost</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && mutation.mutate(form)} />
          </div>
          <button className="btn-primary w-full justify-center" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Sign in'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link to="/register" className="text-indigo-600 font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', workspaceName: '' });
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => { setAuth(data); navigate('/dashboard'); },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start managing all your platforms</p>
        </div>

        <div className="card p-6 space-y-4">
          {[
            { key: 'name', label: 'Full name', placeholder: 'Your name', type: 'text' },
            { key: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
            { key: 'password', label: 'Password', placeholder: 'At least 8 characters', type: 'password' },
            { key: 'workspaceName', label: 'Business / Workspace name', placeholder: 'Acme Co', type: 'text' },
          ].map(field => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input className="input" type={field.type} placeholder={field.placeholder} value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
            </div>
          ))}
          <button className="btn-primary w-full justify-center" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create account'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
