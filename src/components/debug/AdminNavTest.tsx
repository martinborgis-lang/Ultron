'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink } from 'lucide-react';

export function AdminNavTest() {
  const { user } = useUser();

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🔗 Test Navigation Admin</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div><strong>Condition sidebar:</strong> user?.role === 'admin'</div>
          <div><strong>Result:</strong> {user?.role === 'admin' ? '✅ TRUE' : '❌ FALSE'}</div>
          <div><strong>User role value:</strong> "{user?.role}"</div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Tests de navigation :</h4>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin">
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Aller à /admin
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => window.open('/admin', '_blank')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Ouvrir /admin (nouvel onglet)
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="p-2 bg-gray-50 rounded text-xs">
          <strong>Vérification sidebar :</strong> Le lien admin devrait apparaître dans la sidebar si role = 'admin'
        </div>
      </CardContent>
    </Card>
  );
}