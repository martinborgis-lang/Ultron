'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSlug = (name: string) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${uniqueSuffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Erreur lors de la creation du compte');
      setLoading(false);
      return;
    }

    // 2. Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName,
        slug: generateSlug(companyName),
      })
      .select()
      .single();

    if (orgError || !orgData) {
      setError('Erreur lors de la creation de l\'organisation');
      setLoading(false);
      return;
    }

    // 3. Create user profile
    const { error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        organization_id: orgData.id,
        email,
        full_name: fullName,
        role: 'admin',
      });

    if (userError) {
      setError('Erreur lors de la creation du profil');
      setLoading(false);
      return;
    }

    // 4. Create default prompts
    const defaultPrompts = [
      { type: 'qualification', name: 'Qualification de prospect', system_prompt: 'Tu es un assistant specialise dans la qualification de prospects pour un cabinet de gestion de patrimoine.', user_prompt: 'Analyse ce prospect et determine son niveau de qualification (CHAUD, TIEDE, FROID).' },
      { type: 'synthese', name: 'Synthese de conversation', system_prompt: 'Tu es un assistant qui synthetise les conversations avec les prospects.', user_prompt: 'Cree une synthese de cette conversation.' },
      { type: 'rappel', name: 'Email de rappel', system_prompt: 'Tu es un assistant qui redige des emails de rappel professionnels et personnalises.', user_prompt: 'Redige un email de rappel pour ce prospect.' },
      { type: 'plaquette', name: 'Envoi de plaquette', system_prompt: 'Tu es un assistant qui redige des emails d\'accompagnement pour l\'envoi de plaquettes commerciales.', user_prompt: 'Redige un email pour accompagner l\'envoi de la plaquette.' },
    ];

    await supabase.from('prompts').insert(
      defaultPrompts.map((p) => ({
        ...p,
        organization_id: orgData.id,
      }))
    );

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
          <h1 className="text-2xl font-bold text-white mb-2">Creer un compte</h1>
          <p className="text-white/60">Inscrivez-vous pour commencer a automatiser votre prospection</p>
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
              <Label htmlFor="fullName" className="text-white/80">
                Nom complet
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-white/80">
                Nom de l&apos;entreprise
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Cabinet Patrimoine"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

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
                placeholder="Minimum 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
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
                  Creation...
                </>
              ) : (
                'Creer mon compte'
              )}
            </Button>

            <p className="text-sm text-white/50 text-center pt-2">
              Deja un compte ?{' '}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Se connecter
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
