'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Linkedin, Settings, PenTool, History,
  Sparkles, Copy, Check, RefreshCw,
  Upload, FileText, ExternalLink, Image,
  TrendingUp, Newspaper, Building2, Loader2
} from 'lucide-react';

// Types
interface LinkedInConfig {
  id?: string;
  cabinet_name: string;
  cabinet_description: string;
  cabinet_specialties: string[];
  cabinet_values: string;
  cabinet_differentiators: string;
  years_experience: number | null;
  clients_count: number | null;
  average_return: number | null;
  assets_under_management: number | null;
  website_url: string;
  booking_url: string;
  phone: string;
  tone: string;
  target_audience: string;
  topics_to_avoid: string;
  brochure_url: string;
  brochure_text: string;
  preferred_hashtags: string[];
}

interface LinkedInPost {
  id: string;
  content: string;
  hook: string;
  topic: string;
  news_source: string;
  suggested_image_url: string;
  suggested_image_description: string;
  status: string;
  created_at: string;
}

export default function LinkedInAgentPage() {
  const [activeTab, setActiveTab] = useState('generate');
  const [config, setConfig] = useState<LinkedInConfig | null>(null);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<LinkedInPost | null>(null);
  const [copied, setCopied] = useState(false);

  // Thème sélectionné pour la génération
  const [selectedTheme, setSelectedTheme] = useState('auto');
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    loadConfig();
    loadPosts();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch('/api/linkedin/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || {
          cabinet_name: '',
          cabinet_description: '',
          cabinet_specialties: [],
          cabinet_values: '',
          cabinet_differentiators: '',
          years_experience: null,
          clients_count: null,
          average_return: null,
          assets_under_management: null,
          website_url: '',
          booking_url: '',
          phone: '',
          tone: 'professionnel',
          target_audience: '',
          topics_to_avoid: '',
          brochure_url: '',
          brochure_text: '',
          preferred_hashtags: [],
        });
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    }
  }

  async function loadPosts() {
    try {
      const res = await fetch('/api/linkedin/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Erreur chargement posts:', error);
    }
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/linkedin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Erreur sauvegarde');

      toast.success('Configuration sauvegardée !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  }

  async function generatePost() {
    if (!config?.cabinet_name) {
      toast.error('Veuillez d\'abord configurer votre cabinet');
      setActiveTab('config');
      return;
    }

    setGenerating(true);
    setGeneratedPost(null);

    try {
      const res = await fetch('/api/linkedin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          customTopic: customTopic,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur génération');
      }

      const data = await res.json();
      setGeneratedPost(data.post);
      toast.success('Post généré !');

      // Recharger l'historique
      loadPosts();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    if (!generatedPost) return;

    try {
      await navigator.clipboard.writeText(generatedPost.content);
      setCopied(true);
      toast.success('Post copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  }

  async function regeneratePost() {
    setGeneratedPost(null);
    await generatePost();
  }

  // Thèmes disponibles
  const themes = [
    { value: 'auto', label: '🎯 Automatique (IA choisit)', description: 'L\'IA sélectionne le sujet le plus pertinent du moment' },
    { value: 'market', label: '📈 Marchés financiers', description: 'CAC 40, bourse, tendances' },
    { value: 'savings', label: '💰 Épargne', description: 'Livret A, LEP, PEL, assurance-vie' },
    { value: 'tax', label: '📋 Fiscalité', description: 'Impôts, défiscalisation, lois de finances' },
    { value: 'retirement', label: '🏖️ Retraite', description: 'PER, réforme des retraites' },
    { value: 'realestate', label: '🏠 Immobilier', description: 'SCPI, investissement locatif, crédit' },
    { value: 'tips', label: '💡 Conseil pratique', description: 'Astuce patrimoniale sans actu' },
    { value: 'custom', label: '✏️ Sujet personnalisé', description: 'Vous choisissez le sujet' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <Linkedin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Agent</h1>
          <p className="text-muted-foreground">Générez des posts LinkedIn professionnels pour votre cabinet</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            Générer un post
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: Générer un post */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche : Options */}
            <Card>
              <CardHeader>
                <CardTitle>Thème du post</CardTitle>
                <CardDescription>
                  Choisissez un thème ou laissez l'IA sélectionner l'actualité la plus pertinente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {themes.map((theme) => (
                    <div
                      key={theme.value}
                      onClick={() => setSelectedTheme(theme.value)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTheme === theme.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{theme.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{theme.description}</div>
                    </div>
                  ))}
                </div>

                {selectedTheme === 'custom' && (
                  <div className="mt-4">
                    <label className="text-sm font-medium mb-2 block">Votre sujet</label>
                    <Textarea
                      placeholder="Ex: La baisse du Livret A à 2.4% en février 2025..."
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={generatePost}
                  disabled={generating || (selectedTheme === 'custom' && !customTopic.trim())}
                  className="w-full mt-4"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer un post
                    </>
                  )}
                </Button>

                {!config?.cabinet_name && (
                  <p className="text-sm text-yellow-500 mt-2">
                    ⚠️ Configurez d'abord votre cabinet pour de meilleurs résultats
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Colonne droite : Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu du post</CardTitle>
                <CardDescription>
                  {generatedPost ? 'Votre post est prêt !' : 'Le post généré apparaîtra ici'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedPost ? (
                  <div className="space-y-4">
                    {/* Preview LinkedIn-style */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg border p-4 space-y-3">
                      {/* Header profil fictif */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{config?.cabinet_name || 'Votre Cabinet'}</div>
                          <div className="text-xs text-muted-foreground">Conseil en Gestion de Patrimoine • À l'instant</div>
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedPost.content}
                      </div>

                      {/* Image suggérée */}
                      {generatedPost.suggested_image_description && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Image className="w-4 h-4" />
                            Image suggérée : {generatedPost.suggested_image_description}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Métadonnées */}
                    {generatedPost.news_source && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Newspaper className="w-4 h-4" />
                        Source : {generatedPost.news_source}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button onClick={copyToClipboard} className="flex-1">
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copier le post
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={regeneratePost}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Régénérer
                      </Button>
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                      <a href="https://www.linkedin.com/feed/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ouvrir LinkedIn
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Linkedin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Cliquez sur "Générer un post" pour commencer</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: Configuration */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de votre cabinet</CardTitle>
              <CardDescription>
                Ces informations permettent à l'IA de personnaliser les posts pour votre cabinet.
                Plus vous donnez de détails, meilleurs seront les posts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config && (
                <form onSubmit={saveConfig} className="space-y-6">
                  {/* Section : Identité */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Identité du cabinet
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Nom du cabinet *</label>
                        <Input
                          value={config.cabinet_name}
                          onChange={(e) => setConfig(prev => ({ ...prev!, cabinet_name: e.target.value }))}
                          placeholder="Ex: Cabinet Patrimoine & Conseil"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Années d'expérience</label>
                        <Input
                          type="number"
                          value={config.years_experience || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev!, years_experience: parseInt(e.target.value) || null }))}
                          placeholder="Ex: 15"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Description du cabinet</label>
                      <Textarea
                        value={config.cabinet_description}
                        onChange={(e) => setConfig(prev => ({ ...prev!, cabinet_description: e.target.value }))}
                        placeholder="Décrivez votre cabinet en quelques phrases : votre approche, votre philosophie..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Ce qui vous différencie</label>
                      <Textarea
                        value={config.cabinet_differentiators}
                        onChange={(e) => setConfig(prev => ({ ...prev!, cabinet_differentiators: e.target.value }))}
                        placeholder="Qu'est-ce qui rend votre cabinet unique ? Approche personnalisée, expertise spécifique, disponibilité..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Spécialités (séparées par des virgules)</label>
                      <Input
                        value={config.cabinet_specialties.join(', ')}
                        onChange={(e) => setConfig(prev => ({
                          ...prev!,
                          cabinet_specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))}
                        placeholder="Ex: PER, Assurance-vie, SCPI, Défiscalisation, Transmission"
                      />
                    </div>
                  </div>

                  {/* Section : Chiffres clés */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Chiffres clés (optionnel, pour crédibiliser)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Nombre de clients</label>
                        <Input
                          type="number"
                          value={config.clients_count || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev!, clients_count: parseInt(e.target.value) || null }))}
                          placeholder="Ex: 250"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Rendement moyen (%)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={config.average_return || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev!, average_return: parseFloat(e.target.value) || null }))}
                          placeholder="Ex: 5.8"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Encours sous gestion (€)</label>
                        <Input
                          type="number"
                          value={config.assets_under_management || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev!, assets_under_management: parseFloat(e.target.value) || null }))}
                          placeholder="Ex: 50000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section : Contact et CTA */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact et appels à l'action</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Site web</label>
                        <Input
                          type="url"
                          value={config.website_url}
                          onChange={(e) => setConfig(prev => ({ ...prev!, website_url: e.target.value }))}
                          placeholder="https://www.votrecabinet.fr"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Lien de prise de RDV</label>
                        <Input
                          type="url"
                          value={config.booking_url}
                          onChange={(e) => setConfig(prev => ({ ...prev!, booking_url: e.target.value }))}
                          placeholder="https://calendly.com/votrecabinet"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section : Style et ton */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Style de communication</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Ton des publications</label>
                        <Select
                          value={config.tone}
                          onValueChange={(v) => setConfig(prev => ({ ...prev!, tone: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professionnel">Professionnel et sérieux</SelectItem>
                            <SelectItem value="accessible">Accessible et pédagogue</SelectItem>
                            <SelectItem value="expert">Expert et technique</SelectItem>
                            <SelectItem value="decontracte">Décontracté et moderne</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Cible principale</label>
                        <Input
                          value={config.target_audience}
                          onChange={(e) => setConfig(prev => ({ ...prev!, target_audience: e.target.value }))}
                          placeholder="Ex: Entrepreneurs, cadres supérieurs, professions libérales"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Sujets à éviter</label>
                      <Input
                        value={config.topics_to_avoid}
                        onChange={(e) => setConfig(prev => ({ ...prev!, topics_to_avoid: e.target.value }))}
                        placeholder="Ex: Crypto, trading, produits risqués..."
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Hashtags favoris (séparés par des virgules)</label>
                      <Input
                        value={config.preferred_hashtags.join(', ')}
                        onChange={(e) => setConfig(prev => ({
                          ...prev!,
                          preferred_hashtags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))}
                        placeholder="Ex: #GestionDePatrimoine, #CGP, #Épargne, #Investissement"
                      />
                    </div>
                  </div>

                  {/* Section : Plaquette */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Plaquette commerciale (optionnel)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Uploadez votre plaquette PDF pour que l'IA puisse s'en inspirer dans ses posts.
                    </p>

                    <div className="flex items-center gap-4">
                      <Button type="button" variant="outline" disabled>
                        <Upload className="w-4 h-4 mr-2" />
                        Uploader une plaquette (bientôt)
                      </Button>
                      {config.brochure_url && (
                        <span className="text-sm text-green-500">✓ Plaquette chargée</span>
                      )}
                    </div>
                  </div>

                  {/* Bouton sauvegarde */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Sauvegarder la configuration'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: Historique */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des posts générés</CardTitle>
              <CardDescription>
                Retrouvez tous les posts générés pour éviter les répétitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Aucun post généré pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status === 'published' ? 'Publié' :
                             post.status === 'approved' ? 'Approuvé' : 'Brouillon'}
                          </Badge>
                          {post.topic && <Badge variant="outline">{post.topic}</Badge>}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap line-clamp-4">{post.content}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(post.content);
                            toast.success('Copié !');
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}