'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, User } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  gmail_connected: boolean;
}

interface WaitingReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectName: string;
  currentAssignedTo?: string;
  teamMembers?: TeamMember[];
  currentUserId?: string;
  onConfirm: (subtype: 'plaquette' | 'rappel_differe', rappelDate?: Date, assignedTo?: string) => void;
}

function getDefaultRappelDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  // Format for datetime-local input: YYYY-MM-DDTHH:mm
  return tomorrow.toISOString().slice(0, 16);
}

export function WaitingReasonModal({
  open,
  onOpenChange,
  prospectName,
  currentAssignedTo,
  teamMembers = [],
  currentUserId,
  onConfirm,
}: WaitingReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<'plaquette' | 'rappel_differe'>('plaquette');
  const [rappelDate, setRappelDate] = useState(getDefaultRappelDate());
  const [assignedTo, setAssignedTo] = useState<string>('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedReason('plaquette');
      setRappelDate(getDefaultRappelDate());
      // Default to current assigned or current user
      setAssignedTo(currentAssignedTo || currentUserId || '');
    }
  }, [open, currentAssignedTo, currentUserId]);

  const handleConfirm = () => {
    if (selectedReason === 'rappel_differe') {
      onConfirm(selectedReason, new Date(rappelDate), assignedTo || undefined);
    } else {
      onConfirm(selectedReason, undefined, assignedTo || undefined);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pourquoi mettre ce prospect en attente ?</DialogTitle>
          <DialogDescription>
            {prospectName && `Choisissez la raison pour ${prospectName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Advisor Selection */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Conseiller en charge
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un conseiller" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <span>{member.full_name || member.email}</span>
                        {member.id === currentUserId && (
                          <span className="text-xs text-muted-foreground">(moi)</span>
                        )}
                        {!member.gmail_connected && (
                          <span className="text-xs text-amber-500">(Gmail non connecte)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Les emails seront envoyes depuis le Gmail de ce conseiller.
              </p>
            </div>
          )}

          <RadioGroup
            value={selectedReason}
            onValueChange={(value) => setSelectedReason(value as 'plaquette' | 'rappel_differe')}
            className="gap-4"
          >
            {/* Option: Plaquette */}
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                selectedReason === 'plaquette'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedReason('plaquette')}
            >
              <RadioGroupItem value="plaquette" id="plaquette" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="plaquette" className="font-medium cursor-pointer">
                    Envoyer une plaquette
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Le prospect veut reflechir, on lui envoie la plaquette commerciale par email.
                </p>
              </div>
            </div>

            {/* Option: Rappel */}
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                selectedReason === 'rappel_differe'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedReason('rappel_differe')}
            >
              <RadioGroupItem value="rappel_differe" id="rappel_differe" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="rappel_differe" className="font-medium cursor-pointer">
                    Programmer un rappel
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Le prospect n'est pas disponible maintenant, on programme un rappel.
                </p>

                {/* Date picker - visible only when rappel is selected */}
                {selectedReason === 'rappel_differe' && (
                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <Label htmlFor="rappel-date" className="text-sm font-normal">
                      Date et heure du rappel
                    </Label>
                    <input
                      type="datetime-local"
                      id="rappel-date"
                      value={rappelDate}
                      onChange={(e) => setRappelDate(e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
