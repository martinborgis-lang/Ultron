'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrmProspect } from '@/types/crm';
import { User, Building2, Phone, Mail, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProspectCardProps {
  prospect: CrmProspect;
  onClick?: () => void;
  isDragging?: boolean;
}

const qualificationColors: Record<string, string> = {
  chaud: 'bg-red-500/20 text-red-400 border-red-500/30',
  tiede: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  froid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  non_qualifie: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const qualificationLabels: Record<string, string> = {
  chaud: 'Chaud',
  tiede: 'Tiede',
  froid: 'Froid',
  non_qualifie: 'Non qualifie',
};

export function ProspectCard({ prospect, onClick, isDragging }: ProspectCardProps) {
  const fullName = [prospect.first_name, prospect.last_name].filter(Boolean).join(' ') || 'Sans nom';

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-3 cursor-pointer hover:border-primary/50 transition-all',
        'bg-card border border-border',
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-xl'
      )}
    >
      {/* Header: Nom + Qualification */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{fullName}</p>
            {prospect.company && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {prospect.company}
              </p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn('text-[10px] px-1.5 py-0', qualificationColors[prospect.qualification] || qualificationColors.non_qualifie)}
        >
          {qualificationLabels[prospect.qualification] || qualificationLabels.non_qualifie}
        </Badge>
      </div>

      {/* Deal Value */}
      {prospect.deal_value && (
        <div className="flex items-center gap-1 text-sm font-semibold text-green-400 mb-2">
          <Euro className="w-3.5 h-3.5" />
          {formatCurrency(prospect.deal_value)}
          {prospect.close_probability && (
            <span className="text-xs text-muted-foreground font-normal">
              ({prospect.close_probability}%)
            </span>
          )}
        </div>
      )}

      {/* Contact Info */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {prospect.phone && (
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {prospect.phone}
          </span>
        )}
        {prospect.email && (
          <span className="flex items-center gap-1 truncate max-w-[150px]">
            <Mail className="w-3 h-3" />
            {prospect.email}
          </span>
        )}
      </div>

      {/* Tags */}
      {prospect.tags && prospect.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prospect.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {prospect.tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              +{prospect.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}

// Version draggable
export function DraggableProspectCard({ prospect, onClick }: ProspectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProspectCard prospect={prospect} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}
