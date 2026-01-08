import { GoogleSheetsConfig } from '@/components/settings/GoogleSheetsConfig';
import { TeamManager } from '@/components/settings/TeamManager';
import { PromptEditor } from '@/components/settings/PromptEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, Users, Sparkles } from 'lucide-react';

export default function SettingsPage() {
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
            <GoogleSheetsConfig />
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
