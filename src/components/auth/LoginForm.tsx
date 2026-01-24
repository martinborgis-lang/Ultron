'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
      {/* Card avec le même style que la landing page */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6), var(--glow)',
          paddingTop: '70px',
          paddingBottom: '70px'
        }}
      >
        {/* Header */}
        <div className="text-center pt-12 pb-8 px-10 sm:px-8">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2 text-decoration-none">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'white' }}>
                  <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z"/>
                </svg>
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: 'var(--text-white)',
                  textDecoration: 'none'
                }}
              >
                ULTRON
              </span>
            </Link>
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text-white)',
            letterSpacing: '-0.03em',
            padding: '0 20px'
          }}>
            Connexion
          </h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', padding: '0 24px' }}>
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-10 pb-10 sm:px-8 sm:pb-8">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {error && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  padding: '12px 16px',
                  borderRadius: '8px'
                }}
              >
                {error}
              </div>
            )}

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: 500,
                marginTop: '8px'
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    style={{ width: '16px', height: '16px', marginRight: '8px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4m6 6h4m-6 6v4m-6-6H2" />
                  </svg>
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>

            <p style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginTop: '12px'
            }}>
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'var(--transition)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--primary-dark)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Back to home link */}
      <div className="text-center mt-8">
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'var(--transition)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--text-white)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg
            style={{ width: '16px', height: '16px', transition: 'var(--transition)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span style={{ fontWeight: 500 }}>Retour à l&apos;accueil</span>
        </Link>
      </div>
    </div>
  );
}
