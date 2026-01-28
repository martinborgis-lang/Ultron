'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CrmProspect } from '@/types/crm';
import { User, Building2, Phone, Mail, Euro, Sparkles, Zap, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProspectCardProps {
  prospect: CrmProspect;
  onClick?: () => void;
  isDragging?: boolean;
  index?: number;
  onCall?: (prospectId: string, prospectName: string, phoneNumber: string) => void;
}

const qualificationColors: Record<string, string> = {
  chaud: 'bg-red-500/20 text-red-400 border-red-500/30',
  tiede: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  froid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  non_qualifie: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse',
};

const qualificationLabels: Record<string, string> = {
  chaud: 'Chaud',
  tiede: 'Tiede',
  froid: 'Froid',
  non_qualifie: 'Nouveau',
};

// Animation variants for cards
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
};

export function ProspectCard({ prospect, onClick, isDragging, index = 0, onCall }: ProspectCardProps) {
  const fullName = [prospect.first_name, prospect.last_name].filter(Boolean).join(' ') || 'Sans nom';
  const isHighScore = (prospect.score_ia ?? 0) > 80;

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher l'ouverture de la modal prospect
    if (onCall && prospect.phone) {
      onCall(prospect.id, fullName, prospect.phone);
    }
  };

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={!isDragging ? "hover" : undefined}
      variants={cardVariants}
      className={cn(
        'relative group',
        isHighScore && 'shine-border'
      )}
    >
      {/* Shine Border Effect for High Score */}
      {isHighScore && (
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-75 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" />
      )}

      <Card
        onClick={onClick}
        className={cn(
          'relative p-3 cursor-pointer transition-all',
          'bg-card border border-border',
          isHighScore && 'border-amber-500/50 bg-gradient-to-br from-card to-amber-500/5',
          !isHighScore && 'hover:border-primary/50',
          isDragging && 'opacity-50 rotate-2 scale-105 shadow-xl'
        )}
      >
        {/* High Score Indicator */}
        {isHighScore && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
            <Zap className="w-3 h-3" />
            {prospect.score_ia}
          </div>
        )}

        {/* Header: Nom + Qualification */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              isHighScore ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-primary/20'
            )}>
              <User className={cn('w-4 h-4', isHighScore ? 'text-amber-500' : 'text-primary')} />
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
            className={cn('text-[10px] px-1.5 py-0 flex items-center gap-1', qualificationColors[prospect.qualification] || qualificationColors.non_qualifie)}
          >
            {(!prospect.qualification || prospect.qualification === 'non_qualifie') && (
              <Sparkles className="w-3 h-3" />
            )}
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
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
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

      {/* Actions - Bouton d'appel */}
      {prospect.phone && onCall && (
        <div className="flex justify-end mt-2">
          <button
            onClick={handleCallClick}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
              'bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300',
              'border border-green-500/20 hover:border-green-500/30',
              'hover:scale-105 active:scale-95'
            )}
            title="Appeler ce prospect"
          >
            <PhoneCall className="w-3 h-3" />
            Appeler
          </button>
        </div>
      )}

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
    </motion.div>
  );
}

// Version draggable
export function DraggableProspectCard({ prospect, onClick, index = 0, onCall }: ProspectCardProps) {
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
      <ProspectCard prospect={prospect} onClick={onClick} isDragging={isDragging} index={index} onCall={onCall} />
    </div>
  );
}
