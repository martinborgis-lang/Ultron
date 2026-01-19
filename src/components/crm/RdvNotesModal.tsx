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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, FileText } from 'lucide-react';

interface RdvNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospectName: string;
  onConfirm: (notes: string, rdvDate: Date) => void;
}

function getDefaultRdvDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow.toISOString().slice(0, 16);
}

export function RdvNotesModal({
  open,
  onOpenChange,
  prospectName,
  onConfirm,
}: RdvNotesModalProps) {
  const [notes, setNotes] = useState('');
  const [rdvDate, setRdvDate] = useState(getDefaultRdvDate());

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setNotes('');
      setRdvDate(getDefaultRdvDate());
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(notes, new Date(rdvDate));
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isValid = notes.trim().length > 0 && rdvDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Passer en RDV Pris</DialogTitle>
          <DialogDescription>
            {prospectName && `Enregistrez les informations de l'appel avec ${prospectName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Notes d'appel */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="call-notes" className="font-medium">
                Notes de l'appel <span className="text-red-500">*</span>
              </Label>
            </div>
            <Textarea
              id="call-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resumez l'appel : besoins exprimes, situation du prospect, points importants..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Ces notes seront utilisees par l'IA pour qualifier le prospect.
            </p>
          </div>

          {/* Date du RDV */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="rdv-date" className="font-medium">
                Date et heure du RDV <span className="text-red-500">*</span>
              </Label>
            </div>
            <input
              type="datetime-local"
              id="rdv-date"
              value={rdvDate}
              onChange={(e) => setRdvDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Confirmer le RDV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
