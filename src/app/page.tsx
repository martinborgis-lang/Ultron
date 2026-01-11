import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Mail, Users, Zap, BarChart3, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-zinc-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-zinc-900">ULTRON</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Creer un compte
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-8">
            <Zap className="h-4 w-4" />
            Powered by AI
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 mb-6 leading-tight">
            Automatisez votre
            <span className="text-indigo-600"> prospection </span>
            avec l&apos;IA
          </h1>

          <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto">
            Ultron aide les cabinets de gestion de patrimoine a qualifier leurs prospects,
            personnaliser leurs emails et optimiser leur taux de conversion.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6">
                Demarrer gratuitement
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-indigo-50 w-fit mb-4">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              Qualification intelligente
            </h3>
            <p className="text-zinc-600">
              L&apos;IA analyse vos prospects et les classe automatiquement en chaud, tiede ou froid
              selon leur potentiel.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-green-50 w-fit mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              Emails personnalises
            </h3>
            <p className="text-zinc-600">
              Generez des emails de suivi, de rappel ou d&apos;envoi de plaquette parfaitement
              personnalises pour chaque prospect.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
            <div className="p-3 rounded-xl bg-amber-50 w-fit mb-4">
              <BarChart3 className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">
              Dashboard en temps reel
            </h3>
            <p className="text-zinc-600">
              Suivez vos performances avec des statistiques detaillees et des graphiques
              d&apos;evolution de votre pipeline.
            </p>
          </div>
        </div>

        {/* Trust */}
        <div className="mt-32 text-center">
          <div className="inline-flex items-center gap-2 text-zinc-500 mb-8">
            <Shield className="h-5 w-5" />
            <span>Vos donnees sont securisees et hebergees en France</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-zinc-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Bot className="h-5 w-5" />
            <span className="font-medium">ULTRON</span>
          </div>
          <p className="text-sm text-zinc-400">
            2024 Ultron. Tous droits reserves.
          </p>
        </div>
      </footer>
    </div>
  );
}
