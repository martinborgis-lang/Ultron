'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Types pour le widget d'appel
interface CallWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId?: string;
  prospectName: string;
  phoneNumber: string;
  onCallCompleted?: (outcome: string, notes: string) => void;
}

interface CallState {
  status: 'initializing' | 'calling' | 'ringing' | 'in-progress' | 'ended' | 'failed';
  startTime?: Date;
  duration: number;
  error?: string;
}

// Types pour Twilio Device (ajout pour TypeScript)
declare global {
  interface Window {
    Twilio?: any;
  }
}

export function CallWidget({
  isOpen,
  onClose,
  prospectId,
  prospectName,
  phoneNumber,
  onCallCompleted
}: CallWidgetProps) {
  // États du composant
  const [callState, setCallState] = useState<CallState>({
    status: 'initializing',
    duration: 0
  });
  const [isMuted, setIsMuted] = useState(false);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');

  // Refs pour Twilio Device et timer
  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callSidRef = useRef<string>('');

  // Formatage du temps
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialisation du Twilio Device
  useEffect(() => {
    if (isOpen && !deviceRef.current) {
      initializeTwilioDevice();
    }

    return () => {
      cleanup();
    };
  }, [isOpen]);

  // Timer pour la durée d'appel
  useEffect(() => {
    if (callState.status === 'in-progress') {
      timerRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState.status]);

  const initializeTwilioDevice = async () => {
    try {
      // Chargement du SDK Twilio Voice
      if (!window.Twilio) {
        const script = document.createElement('script');
        script.src = 'https://sdk.twilio.com/js/voice/releases/2.18.0/twilio.min.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Récupération du token Twilio
      const tokenResponse = await fetch('/api/voice/click-to-call/token');
      if (!tokenResponse.ok) {
        throw new Error('Erreur lors de la récupération du token');
      }

      const { token, identity } = await tokenResponse.json();

      // Initialisation du Device
      const device = new window.Twilio.Device(token, {
        logLevel: 1,
        edge: 'frankfurt' // Serveur le plus proche pour l'Europe
      });

      // Gestion des événements du device
      device.on('registered', () => {
        console.log('Twilio Device prêt');
        setCallState(prev => ({ ...prev, status: 'calling' }));
        makeCall();
      });

      device.on('error', (error: any) => {
        console.error('Erreur Twilio Device:', error);
        setCallState(prev => ({
          ...prev,
          status: 'failed',
          error: error.message || 'Erreur de connexion'
        }));
      });

      device.on('incoming', (call: any) => {
        console.log('Appel entrant:', call);
        // Gérer les appels entrants si nécessaire
      });

      deviceRef.current = device;

      // Enregistrement du device
      await device.register();

    } catch (error) {
      console.error('Erreur initialisation Twilio:', error);
      setCallState(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erreur d\'initialisation'
      }));
    }
  };

  const makeCall = async () => {
    if (!deviceRef.current) {
      return;
    }

    try {
      // Appel via l'API pour enregistrer en base et obtenir le call SID
      const callResponse = await fetch('/api/voice/click-to-call/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectId,
          phoneNumber,
          prospectName
        })
      });

      if (!callResponse.ok) {
        throw new Error('Erreur lors de l\'initiation de l\'appel');
      }

      const callData = await callResponse.json();
      callSidRef.current = callData.callSid;

      // Initiation de l'appel WebRTC
      const params = {
        To: phoneNumber,
        ProspectId: prospectId,
        ProspectName: prospectName
      };

      const call = await deviceRef.current.connect(params);
      callRef.current = call;

      // Gestion des événements de l'appel
      call.on('accept', () => {
        console.log('Appel accepté');
        setCallState(prev => ({
          ...prev,
          status: 'ringing'
        }));
      });

      call.on('connect', () => {
        console.log('Appel connecté');
        setCallState(prev => ({
          ...prev,
          status: 'in-progress',
          startTime: new Date(),
          duration: 0
        }));
      });

      call.on('disconnect', () => {
        console.log('Appel terminé');
        setCallState(prev => ({
          ...prev,
          status: 'ended'
        }));
      });

      call.on('error', (error: any) => {
        console.error('Erreur appel:', error);
        setCallState(prev => ({
          ...prev,
          status: 'failed',
          error: error.message || 'Erreur pendant l\'appel'
        }));
      });

    } catch (error) {
      console.error('Erreur makeCall:', error);
      setCallState(prev => ({
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erreur lors de l\'appel'
      }));
    }
  };

  const hangupCall = async () => {
    try {
      // Raccrochage via WebRTC
      if (callRef.current) {
        callRef.current.disconnect();
      }

      // Notification au serveur
      if (callSidRef.current) {
        await fetch('/api/voice/click-to-call/hangup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callSid: callSidRef.current,
            outcome,
            notes
          })
        });
      }

      setCallState(prev => ({
        ...prev,
        status: 'ended'
      }));

    } catch (error) {
      console.error('Erreur hangup:', error);
    }
  };

  const toggleMute = () => {
    if (callRef.current) {
      const newMutedState = !isMuted;
      callRef.current.mute(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const saveNotesAndClose = async () => {
    try {
      if (callSidRef.current && (notes || outcome)) {
        await fetch('/api/voice/click-to-call/save-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callSid: callSidRef.current,
            notes,
            outcome,
            nextAction: nextAction !== '' ? nextAction : null,
            prospectUpdate: outcome ? { stage: getStageFromOutcome(outcome) } : null
          })
        });
      }

      if (onCallCompleted) {
        onCallCompleted(outcome, notes);
      }

      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      onClose(); // Fermer même en cas d'erreur
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (callRef.current) {
      callRef.current.disconnect();
    }
    if (deviceRef.current) {
      deviceRef.current.destroy();
    }
  };

  const getStageFromOutcome = (outcome: string): string => {
    const stageMapping: { [key: string]: string } = {
      'rdv_pris': 'rdv_pris',
      'pas_interesse': 'perdu',
      'callback_demande': 'callback',
      'information_demandee': 'information',
      'a_rappeler': 'nouveau'
    };
    return stageMapping[outcome] || 'nouveau';
  };

  const getStatusBadge = () => {
    const statusConfig = {
      'initializing': { label: 'Initialisation...', variant: 'secondary' as const, icon: Clock },
      'calling': { label: 'Appel en cours...', variant: 'default' as const, icon: Phone },
      'ringing': { label: 'Sonnerie...', variant: 'default' as const, icon: Phone },
      'in-progress': { label: 'En cours', variant: 'default' as const, icon: Phone },
      'ended': { label: 'Terminé', variant: 'outline' as const, icon: CheckCircle2 },
      'failed': { label: 'Échec', variant: 'destructive' as const, icon: AlertCircle }
    };

    const config = statusConfig[callState.status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent size={12} />
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone size={20} />
            Appel en cours
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du prospect */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{prospectName}</h3>
                  <p className="text-sm text-muted-foreground">{phoneNumber}</p>
                </div>
                {getStatusBadge()}
              </div>
            </CardContent>
          </Card>

          {/* Timer et contrôles d'appel */}
          {callState.status === 'in-progress' && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 mb-4">
                  {formatDuration(callState.duration)}
                </div>
                <div className="flex justify-center gap-3">
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    {isMuted ? 'Activer' : 'Couper'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={hangupCall}
                  >
                    <PhoneOff size={16} />
                    Raccrocher
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Affichage d'erreur */}
          {callState.status === 'failed' && callState.error && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle size={16} />
                  <span className="text-sm">{callState.error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes et outcome (visible pendant et après l'appel) */}
          {(callState.status === 'in-progress' || callState.status === 'ended') && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  <FileText size={14} className="inline mr-1" />
                  Notes d'appel
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes prises pendant l'appel..."
                  rows={3}
                />
              </div>

              {callState.status === 'ended' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Résultat de l'appel
                    </label>
                    <Select value={outcome} onValueChange={setOutcome}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le résultat..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rdv_pris">RDV pris</SelectItem>
                        <SelectItem value="callback_demande">Callback demandé</SelectItem>
                        <SelectItem value="information_demandee">Information demandée</SelectItem>
                        <SelectItem value="pas_interesse">Pas intéressé</SelectItem>
                        <SelectItem value="a_rappeler">À rappeler plus tard</SelectItem>
                        <SelectItem value="injoignable">Injoignable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Prochaine action
                    </label>
                    <Select value={nextAction} onValueChange={setNextAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucune action programmée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucune</SelectItem>
                        <SelectItem value="rappel_1_semaine">Rappel dans 1 semaine</SelectItem>
                        <SelectItem value="rappel_1_mois">Rappel dans 1 mois</SelectItem>
                        <SelectItem value="envoyer_documentation">Envoyer documentation</SelectItem>
                        <SelectItem value="programmer_rdv">Programmer un RDV</SelectItem>
                        <SelectItem value="relance_email">Relance par email</SelectItem>
                        <SelectItem value="qualification_approfondie">Qualification approfondie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {callState.status === 'ended' || callState.status === 'failed' ? (
              <>
                <Button onClick={saveNotesAndClose} className="flex-1">
                  Terminer et sauvegarder
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
              </>
            ) : callState.status === 'calling' || callState.status === 'ringing' ? (
              <Button variant="destructive" onClick={hangupCall} className="flex-1">
                <PhoneOff size={16} className="mr-1" />
                Annuler l'appel
              </Button>
            ) : callState.status === 'initializing' ? (
              <Button disabled className="flex-1">
                Initialisation...
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}