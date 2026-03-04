'use client';

import { motion } from 'framer-motion';
import { Bot, Flame, Calendar, Users, TrendingUp, Sparkles, Phone, DollarSign, FileText, BarChart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

interface SuggestionItem {
  icon: any;
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Mapping des suggestions vers des icônes et couleurs
const getSuggestionStyle = (text: string): SuggestionItem => {
  const lower = text.toLowerCase();

  if (lower.includes('chaud') || lower.includes('prospect')) {
    return {
      icon: Flame,
      text,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    };
  } else if (lower.includes('rdv') || lower.includes('rendez-vous')) {
    return {
      icon: Calendar,
      text,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    };
  } else if (lower.includes('conseiller') || lower.includes('équipe')) {
    return {
      icon: Users,
      text,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    };
  } else if (lower.includes('patrimoine') || lower.includes('ca') || lower.includes('chiffre')) {
    return {
      icon: TrendingUp,
      text,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    };
  } else if (lower.includes('appel') || lower.includes('call')) {
    return {
      icon: Phone,
      text,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    };
  } else if (lower.includes('commission') || lower.includes('vente')) {
    return {
      icon: DollarSign,
      text,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    };
  } else if (lower.includes('transcript') || lower.includes('meeting')) {
    return {
      icon: FileText,
      text,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    };
  } else {
    return {
      icon: BarChart,
      text,
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20',
    };
  }
};

// Suggestions par défaut (fallback)
const defaultSuggestions = [
  'Montre-moi les prospects chauds de cette semaine',
  'Combien de RDV sont programmés aujourd\'hui ?',
  'Prospects sans conseiller assigné',
  'Affiche le CA généré par conseiller ce mois',
  'Montre les appels effectués hier',
  'Prospects avec patrimoine > 100000 euros',
  'Répartition des prospects par qualification',
  'Dernières activités de l\'équipe'
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [organizationName, setOrganizationName] = useState('');

  // Charger les suggestions dynamiques depuis l'API
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch('/api/assistant/schema');
        if (response.ok) {
          const data = await response.json();

          // Convertir les suggestions textuelles en objets avec styles
          const styledSuggestions = (data.suggestions || defaultSuggestions)
            .slice(0, 6) // Limiter à 6 suggestions
            .map((text: string) => getSuggestionStyle(text));

          setSuggestions(styledSuggestions);
          setOrganizationName(data.organization?.name || '');
        } else {
          // Fallback en cas d'erreur
          const fallbackSuggestions = defaultSuggestions
            .slice(0, 6)
            .map(text => getSuggestionStyle(text));
          setSuggestions(fallbackSuggestions);
        }
      } catch (error) {
        console.error('Error loading suggestions:', error);
        // Fallback en cas d'erreur
        const fallbackSuggestions = defaultSuggestions
          .slice(0, 6)
          .map(text => getSuggestionStyle(text));
        setSuggestions(fallbackSuggestions);
      }
    };

    loadSuggestions();
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center h-full px-4 py-12"
    >
      {/* Logo/Icon */}
      <motion.div
        variants={itemVariants}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="w-6 h-6 text-amber-500" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={itemVariants}
        className="text-2xl font-bold text-foreground mb-2"
      >
        Assistant Ultron
      </motion.h1>

      {/* Subtitle avec nom organisation */}
      <motion.p
        variants={itemVariants}
        className="text-muted-foreground text-center max-w-md mb-2"
      >
        Interrogez vos données CRM en langage naturel.
        <br />
        Posez simplement votre question.
      </motion.p>

      {organizationName && (
        <motion.p
          variants={itemVariants}
          className="text-xs text-muted-foreground mb-6 px-3 py-1 bg-primary/10 rounded-full"
        >
          📊 Données de {organizationName}
        </motion.p>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="w-full max-w-2xl"
        >
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Suggestions intelligentes basées sur vos données :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.text}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() => onSuggestionClick(suggestion.text)}
                  className={cn(
                    'p-3 cursor-pointer transition-all duration-200',
                    'hover:shadow-md border',
                    suggestion.borderColor,
                    'hover:border-primary/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg shrink-0',
                        suggestion.bgColor
                      )}
                    >
                      <suggestion.icon
                        className={cn('w-4 h-4', suggestion.color)}
                      />
                    </div>
                    <p className="text-sm text-foreground leading-tight">
                      {suggestion.text}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Help text */}
      <motion.p
        variants={itemVariants}
        className="text-xs text-muted-foreground mt-8 text-center"
      >
        🔒 Assistant sécurisé • Lecture seule • Données restreintes à votre organisation
      </motion.p>
    </motion.div>
  );
}
