import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userName={user?.full_name || undefined} />
      <MobileNav userName={user?.full_name || undefined} />

      <div className="lg:pl-64">
        <Header userName={user?.full_name || undefined} userEmail={user?.email} />
        <main className="p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
