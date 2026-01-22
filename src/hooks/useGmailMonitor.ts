'use client';

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface GmailStatus {
  isConnected: boolean;
  isExpired: boolean;
  email?: string;
  lastChecked: Date | null;
  error?: string;
}

interface GmailMonitorOptions {
  userId: string;
  checkIntervalMinutes?: number;
  onTokenExpired?: (userId: string) => void;
  onConnectionLost?: (userId: string, error: string) => void;
}

export function useGmailMonitor({
  userId,
  checkIntervalMinutes = 30, // Vérifier toutes les 30 minutes
  onTokenExpired,
  onConnectionLost
}: GmailMonitorOptions) {
  const [status, setStatus] = useState<GmailStatus>({
    isConnected: false,
    isExpired: false,
    lastChecked: null
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const checkGmailStatus = useCallback(async () => {
    if (!userId) return;

    try {
      setIsMonitoring(true);
      logger.debug('[GmailMonitor] Checking status for user:', userId);

      const response = await fetch(`/api/team/${userId}/gmail/test`, {
        method: 'POST',
      });

      const data = await response.json();

      const newStatus: GmailStatus = {
        isConnected: data.success,
        isExpired: data.status === 'expired',
        email: data.details?.email,
        lastChecked: new Date(),
        error: data.success ? undefined : data.error
      };

      setStatus(newStatus);

      // Déclencher les callbacks si nécessaire
      if (data.status === 'expired' && onTokenExpired) {
        logger.warn('[GmailMonitor] Token expired for user:', userId);
        onTokenExpired(userId);
      } else if (!data.success && data.status !== 'not_configured' && onConnectionLost) {
        logger.error('[GmailMonitor] Connection lost for user:', userId, data.error);
        onConnectionLost(userId, data.error);
      }

    } catch (error) {
      logger.error('[GmailMonitor] Check failed:', error);
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Erreur de vérification',
        lastChecked: new Date()
      }));
    } finally {
      setIsMonitoring(false);
    }
  }, [userId, onTokenExpired, onConnectionLost]);

  // Test initial
  useEffect(() => {
    if (userId) {
      checkGmailStatus();
    }
  }, [userId, checkGmailStatus]);

  // Monitoring périodique
  useEffect(() => {
    if (!userId || checkIntervalMinutes <= 0) return;

    const interval = setInterval(checkGmailStatus, checkIntervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, checkIntervalMinutes, checkGmailStatus]);

  const forceCheck = useCallback(() => {
    checkGmailStatus();
  }, [checkGmailStatus]);

  return {
    status,
    isMonitoring,
    forceCheck
  };
}

// Hook pour afficher des notifications toast
export function useGmailAlerts(userId: string) {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>>([]);

  const addAlert = useCallback((type: 'warning' | 'error', message: string) => {
    const alert = {
      id: Math.random().toString(36).substring(7),
      type,
      message,
      timestamp: new Date()
    };

    setAlerts(prev => [...prev, alert]);

    // Auto-remove après 10 secondes
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 10000);
  }, []);

  const handleTokenExpired = useCallback((expiredUserId: string) => {
    if (expiredUserId === userId) {
      addAlert('warning', '⚠️ Votre token Gmail a expiré. Reconnectez-vous pour continuer à envoyer des emails.');
    }
  }, [userId, addAlert]);

  const handleConnectionLost = useCallback((lostUserId: string, error: string) => {
    if (lostUserId === userId) {
      addAlert('error', `❌ Connexion Gmail perdue: ${error}. Vérifiez votre configuration.`);
    }
  }, [userId, addAlert]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const { status, isMonitoring, forceCheck } = useGmailMonitor({
    userId,
    checkIntervalMinutes: 30,
    onTokenExpired: handleTokenExpired,
    onConnectionLost: handleConnectionLost
  });

  return {
    status,
    alerts,
    isMonitoring,
    forceCheck,
    dismissAlert
  };
}