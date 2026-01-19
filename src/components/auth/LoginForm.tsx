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
      {/* Glassmorphism card */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="text-center pt-8 pb-6 px-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-2xl font-bold text-white">ULTRON</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connexion</h1>
          <p className="text-white/60">Connectez-vous pour acceder a votre espace</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white py-6 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>

            <p className="text-sm text-white/50 text-center pt-2">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Creer un compte
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Back to home link */}
      <div className="text-center mt-6">
        <Link
          href="/"
          className="text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Retour a l'accueil
        </Link>
      </div>
    </div>
  );
}
