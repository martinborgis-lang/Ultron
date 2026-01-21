import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoogleSheetsConfig } from '@/components/settings/GoogleSheetsConfig';
import { PlaquetteConfig } from '@/components/settings/PlaquetteConfig';
import { TeamManager } from '@/components/settings/TeamManager';
import { PromptsEditor } from '@/components/settings/PromptsEditor';
import { ThemeSelector } from '@/components/settings/ThemeSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSpreadsheet, Users, Sparkles, Palette, Database, Settings } from 'lucide-react';
import Link from 'next/link';

async function getOrganizationData() {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('auth_id', authUser.id)
    .single();

  if (!user?.organization_id) {
    return null;
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('google_credentials, google_sheet_id, plaquette_url')
    .eq('id', user.organization_id)
    .single();

  return { org, userRole: user.role };
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
  const data = await getOrganizationData();

  const isGoogleConnected = !!data?.org?.google_credentials;
  const sheetId = data?.org?.google_sheet_id || null;
  const plaquetteId = data?.org?.plaquette_url || null;
  const userRole = data?.userRole || 'conseiller';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sheets" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Donnees</span>
          </TabsTrigger>
          <TabsTrigger value="sheets" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Sheets</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="data">
            <div className="border rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Source de donnees</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choisissez entre le mode CRM (base Supabase) ou Google Sheet pour stocker vos prospects et taches.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/settings/data-source"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Configurer la source de donnees
                </Link>

                {userRole === 'admin' && (
                  <Link
                    href="/settings/thresholds"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Seuils Dashboard Admin
                  </Link>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sheets">
            <div className="space-y-6">
              <Suspense fallback={<GoogleSheetsConfigSkeleton />}>
                <GoogleSheetsConfig
                  isGoogleConnected={isGoogleConnected}
                  initialSheetId={sheetId}
                />
              </Suspense>
              <PlaquetteConfig initialPlaquetteId={plaquetteId} />
            </div>
          </TabsContent>
          <TabsContent value="team">
            <TeamManager />
          </TabsContent>
          <TabsContent value="prompts">
            <PromptsEditor />
          </TabsContent>
          <TabsContent value="appearance">
            <ThemeSelector />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
