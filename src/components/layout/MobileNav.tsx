'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Bot, LayoutDashboard, Users, Settings, LogOut, Menu, Calendar, LayoutGrid, CheckSquare, Upload, MessageSquare, Video, Shield, Search, Linkedin, Phone, Mic, Receipt, Calculator, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/useUser';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/pipeline', icon: LayoutGrid },
  { name: 'Prospects', href: '/prospects', icon: Users },
  { name: 'Lead Finder', href: '/leads-finder', icon: Search },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Appels', href: '/voice/calls', icon: Phone },
  { name: 'Test Formulaire', href: '/voice/form-test', icon: CheckSquare },
  { name: 'Reunions', href: '/meetings', icon: Video },
  { name: 'Importer', href: '/import', icon: Upload },
  { name: 'Configuration', href: '/settings', icon: Settings },
];

const features = [
  { name: 'Assistant IA', href: '/assistant', icon: MessageSquare },
  { name: 'Agent Vocal IA', href: '/voice/ai-agent', icon: Mic },
  { name: 'LinkedIn Agent', href: '/linkedin-agent', icon: Linkedin },
  { name: 'Calculateur', href: '/features/calculateur', icon: Calculator },
  { name: 'Défiscalisation', href: '/features/defiscalisation', icon: Receipt },
  { name: 'Scoring IA', href: '/settings/scoring', icon: Sliders },
];

interface MobileNavProps {
  userName?: string;
}

export function MobileNav({ userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="h-7 w-7 text-indigo-600" />
          <span className="text-lg font-bold text-foreground">ULTRON</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              {/* Logo - Fixed at top */}
              <div className="flex items-center gap-2 px-6 py-5 shrink-0">
                <Bot className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-foreground">ULTRON</span>
              </div>

              <Separator className="shrink-0" />

              {/* Navigation - Scrollable area */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Features section */}
                <div className="pt-4">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Outils
                  </p>
                  {features.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>

                {/* Admin section - only for admin users */}
                {user?.role === 'admin' && (
                  <div className="pt-4">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Administration
                    </p>
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        pathname === '/admin' || pathname.startsWith('/admin/')
                          ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 border border-red-200'
                          : 'text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400'
                      )}
                    >
                      <Shield className="h-5 w-5" />
                      Dashboard Admin
                    </Link>
                  </div>
                )}
              </nav>

              {/* User section - Fixed at bottom */}
              <div className="p-4 border-t border-border shrink-0">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {userName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {userName || 'Utilisateur'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 mt-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                  Deconnexion
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
