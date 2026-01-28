// ========================================
// SERVICE VAPI.AI - AGENT IA AUTOMATIQUE
// ========================================

import {
  VapiCallRequest,
  VapiCallResponse,
  VapiAssistant,
  VapiWebhookEvent,
  VapiFunction,
  PhoneCall,
  VoiceConfig,
  VoiceError,
  VoiceApiResponse
} from '@/types/voice';

/**
 * Service principal pour interagir avec l'API Vapi.ai
 * Gère la création d'appels, assistants et webhooks
 */
export class VapiService {
  private baseUrl = 'https://api.vapi.ai';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ========================================
  // MÉTHODES ASSISTANT
  // ========================================

  /**
   * Créer un assistant Vapi configuré pour la qualification CGP
   */
  async createAssistant(config: VoiceConfig): Promise<VapiAssistant> {
    const assistantData: VapiAssistant = {
      name: config.agent_name,
      voice: config.agent_voice,
      language: config.agent_language,
      systemPrompt: this.buildSystemPrompt(config),
      functions: this.buildAssistantFunctions(),
      firstMessage: "Bonjour, je suis l'assistant d'Ultron. Je vous contacte suite à votre demande d'information sur nos services de gestion de patrimoine. Avez-vous quelques minutes pour en discuter ?",
      endCallMessage: "Merci pour votre temps. Vous recevrez un email de confirmation si nous avons programmé un rendez-vous. Bonne journée !",
      maxDuration: config.max_call_duration_seconds,
      responseDelaySeconds: 1,
      llmRequestDelaySeconds: 1,
      interruptSensitive: true
    };

    const response = await this.makeRequest<VapiAssistant>('POST', '/assistant', assistantData);
    return response;
  }

  /**
   * Mettre à jour un assistant existant
   */
  async updateAssistant(assistantId: string, config: VoiceConfig): Promise<VapiAssistant> {
    const assistantData: Partial<VapiAssistant> = {
      name: config.agent_name,
      voice: config.agent_voice,
      systemPrompt: this.buildSystemPrompt(config),
      functions: this.buildAssistantFunctions(),
      maxDuration: config.max_call_duration_seconds
    };

    const response = await this.makeRequest<VapiAssistant>('PATCH', `/assistant/${assistantId}`, assistantData);
    return response;
  }

  /**
   * Supprimer un assistant
   */
  async deleteAssistant(assistantId: string): Promise<void> {
    await this.makeRequest('DELETE', `/assistant/${assistantId}`);
  }

  // ========================================
  // MÉTHODES APPELS
  // ========================================

  /**
   * Créer un appel automatique
   */
  async createCall(request: VapiCallRequest): Promise<VapiCallResponse> {
    // Validation du numéro de téléphone
    const phoneNumber = this.formatPhoneNumber(request.phoneNumber);
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Numéro de téléphone invalide');
    }

    const callData: VapiCallRequest = {
      ...request,
      phoneNumber,
      metadata: {
        ...request.metadata,
        created_by: 'ultron_ai_agent',
        timestamp: new Date().toISOString()
      }
    };

