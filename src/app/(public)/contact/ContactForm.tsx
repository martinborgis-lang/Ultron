'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Rocket, Shield, Zap } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  cabinetName: string;
  city: string;
  cabinetSize: string;
  averagePatrimony: string;
  mainNeed: string;
  rgpdConsent: boolean;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    cabinetName: '',
    city: '',
    cabinetSize: '',
    averagePatrimony: '',
    mainNeed: '',
    rgpdConsent: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const cityOptions = [
    'Paris',
    'Lyon',
    'Marseille',
    'Bordeaux',
    'Toulouse',
    'Nantes',
    'Lille',
    'Autre'
  ];

  const cabinetSizeOptions = [
    'Indépendant',
    '2-5 CGP',
    '6-10 CGP',
    '10+ CGP'
  ];

  const patrimonyOptions = [
    '< 500K€',
    '500K€ - 2M€',
    '2M€ - 10M€',
    '> 10M€'
  ];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.cabinetName) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }

    if (!formData.rgpdConsent) {
      setError('Vous devez accepter la politique de confidentialité.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulation d'envoi (remplacer par Formspree ou API réelle)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <CardContent className="p-12">
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold text-white mb-4">
                    ✅ Parfait {formData.firstName} !
                  </h1>
                  <p className="text-xl text-blue-100 mb-6">
                    Vous êtes sur la liste early adopter d'Ultron.
                    Nous vous contacterons en priorité au lancement.
                  </p>
                </div>

                <div className="space-y-4 text-left">
                  <div className="flex items-center space-x-3 text-blue-100">
                    <Rocket className="w-5 h-5 text-blue-400" />
                    <span>Accès prioritaire au lancement</span>
                  </div>
                  <div className="flex items-center space-x-3 text-blue-100">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span>Tarif early adopter exclusif</span>
                  </div>
                  <div className="flex items-center space-x-3 text-blue-100">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span>Formation personnalisée incluse</span>
                  </div>
                </div>

                <Button
                  onClick={() => window.location.href = '/'}
                  className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Retour à l'accueil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border border-blue-400/30">
              🚀 Accès Early Adopter — Places limitées
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Rejoignez les premiers cabinets CGP sur{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Ultron
              </span>
            </h1>

            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Le produit est en développement actif. Inscrivez-vous pour être parmi les premiers à y accéder
              et bénéficier d'un tarif early adopter.
            </p>
          </div>

          {/* Form */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Prénom */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">
                      Prénom <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Jean"
                      required
                    />
                  </div>

                  {/* Nom */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">
                      Nom <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email professionnel <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="jean.dupont@cabinet-exemple.fr"
                    required
                  />
                </div>

                {/* Nom du cabinet */}
                <div className="space-y-2">
                  <Label htmlFor="cabinetName" className="text-white">
                    Nom du cabinet <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="cabinetName"
                    value={formData.cabinetName}
                    onChange={(e) => handleInputChange('cabinetName', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Cabinet Patrimoine & Conseils"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Ville */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">Ville</Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptions.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Taille cabinet */}
                  <div className="space-y-2">
                    <Label htmlFor="cabinetSize" className="text-white">Taille du cabinet</Label>
                    <Select value={formData.cabinetSize} onValueChange={(value) => handleInputChange('cabinetSize', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {cabinetSizeOptions.map((size) => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Patrimoine moyen géré */}
                  <div className="space-y-2">
                    <Label htmlFor="averagePatrimony" className="text-white">Patrimoine moyen géré</Label>
                    <Select value={formData.averagePatrimony} onValueChange={(value) => handleInputChange('averagePatrimony', value)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {patrimonyOptions.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Besoin principal */}
                <div className="space-y-2">
                  <Label htmlFor="mainNeed" className="text-white">
                    Quel est votre besoin principal en gestion de prospects ?
                  </Label>
                  <Textarea
                    id="mainNeed"
                    value={formData.mainNeed}
                    onChange={(e) => handleInputChange('mainNeed', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    placeholder="Ex: Automatiser le suivi des prospects, améliorer la qualification, centraliser les données client..."
                    rows={3}
                  />
                </div>

                {/* Checkbox RGPD */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="rgpdConsent"
                    checked={formData.rgpdConsent}
                    onCheckedChange={(checked) => handleInputChange('rgpdConsent', checked as boolean)}
                    className="border-white/20 data-[state=checked]:bg-blue-600"
                    required
                  />
                  <Label htmlFor="rgpdConsent" className="text-sm text-blue-100 leading-relaxed">
                    J'accepte que mes données soient utilisées pour me recontacter concernant Ultron.
                    Conformément au RGPD, vous pouvez modifier ou supprimer vos données à tout moment.{' '}
                    <span className="text-red-400">*</span>
                  </Label>
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-md">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Rejoindre la liste d'attente
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Features preview */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Ce qui vous attend avec Ultron</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                <CardContent className="p-6 text-center">
                  <Zap className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">IA Intégrée</h3>
                  <p className="text-blue-100 text-sm">Qualification automatique et aide à la décision</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Conforme CGP</h3>
                  <p className="text-blue-100 text-sm">Conçu spécifiquement pour les conseillers patrimoniaux</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                <CardContent className="p-6 text-center">
                  <Rocket className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Gain de Temps</h3>
                  <p className="text-blue-100 text-sm">Automatisation complète du workflow commercial</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}