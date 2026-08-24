'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { registerUser } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all required credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await registerUser({
        username,
        email,
        passwordHash: password,
        displayName: displayName || username,
        bio: bio.substring(0, 150),
      });

      if (res.success) {
        router.push('/feed');
        router.refresh();
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch {
      setError('System crash during profile registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070A13] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950 border border-slate-900 rounded p-8 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(124,58,237,0.15)] flex flex-col gap-5 z-10 relative">
        
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="w-11 h-11 flex items-center justify-center bg-violet-600 rounded shadow-[0_0_20px_rgba(124,58,237,0.5)] border border-violet-400/20 italic font-bold text-xl text-white">
            V
          </div>
          <h1 className="text-lg font-bold uppercase tracking-[0.25em] text-slate-100 mt-2">Create Identity</h1>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            Register your cryptographic signature on the Pulse
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-semibold rounded flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
          <Input
            label="Username (Lowercase, No spaces)"
            type="text"
            placeholder="e.g. cyber_vance"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            disabled={loading}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. user@vividpulse.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Display/Screen Name"
            type="text"
            placeholder="e.g. Lucas Vance"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Short Biography (Bio)</label>
            <textarea
              placeholder="Tell the digital sphere who you are (max 150 chars)..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              maxLength={150}
              suppressHydrationWarning
              className="w-full bg-slate-900/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 px-4 py-2 text-sm rounded outline-none focus:border-violet-500/80 transition-all resize-none h-18"
            />
          </div>

          <Input
            label="Session Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <Button type="submit" disabled={loading} className="w-full gap-2 py-3 mt-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Seeding Identity...
              </>
            ) : (
              <>
                Sync Profile Signature
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-1.5">
          <span className="text-xs text-slate-500">Already have a signature? </span>
          <Link href="/login" className="text-xs font-bold text-violet-400 hover:text-violet-300 hover:underline">
            Port Session Login
          </Link>
        </div>

      </div>
    </main>
  );
}