    const response = await this.makeRequest<VapiCallResponse>('POST', '/call', callData);
    return response;
  }

  /**
   * Récupérer les détails d'un appel
   */
  async getCall(callId: string): Promise<VapiCallResponse> {
    const response = await this.makeRequest<VapiCallResponse>('GET', `/call/${callId}`);
    return response;
  }

  /**
   * Terminer un appel en cours
   */
  async endCall(callId: string): Promise<VapiCallResponse> {
    const response = await this.makeRequest<VapiCallResponse>('POST', `/call/${callId}/end`);
    return response;
  }

  /**
   * Lister les appels récents
   */
  async listCalls(limit: number = 50, offset: number = 0): Promise<VapiCallResponse[]> {
    const response = await this.makeRequest<VapiCallResponse[]>('GET', `/call?limit=${limit}&offset=${offset}`);
    return response;
  }

  // ========================================
  // MÉTHODES WEBHOOKS
  // ========================================

  /**
   * Traiter un événement webhook de Vapi
   */
  async processWebhookEvent(event: VapiWebhookEvent, webhookSecret?: string): Promise<void> {
    // Validation du secret webhook si configuré
    if (webhookSecret) {
      const isValid = this.validateWebhookSignature(event, webhookSecret);
      if (!isValid) {
        throw new Error('Signature webhook invalide');
      }
    }

    // Traitement selon le type d'événement
    switch (event.type) {
      case 'call-started':
        await this.handleCallStarted(event);
        break;
      case 'call-ended':
        await this.handleCallEnded(event);
        break;
      case 'transcript-updated':
        await this.handleTranscriptUpdated(event);
        break;
      case 'function-called':
        await this.handleFunctionCalled(event);
        break;
      case 'recording-available':
        await this.handleRecordingAvailable(event);
        break;
      default:
        console.warn('Événement webhook inconnu:', event.type);
    }
  }

  // ========================================
  // MÉTHODES PRIVÉES - CONFIGURATION
  // ========================================

  /**
   * Construire le prompt système pour l'assistant
   */
  private buildSystemPrompt(config: VoiceConfig): string {
    return `${config.system_prompt}

INSTRUCTIONS SPÉCIFIQUES :

1. OBJECTIF : Qualifier le prospect et prendre un rendez-vous si intéressé
2. DURÉE MAXIMALE : ${Math.floor(config.max_call_duration_seconds / 60)} minutes
3. QUESTIONS À POSER : ${config.qualification_questions.map((q, i) => `${i + 1}. ${q}`).join(' ')}

RÈGLES IMPORTANTES :
- Soyez naturel et conversationnel
- Écoutez les objections et répondez avec empathie
- Si le prospect est intéressé, proposez un créneau de rendez-vous
- Utilisez la fonction check_availability pour vérifier les créneaux
- Utilisez la fonction book_appointment pour confirmer un RDV
- Si pas intéressé, remerciez poliment et terminez l'appel
- Ne jamais insister si la personne refuse

INFORMATION ENTREPRISE :
- Nom : Cabinet de gestion de patrimoine Ultron
- Spécialités : Investissements, optimisation fiscale, retraite
- Approche personnalisée selon le profil de chaque client

Commencez toujours par vous présenter et demander si la personne a quelques minutes.`;
  }

  /**
   * Construire les fonctions disponibles pour l'assistant
   */
  private buildAssistantFunctions(): VapiFunction[] {
    return [
      {
        name: 'check_availability',
        description: 'Vérifier les créneaux de rendez-vous disponibles',
        parameters: {
          type: 'object',
          properties: {
            preferred_date: {
              type: 'string',
              description: 'Date préférée au format YYYY-MM-DD'
            },
            preferred_time_range: {
              type: 'string',
              description: 'Créneau préféré (matin, apres-midi, soir)',
              enum: ['matin', 'apres-midi', 'soir']
            }
          },
          required: ['preferred_date']
        }
      },
      {
        name: 'book_appointment',
        description: 'Réserver un rendez-vous avec un conseiller',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date du rendez-vous au format YYYY-MM-DD'
            },
            time: {
              type: 'string',
              description: 'Heure du rendez-vous au format HH:MM'
            },
            duration_minutes: {
              type: 'number',
              description: 'Durée en minutes (par défaut 60)'
            },
            notes: {
              type: 'string',
              description: 'Notes ou préférences du prospect'
            }
          },
          required: ['date', 'time']
        }
      },
      {
        name: 'qualify_prospect',
        description: 'Enregistrer la qualification du prospect',
        parameters: {
          type: 'object',
          properties: {
            qualification_score: {
              type: 'number',
              description: 'Score de qualification de 0 à 100'
            },
            qualification_result: {
              type: 'string',
              description: 'Résultat de qualification',
              enum: ['CHAUD', 'TIEDE', 'FROID', 'NON_QUALIFIE']
            },
            notes: {
              type: 'string',
              description: 'Notes de qualification'
            },
            interest_level: {
              type: 'string',
              description: 'Niveau d\'intérêt',
              enum: ['très intéressé', 'moyennement intéressé', 'peu intéressé', 'pas intéressé']
            }
          },
          required: ['qualification_score', 'qualification_result']
        }
      },
      {
        name: 'end_call_with_outcome',
        description: 'Terminer l\'appel avec un résultat spécifique',
        parameters: {
          type: 'object',
          properties: {
            outcome: {
              type: 'string',
              description: 'Résultat de l\'appel',
              enum: ['appointment_booked', 'callback_requested', 'not_interested', 'wrong_number']
            },
            reason: {
              type: 'string',
              description: 'Raison ou détails du résultat'
            }
          },
          required: ['outcome']
        }
      }
    ];
  }

  // ========================================
  // HANDLERS ÉVÉNEMENTS WEBHOOK
  // ========================================

  private async handleCallStarted(event: VapiWebhookEvent): Promise<void> {
    console.log('Appel démarré:', event.call.id);
    // Mettre à jour le statut dans la base
    // Cette logique sera implémentée dans l'API webhook
  }

  private async handleCallEnded(event: VapiWebhookEvent): Promise<void> {
    console.log('Appel terminé:', event.call.id);
    // Traiter la fin d'appel, transcription, coûts, etc.
    // Cette logique sera implémentée dans l'API webhook
  }

  private async handleTranscriptUpdated(event: VapiWebhookEvent): Promise<void> {
    console.log('Transcription mise à jour:', event.call.id);
    // Sauvegarder la transcription en temps réel
  }

  private async handleFunctionCalled(event: VapiWebhookEvent): Promise<void> {
    console.log('Fonction appelée:', event.call.id);
    // Traiter les appels de fonction (check_availability, book_appointment, etc.)
  }

  private async handleRecordingAvailable(event: VapiWebhookEvent): Promise<void> {
    console.log('Enregistrement disponible:', event.call.id);
    // Sauvegarder l'URL d'enregistrement
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Formater un numéro de téléphone au format international
   */
  private formatPhoneNumber(phone: string): string {
    // Retirer tous les caractères non numériques sauf +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Si commence par 0, remplacer par +33
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1);
    }

    // Si ne commence pas par +, ajouter +33
    if (!cleaned.startsWith('+')) {
      cleaned = '+33' + cleaned;
    }

    return cleaned;
  }

  /**
   * Valider un numéro de téléphone
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Format international requis
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Valider la signature d'un webhook
   */
  private validateWebhookSignature(event: VapiWebhookEvent, secret: string): boolean {
    // Implémentation de la validation HMAC
    // Pour l'instant, on retourne true (à implémenter selon Vapi)
    return true;
  }

  /**
   * Calculer le coût estimé d'un appel
   */
  calculateCallCost(durationSeconds: number, model: string = 'gpt-3.5-turbo'): number {
    // Tarification estimée Vapi (à ajuster selon les tarifs réels)
    const baseRatePerMinute = 0.05; // 5 centimes par minute
    const modelMultiplier = model.includes('gpt-4') ? 2 : 1;

    const minutes = Math.ceil(durationSeconds / 60);
    return Math.round(minutes * baseRatePerMinute * modelMultiplier * 100); // En centimes
  }

  // ========================================
  // MÉTHODES HTTP
  // ========================================

  /**
   * Effectuer une requête HTTP vers l'API Vapi
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    const config: RequestInit = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Erreur API Vapi (${response.status}): ${errorData.message || response.statusText}`);
      }

      // Si la réponse est vide (DELETE), retourner null
      if (response.status === 204) {
        return null as T;
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur requête Vapi:', error);
      throw error;
    }
  }

  // ========================================
  // MÉTHODES STATIQUES UTILITAIRES
  // ========================================

  /**
   * Créer une instance VapiService avec API key chiffrée
   */
  static createFromConfig(config: VoiceConfig): VapiService {
    // En production, déchiffrer l'API key
    const apiKey = config.vapi_api_key; // decrypt_vapi_key(config.vapi_api_key)
    return new VapiService(apiKey);
  }

  /**
   * Tester la connectivité avec l'API Vapi
   */
  static async testConnection(apiKey: string): Promise<boolean> {
    try {
      const service = new VapiService(apiKey);
      await service.makeRequest('GET', '/assistant');
      return true;
    } catch (error) {
      console.error('Test connexion Vapi échoué:', error);
      return false;
    }
  }

  /**
   * Valider une configuration Vapi
   */
  static validateConfig(config: VoiceConfig): string[] {
    const errors: string[] = [];

    if (!config.vapi_api_key) {
      errors.push('Clé API Vapi requise');
    }

    if (!config.agent_voice) {
      errors.push('Voix agent requise');
    }

    if (config.max_call_duration_seconds < 30) {
      errors.push('Durée minimale d\'appel : 30 secondes');
    }

    if (config.max_call_duration_seconds > 1800) {
      errors.push('Durée maximale d\'appel : 30 minutes');
    }

    if (!config.system_prompt || config.system_prompt.length < 50) {
      errors.push('Prompt système requis (min 50 caractères)');
    }

    return errors;
  }
}

