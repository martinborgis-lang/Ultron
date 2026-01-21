'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AdminApiTest() {
  const [testing, setTesting] = useState(false);
  const [testingUserApi, setTestingUserApi] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userApiResult, setUserApiResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userApiError, setUserApiError] = useState<string | null>(null);

  const testUserApi = async () => {
    setTestingUserApi(true);
    setUserApiError(null);
    setUserApiResult(null);

    try {
      console.log('🔄 Testing user API...');
      const response = await fetch('/api/user/me');
      const data = await response.json();

      console.log('👤 User API Response:', response.status, data);

      if (!response.ok) {
        setUserApiError(`Error ${response.status}: ${data.error || 'Unknown error'}`);
      } else {
        setUserApiResult(data);
      }
    } catch (err) {
      console.error('❌ User API Error:', err);
      setUserApiError(`Network error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setTestingUserApi(false);
    }
  };

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
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testUserApi} disabled={testingUserApi}>
              {testingUserApi ? 'Test en cours...' : 'Tester /api/user/me'}
            </Button>
            <Button onClick={testAdminApi} disabled={testing}>
              {testing ? 'Test en cours...' : 'Tester /api/admin/stats'}
            </Button>
          </div>

          {userApiError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Erreur User API:</strong> {userApiError}
            </div>
          )}

          {userApiResult && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <strong>User API OK!</strong>
              <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(userApiResult, null, 2)}
              </pre>
            </div>
          )}

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
        </div>
      </CardContent>
    </Card>
  );
}