import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            Ultron
          </Link>
          <nav className="flex gap-4 text-sm">
            <a href="/login" className="text-gray-600 hover:text-indigo-600">
              Connexion
            </a>
          </nav>
        </div>
      </header>

      {/* Contenu */}
      {children}

      {/* Footer simple */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Martin Borgis - Ultron. Tous droits réservés.</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="/legal" className="hover:text-indigo-600">Mentions légales</a>
            <a href="/privacy" className="hover:text-indigo-600">Politique de confidentialité</a>
            <a href="mailto:martin.borgis@gmail.com" className="hover:text-indigo-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}