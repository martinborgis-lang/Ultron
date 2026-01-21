'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Bot, LayoutDashboard, Users, Settings, LogOut, Calculator, Calendar, Sliders, LayoutGrid, CheckSquare, Upload, MessageSquare, Video, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/useUser';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/pipeline', icon: LayoutGrid },
  { name: 'Prospects', href: '/prospects', icon: Users },
  { name: 'Planning', href: '/planning', icon: Calendar },
  { name: 'Reunions', href: '/meetings', icon: Video },
  { name: 'Importer', href: '/import', icon: Upload },
  { name: 'Configuration', href: '/settings', icon: Settings },
];

const features = [
  { name: 'Assistant IA', href: '/assistant', icon: MessageSquare },
  { name: 'Calculateur', href: '/features/calculateur', icon: Calculator },
  { name: 'Scoring IA', href: '/settings/scoring', icon: Sliders },
];

interface SidebarProps {
  userName?: string;
}

export function Sidebar({ userName }: SidebarProps) {
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
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-background border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <Bot className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        <span className="text-xl font-bold text-foreground">ULTRON</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
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

      {/* Legal links */}
      <div className="px-4 py-2">
        <Separator className="mb-2" />
        <div className="flex flex-col gap-1">
          <Link
            href="/privacy"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
          >
            Confidentialité
          </Link>
          <Link
            href="/legal"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
          >
            Mentions légales
          </Link>
        </div>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-border">
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
          className="w-full justify-start gap-3 mt-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Deconnexion
        </Button>
      </div>
    </div>
  );
}
