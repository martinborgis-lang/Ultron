'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AdminApiTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testAdminApi = async () => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔄 Testing admin API...');
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      console.log('📊 Admin API Response:', response.status, data);

      if (!response.ok) {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
        if (data.debug) {
          setError(prev => prev + ` | Debug: ${JSON.stringify(data.debug)}`);
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('❌ Admin API Error:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>🧪 Test API Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testAdminApi} disabled={testing}>
          {testing ? 'Test en cours...' : 'Tester /api/admin/stats'}
        </Button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <strong>Succès!</strong>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-48">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}