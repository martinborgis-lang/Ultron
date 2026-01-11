'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
            <Sun className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Apparence</CardTitle>
            <CardDescription>
              Personnalisez l&apos;apparence de l&apos;application
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Label
            htmlFor="light"
            className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            <RadioGroupItem value="light" id="light" className="sr-only" />
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900">
              <Sun className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Clair</p>
              <p className="text-xs text-muted-foreground">Theme lumineux</p>
            </div>
          </Label>

          <Label
            htmlFor="dark"
            className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            <RadioGroupItem value="dark" id="dark" className="sr-only" />
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
              <Moon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Sombre</p>
              <p className="text-xs text-muted-foreground">Theme fonce</p>
            </div>
          </Label>

          <Label
            htmlFor="system"
            className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            <RadioGroupItem value="system" id="system" className="sr-only" />
            <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Monitor className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Systeme</p>
              <p className="text-xs text-muted-foreground">Suit le systeme</p>
            </div>
          </Label>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
