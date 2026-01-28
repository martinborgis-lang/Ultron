import React from 'react';
import { CallHistoryContent } from '@/components/voice/CallHistoryContent';

export default function CallsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Historique des appels</h1>
        <p className="text-muted-foreground">
          Consultez l'historique de tous vos appels avec transcriptions et analyses IA
        </p>
      </div>

      <CallHistoryContent />
    </div>
  );
}