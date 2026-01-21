'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, AlertCircle, XCircle, User, Calendar, Target, Clock
} from 'lucide-react';
import type { AdminDashboardStats } from '@/types/crm';

interface AlertsPanelProps {
  alerts: AdminDashboardStats['alerts'];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_conversion':
        return Target;
      case 'inactive_advisor':
        return User;
      case 'missed_rdv':
        return Calendar;
      case 'overdue_tasks':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <AlertCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Tout va bien !</h3>
              <p className="text-sm text-green-700">
                Aucune alerte critique détectée dans votre cabinet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Alertes & Points d'Attention
            <Badge variant="destructive" className="ml-2">
              {alerts.filter(a => a.severity === 'high').length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const Icon = getAlertIcon(alert.type);

            return (
              <Alert
                key={index}
                variant={getAlertVariant(alert.severity) as any}
                className="border-l-4"
                style={{
                  borderLeftColor:
                    alert.severity === 'high' ? '#dc2626' :
                    alert.severity === 'medium' ? '#d97706' : '#2563eb'
                }}
              >
                <Icon className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getAlertVariant(alert.severity) as any} className="text-xs">
                          {alert.severity === 'high' ? 'Critique' :
                           alert.severity === 'medium' ? 'Important' : 'Info'}
                        </Badge>
                        {alert.advisor_name && (
                          <span className="text-sm font-medium">{alert.advisor_name}</span>
                        )}
                      </div>
                      <p className="text-sm">{alert.message}</p>

                      {/* Actions suggérées */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {alert.type === 'low_conversion' && (
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Programmer formation
                          </Button>
                        )}
                        {alert.type === 'inactive_advisor' && (
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Programmer entretien
                          </Button>
                        )}
                        {alert.type === 'missed_rdv' && (
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Analyser les causes
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs h-7">
                          Marquer comme traité
                        </Button>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>

        {/* Résumé des alertes par type */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Résumé</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-700">
                {alerts.filter(a => a.severity === 'high').length}
              </div>
              <div className="text-xs text-red-600">Critiques</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-700">
                {alerts.filter(a => a.severity === 'medium').length}
              </div>
              <div className="text-xs text-yellow-600">Importantes</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-700">
                {alerts.filter(a => a.severity === 'low').length}
              </div>
              <div className="text-xs text-blue-600">Informations</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-700">
                {new Set(alerts.filter(a => a.advisor_id).map(a => a.advisor_id)).size}
              </div>
              <div className="text-xs text-gray-600">Conseillers concernés</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}