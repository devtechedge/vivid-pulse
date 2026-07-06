'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, Loader2, ArrowRight, UserCheck } from 'lucide-react';
import { loginUser } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please provide all credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginUser({ usernameOrEmail, passwordHash: password });
      if (res.success) {
        router.push('/feed');
        router.refresh();
      } else {
        setError(res.error || 'Authentication rejected.');
      }
    } catch {
      setError('Critical system error during session start.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username: string) => {
    setLoading(true);
    setError('');
    setUsernameOrEmail(username);
    setPassword('password123');
    try {
      const res = await loginUser({ usernameOrEmail: username, passwordHash: 'password123' });
      if (res.success) {
        router.push('/feed');
        router.refresh();
      } else {
        setError(res.error || 'Quick login rejected.');
      }
    } catch {
      setError('Connection interrupted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070A13] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Neon Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950 border border-slate-900 rounded p-8 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(124,58,237,0.15)] flex flex-col gap-6 z-10 relative">
        
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center bg-violet-600 rounded shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-violet-400/20 italic font-bold text-2xl text-white">
            V
          </div>
          <h1 className="text-xl font-bold uppercase tracking-[0.25em] text-slate-100 mt-2">VividPulse</h1>
          <p className="text-xs font-medium text-slate-500 max-w-xs uppercase tracking-wider">
            Sovereign Visual Media & Neo-Noir Creation Network
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-semibold rounded flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="User Name or Email"
            type="text"
            placeholder="e.g. alex_vivid"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Password Token"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <Button type="submit" disabled={loading} className="w-full gap-2 py-3 mt-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating Protocol...
              </>
            ) : (
              <>
                Initialize Session
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Seeding accounts for review */}
        <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-900">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Aesthetic Quick Ports (Presigned)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('alex_vivid')}
              disabled={loading}
              suppressHydrationWarning
              className="px-3 py-2 bg-slate-900/50 hover:bg-violet-950/20 border border-slate-800 hover:border-violet-500/30 rounded text-[11px] font-medium text-slate-300 hover:text-violet-300 text-left flex items-center justify-between cursor-pointer"
            >
              <span>@alex_vivid</span>
              <UserCheck className="w-3 h-3 text-slate-600" />
            </button>
            <button
              onClick={() => handleQuickLogin('elena_pixels')}
              disabled={loading}
              suppressHydrationWarning
              className="px-3 py-2 bg-slate-900/50 hover:bg-violet-950/20 border border-slate-800 hover:border-violet-500/30 rounded text-[11px] font-medium text-slate-300 hover:text-violet-300 text-left flex items-center justify-between cursor-pointer"
            >
              <span>@elena_pixels</span>
              <UserCheck className="w-3 h-3 text-slate-600" />
            </button>
          </div>
          <span className="text-[9px] font-mono text-slate-600 text-center">
            Password is default: password123
          </span>
        </div>

        {/* Register redirection */}
        <div className="text-center pt-2">
          <span className="text-xs text-slate-500">New to the grid? </span>
          <Link href="/register" className="text-xs font-bold text-violet-400 hover:text-violet-300 hover:underline">
            Register New Profile
          </Link>
        </div>

      </div>
    </main>
  );
}
