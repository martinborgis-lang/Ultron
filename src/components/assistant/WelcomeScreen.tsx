'use client';

import { motion } from 'framer-motion';
import { Bot, Flame, Calendar, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: Flame,
    text: 'Montre moi les prospects chauds',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
  },
  {
    icon: Calendar,
    text: 'Combien de RDV cette semaine?',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Users,
    text: 'Prospects sans conseiller assigne',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    icon: TrendingUp,
    text: 'Top 5 par patrimoine estime',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
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

      {/* Subtitle */}
      <motion.p
        variants={itemVariants}
        className="text-muted-foreground text-center max-w-md mb-8"
      >
        Interrogez vos donnees CRM en langage naturel.
        <br />
        Posez simplement votre question.
      </motion.p>

      {/* Suggestions */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-lg"
      >
        <p className="text-sm text-muted-foreground mb-3 text-center">
          Essayez une de ces questions :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  'p-4 cursor-pointer transition-all duration-200',
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

      {/* Help text */}
      <motion.p
        variants={itemVariants}
        className="text-xs text-muted-foreground mt-8 text-center"
      >
        L&apos;assistant peut uniquement lire les donnees, pas les modifier.
      </motion.p>
    </motion.div>
  );
}
