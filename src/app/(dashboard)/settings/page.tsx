import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoogleSheetsConfig } from '@/components/settings/GoogleSheetsConfig';
import { TeamManager } from '@/components/settings/TeamManager';
import { PromptEditor } from '@/components/settings/PromptEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSpreadsheet, Users, Sparkles } from 'lucide-react';

async function getOrganizationData() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('auth_id', authUser.id)
    .single();

  if (!user?.organization_id) {
    return null;
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('google_credentials, google_sheet_id')
    .eq('id', user.organization_id)
    .single();

  return org;
}

function GoogleSheetsConfigSkeleton() {
  return (
    <div className="space-y-6 p-6 border rounded-xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default async function SettingsPage() {
  const org = await getOrganizationData();

  const isGoogleConnected = !!org?.google_credentials;
  const sheetId = org?.google_sheet_id || null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sheets" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="sheets" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Google Sheets</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Prompts IA</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="sheets">
            <Suspense fallback={<GoogleSheetsConfigSkeleton />}>
              <GoogleSheetsConfig
                isGoogleConnected={isGoogleConnected}
                initialSheetId={sheetId}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="team">
            <TeamManager />
          </TabsContent>
          <TabsContent value="prompts">
            <PromptEditor />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