// ========================================
// CLASSE HELPER POUR LA QUALIFICATION
// ========================================

/**
 * Helper pour analyser et scorer la qualification d'un prospect
 */
export class ProspectQualificationAnalyzer {
  /**
   * Analyser la transcription et calculer un score de qualification
   */
  static analyzeTranscript(transcript: string, questions: string[]): {
    score: number;
    result: 'CHAUD' | 'TIEDE' | 'FROID' | 'NON_QUALIFIE';
    notes: string;
  } {
    const analysis: {
      score: number;
      result: 'CHAUD' | 'TIEDE' | 'FROID' | 'NON_QUALIFIE';
      notes: string;
    } = {
      score: 0,
      result: 'NON_QUALIFIE',
      notes: ''
    };

    // Analyse basique des mots-clés
    const positiveKeywords = [
      'intéressé', 'oui', 'investir', 'rendez-vous', 'patrimoine',
      'placement', 'épargne', 'retraite', 'fiscale', 'conseil'
    ];

    const negativeKeywords = [
      'non', 'pas intéressé', 'jamais', 'stop', 'occupé',
      'pas le temps', 'déjà', 'pas besoin', 'rappeler plus'
    ];

    const positiveCount = positiveKeywords.filter(keyword =>
      transcript.toLowerCase().includes(keyword)
    ).length;

    const negativeCount = negativeKeywords.filter(keyword =>
      transcript.toLowerCase().includes(keyword)
    ).length;

    // Calcul du score basique
    let baseScore = 50;
    baseScore += positiveCount * 10;
    baseScore -= negativeCount * 15;

    // Ajustements selon la longueur de conversation
    const transcriptLength = transcript.length;
    if (transcriptLength > 500) baseScore += 10; // Conversation engagée
    if (transcriptLength < 100) baseScore -= 20; // Conversation courte

    // Vérifier si des questions ont été posées
    const questionsAsked = questions.filter(q =>
      transcript.toLowerCase().includes(q.toLowerCase().substring(0, 20))
    ).length;

    baseScore += questionsAsked * 5;

    // Normaliser le score entre 0 et 100
    analysis.score = Math.max(0, Math.min(100, baseScore));

    // Déterminer le résultat
    if (analysis.score >= 70) {
      analysis.result = 'CHAUD';
      analysis.notes = 'Prospect très intéressé, forte probabilité de conversion';
    } else if (analysis.score >= 40) {
      analysis.result = 'TIEDE';
      analysis.notes = 'Prospect moyennement intéressé, nécessite un suivi';
    } else if (analysis.score >= 20) {
      analysis.result = 'FROID';
      analysis.notes = 'Prospect peu intéressé, à recontacter plus tard';
    } else {
      analysis.result = 'NON_QUALIFIE';
      analysis.notes = 'Prospect non qualifié ou pas intéressé';
    }

    return analysis;
  }
}

// ========================================
// EXPORTATIONS
// ========================================

export default VapiService;