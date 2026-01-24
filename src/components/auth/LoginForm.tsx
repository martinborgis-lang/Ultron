'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="relative">
      {/* Floating elements for visual depth */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-xl opacity-70 animate-pulse"></div>
      <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400/5 via-violet-400/5 to-purple-400/5 rounded-2xl"></div>

      {/* Glassmorphism card */}
      <div className="relative bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/30 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none"></div>

        {/* Header */}
        <div className="relative text-center pt-8 pb-6 px-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <span className="text-3xl font-bold text-white tracking-tight">ULTRON</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Connexion</h1>
          <p className="text-white/70 text-lg">Connectez-vous pour accéder à votre espace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative px-8 pb-8">
          <div className="space-y-6">
            {error && (
              <div className="relative bg-red-500/20 border border-red-500/30 text-red-100 text-sm p-4 rounded-xl backdrop-blur-sm shadow-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-white/90 font-medium text-sm">
                Adresse email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 h-12 px-4 rounded-xl backdrop-blur-sm transition-all"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-violet-500/5 pointer-events-none"></div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-white/90 font-medium text-sm">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 h-12 px-4 rounded-xl backdrop-blur-sm transition-all"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-violet-500/5 pointer-events-none"></div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="relative w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-violet-700 text-white py-4 rounded-xl shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 font-semibold text-lg tracking-wide"
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                <span className="relative flex items-center justify-center">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </span>
              </Button>
            </div>

            <div className="pt-4 text-center">
              <p className="text-white/60 text-sm">
                Pas encore de compte ?{' '}
                <Link
                  href="/register"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-200 hover:underline"
                >
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Back to home link */}
      <div className="text-center mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-all duration-200 hover:scale-105 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Retour à l'accueil</span>
        </Link>
      </div>
    </div>
  );
}
