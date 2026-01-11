'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2 } from 'lucide-react';

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
    <Card className="shadow-xl border-0">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-indigo-600">
            <Bot className="h-8 w-8" />
            <span className="text-2xl font-bold">ULTRON</span>
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Creer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour commencer a automatiser votre prospection
          </CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jean Dupont"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Cabinet Patrimoine"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creation...
              </>
            ) : (
              'Creer mon compte'
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Deja un compte ?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
