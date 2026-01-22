'use client';

import { useEffect, useState } from 'react';
import { X, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GmailAlert {
  id: string;
  type: 'warning' | 'error';
  message: string;
  timestamp: Date;
}

interface GmailAlertsProps {
  alerts: GmailAlert[];
  onDismiss: (alertId: string) => void;
  onReconnect?: () => void;
}

export function GmailAlerts({ alerts, onDismiss, onReconnect }: GmailAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={`${
            alert.type === 'warning'
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
          }`}
        >
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {alert.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    alert.type === 'warning'
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {alert.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    alert.type === 'warning'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alert.type === 'warning' && onReconnect && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-amber-700 border-amber-300 hover:bg-amber-100"
                    onClick={onReconnect}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    <span className="text-xs">Reconnecter</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onDismiss(alert.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface GmailStatusIndicatorProps {
  isConnected: boolean;
  isExpired: boolean;
  isMonitoring: boolean;
  lastChecked: Date | null;
  email?: string;
  onTest?: () => void;
}

export function GmailStatusIndicator({
  isConnected,
  isExpired,
  isMonitoring,
  lastChecked,
  email,
  onTest
}: GmailStatusIndicatorProps) {
  const getStatusColor = () => {
    if (isExpired) return 'text-amber-600';
    if (isConnected) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (isExpired) return 'Token expiré';
    if (isConnected) return `Gmail connecté${email ? ` (${email})` : ''}`;
    return 'Gmail déconnecté';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isExpired ? 'bg-amber-500' :
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />
      <span className={`text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {lastChecked && (
        <span className="text-xs text-muted-foreground">
          ({lastChecked.toLocaleTimeString()})
        </span>
      )}
      {onTest && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1 text-xs"
          onClick={onTest}
          disabled={isMonitoring}
        >
          {isMonitoring ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            'Test'
          )}
        </Button>
      )}
    </div>
  );
}