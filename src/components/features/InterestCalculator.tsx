'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Calculator, HelpCircle, RotateCcw, TrendingUp, Wallet, PiggyBank, Percent } from 'lucide-react';

type CompoundingFrequency = 'monthly' | 'quarterly' | 'annually';

interface CalculationResult {
  finalAmount: number;
  totalContributions: number;
  interestEarned: number;
  totalReturn: number;
}

interface ChartDataPoint {
  year: number;
  capitalWithInterest: number;
  capitalInvested: number;
}

const DEFAULT_VALUES = {
  initialCapital: 10000,
  monthlyPayment: 200,
  annualRate: 5,
  duration: 10,
  frequency: 'monthly' as CompoundingFrequency,
};

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Mensuelle', n: 12 },
  { value: 'quarterly', label: 'Trimestrielle', n: 4 },
  { value: 'annually', label: 'Annuelle', n: 1 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function calculateCompoundInterest(
  principal: number,
  monthlyPayment: number,
  annualRate: number,
  years: number,
  compoundingFrequency: number
): CalculationResult {
  const r = annualRate / 100;
  const n = compoundingFrequency;
  const t = years;

  // Compound interest formula with regular contributions
  // A = P(1 + r/n)^(nt) + PMT × (((1 + r/n)^(nt) - 1) / (r/n))

  // Convert monthly payment to payment per compounding period
  const periodsPerYear = n;
  const monthsPerPeriod = 12 / periodsPerYear;
  const paymentPerPeriod = monthlyPayment * monthsPerPeriod;

  let finalAmount: number;

  if (r === 0) {
    // Handle 0% interest rate
    finalAmount = principal + paymentPerPeriod * periodsPerYear * t;
  } else {
    const compoundFactor = Math.pow(1 + r / n, n * t);
    const principalGrowth = principal * compoundFactor;
    const contributionGrowth = paymentPerPeriod * ((compoundFactor - 1) / (r / n));
    finalAmount = principalGrowth + contributionGrowth;
  }

  const totalContributions = principal + monthlyPayment * 12 * years;
  const interestEarned = finalAmount - totalContributions;
  const totalReturn = totalContributions > 0 ? ((finalAmount - totalContributions) / totalContributions) * 100 : 0;

  return {
    finalAmount,
    totalContributions,
    interestEarned,
    totalReturn,
  };
}

function generateChartData(
  principal: number,
  monthlyPayment: number,
  annualRate: number,
  years: number,
  compoundingFrequency: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];

  for (let year = 0; year <= years; year++) {
    const result = calculateCompoundInterest(
      principal,
      monthlyPayment,
      annualRate,
      year,
      compoundingFrequency
    );

    data.push({
      year,
      capitalWithInterest: Math.round(result.finalAmount),
      capitalInvested: Math.round(principal + monthlyPayment * 12 * year),
    });
  }

  return data;
}

function TooltipLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function InterestCalculator() {
  const [initialCapital, setInitialCapital] = useState(DEFAULT_VALUES.initialCapital);
  const [monthlyPayment, setMonthlyPayment] = useState(DEFAULT_VALUES.monthlyPayment);
  const [annualRate, setAnnualRate] = useState(DEFAULT_VALUES.annualRate);
  const [duration, setDuration] = useState(DEFAULT_VALUES.duration);
  const [frequency, setFrequency] = useState<CompoundingFrequency>(DEFAULT_VALUES.frequency);

  const compoundingN = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.n || 12;

  const result = useMemo(
    () => calculateCompoundInterest(initialCapital, monthlyPayment, annualRate, duration, compoundingN),
    [initialCapital, monthlyPayment, annualRate, duration, compoundingN]
  );

  const chartData = useMemo(
    () => generateChartData(initialCapital, monthlyPayment, annualRate, duration, compoundingN),
    [initialCapital, monthlyPayment, annualRate, duration, compoundingN]
  );

  const handleReset = () => {
    setInitialCapital(DEFAULT_VALUES.initialCapital);
    setMonthlyPayment(DEFAULT_VALUES.monthlyPayment);
    setAnnualRate(DEFAULT_VALUES.annualRate);
    setDuration(DEFAULT_VALUES.duration);
    setFrequency(DEFAULT_VALUES.frequency);
  };

  const handleNumberInput = (
    value: string,
    setter: (val: number) => void,
    min = 0,
    max = Infinity
  ) => {
    const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) {
      setter(Math.min(Math.max(num, min), max));
    } else if (value === '') {
      setter(0);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Calculateur d&apos;interets composes
          </h1>
          <p className="text-muted-foreground mt-1">
            Simulez la croissance de votre capital avec les interets composes
          </p>
        </div>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reinitialiser
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Parametres</CardTitle>
            <CardDescription>Configurez votre simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Capital initial */}
            <div className="space-y-2">
              <TooltipLabel
                label="Capital initial"
                tooltip="Le montant que vous investissez au depart"
              />
              <div className="relative">
                <Input
                  type="text"
                  value={initialCapital.toLocaleString('fr-FR')}
                  onChange={(e) => handleNumberInput(e.target.value, setInitialCapital, 0, 10000000)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  &euro;
                </span>
              </div>
            </div>

            {/* Versement mensuel */}
            <div className="space-y-2">
              <TooltipLabel
                label="Versement mensuel"
                tooltip="Le montant que vous ajoutez chaque mois (optionnel)"
              />
              <div className="relative">
                <Input
                  type="text"
                  value={monthlyPayment.toLocaleString('fr-FR')}
                  onChange={(e) => handleNumberInput(e.target.value, setMonthlyPayment, 0, 100000)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  &euro;
                </span>
              </div>
            </div>

            {/* Taux annuel */}
            <div className="space-y-2">
              <TooltipLabel
                label="Taux d'interet annuel"
                tooltip="Le rendement annuel attendu de votre investissement"
              />
              <div className="relative">
                <Input
                  type="text"
                  value={annualRate.toLocaleString('fr-FR')}
                  onChange={(e) => handleNumberInput(e.target.value, setAnnualRate, 0, 50)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            {/* Duree */}
            <div className="space-y-3">
              <TooltipLabel
                label={`Duree : ${duration} ans`}
                tooltip="La periode pendant laquelle vous investissez"
              />
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                min={1}
                max={40}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 an</span>
                <span>40 ans</span>
              </div>
            </div>

            {/* Frequence */}
            <div className="space-y-2">
              <TooltipLabel
                label="Frequence de capitalisation"
                tooltip="A quelle frequence les interets sont calcules et ajoutes au capital"
              />
              <Select value={frequency} onValueChange={(v) => setFrequency(v as CompoundingFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results and Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Results */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                    <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Capital final</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(result.finalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <PiggyBank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total investi</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(result.totalContributions)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Interets gagnes</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(result.interestEarned)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                    <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rendement total</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      +{result.totalReturn.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolution du capital</CardTitle>
              <CardDescription>
                Comparaison entre le capital investi et le capital avec interets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCapitalWithInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCapitalInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(value) => `${value} an${value > 1 ? 's' : ''}`}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('fr-FR', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(value) + ' \u20AC'
                      }
                      className="text-xs"
                    />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        formatCurrency(value as number),
                        name === 'capitalWithInterest' ? 'Avec interets' : 'Capital investi',
                      ]}
                      labelFormatter={(label) => `Annee ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend
                      formatter={(value) =>
                        value === 'capitalWithInterest' ? 'Avec interets' : 'Capital investi'
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="capitalInvested"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCapitalInvested)"
                    />
                    <Area
                      type="monotone"
                      dataKey="capitalWithInterest"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCapitalWithInterest)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
