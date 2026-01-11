import { TeamManager } from '@/components/settings/TeamManager';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  return (
    <div className="space-y-6">
      <TeamManager currentUserId={user?.id} />
    </div>
  );
}
