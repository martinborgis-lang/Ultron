'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Lien invalide ou manquant');
      return;
    }

    // Vérifier le token
    fetch(`/api/unsubscribe/verify?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setEmail(data.email);
          setStatus('ready');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Lien expiré ou invalide');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMessage('Erreur de connexion');
      });
  }, [token]);

  const handleUnsubscribe = async () => {
    setStatus('loading');

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json();
        setStatus('error');
        setErrorMessage(data.error || 'Erreur lors de la désinscription');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Erreur de connexion');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">

        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-4xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">
                Pour vous désinscrire, contactez :
              </p>
              <a
                href="mailto:martin.borgis@gmail.com"
                className="text-indigo-600 hover:underline font-medium"
              >
                martin.borgis@gmail.com
              </a>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Désinscription</h1>
            <p className="text-gray-600 mb-2">
              Vous allez vous désinscrire des emails commerciaux pour :
            </p>
            <p className="font-semibold text-gray-900 mb-6">{email}</p>
            <button
              onClick={handleUnsubscribe}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors mb-4"
            >
              Confirmer la désinscription
            </button>
            <p className="text-xs text-gray-500">
              <a
                href="/privacy"
                className="text-indigo-600 hover:underline"
                target="_blank"
              >
                Politique de confidentialité
              </a>
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Désinscription confirmée</h1>
            <p className="text-gray-600 mb-6">
              Vous ne recevrez plus d'emails commerciaux de notre part.
            </p>
            <p className="text-sm text-gray-500">Vous pouvez fermer cette page.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}