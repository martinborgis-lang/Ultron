'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Check, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Vérifier s'il y a une session active (token de reset)
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Pas de session active, rediriger vers forgot-password
        router.push('/forgot-password');
      }
    };

    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);

    // Redirection après 3 secondes
    setTimeout(() => {
      router.push('/dashboard');
    }, 3000);
  }

  if (success) {
    return (
      <div className="relative">
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
          <div className="text-center pt-12 pb-8 px-10 sm:px-8">
            <div className="flex justify-center mb-6">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: '#22c55e',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Check style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--text-white)',
              letterSpacing: '-0.03em'
            }}>
              Mot de passe modifié !
            </h1>
            <p style={{
              color: 'var(--text-gray)',
              fontSize: '0.9rem',
              marginBottom: '24px'
            }}>
              Votre mot de passe a été mis à jour avec succès.
            </p>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              marginBottom: '32px'
            }}>
              Redirection vers le tableau de bord...
            </p>
            <div
              style={{
                width: '40px',
                height: '4px',
                background: 'var(--primary)',
                borderRadius: '2px',
                margin: '0 auto',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
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
            Nouveau mot de passe
          </h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', padding: '0 24px' }}>
            Choisissez un nouveau mot de passe sécurisé pour votre compte
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
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Nouveau mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box' as const,
                    padding: '10px 40px 10px 14px',
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '16px', height: '16px' }} />
                  ) : (
                    <Eye style={{ width: '16px', height: '16px' }} />
                  )}
                </button>
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

            <div style={{
              width: '100%',
              maxWidth: '300px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center'
            }}>
              • Minimum 8 caractères<br />
              • Mélange de lettres, chiffres et symboles recommandé
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
                  Modification...
                </>
              ) : (
                'Modifier le mot de passe'
              )}
            </button>
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