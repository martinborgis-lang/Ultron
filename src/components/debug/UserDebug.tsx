'use client';

import { useUser } from '@/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UserDebug() {
  const { user, authUser, loading } = useUser();

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🔍 Debug User Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div><strong>Auth User ID:</strong> {authUser?.id || 'None'}</div>
          <div><strong>User Profile:</strong> {user ? 'Loaded' : 'Not loaded'}</div>
          {user && (
            <div className="space-y-1">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Role:</strong> <span className="font-bold text-red-600">{user.role}</span></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}