import { createClient } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

if (!DEEPGRAM_API_KEY) {
  console.warn('Deepgram API key not configured. Transcription services will be unavailable.');
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  summary?: string;
  keyPoints?: string[];
  sentiment?: {
    overall: 'positive' | 'negative' | 'neutral';
    score: number;
  };
}

export interface TranscriptionOptions {
  language?: string;
  model?: string;
  punctuate?: boolean;
  diarize?: boolean;
  summarize?: boolean;
  detectTopics?: boolean;
}

export class TranscriptionService {
  private static deepgram = DEEPGRAM_API_KEY ? createClient(DEEPGRAM_API_KEY) : null;

  /**
   * Transcrit un fichier audio
   */
  static async transcribeAudio(
    audioBuffer: Buffer,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.deepgram) {
      throw new Error('Deepgram API key not configured');
    }

    const {
      language = 'fr',
      model = 'nova-2',
      punctuate = true,
      diarize = true,
      summarize = false,
      detectTopics = false
    } = options;

    try {
      const response = await this.deepgram.listen.prerecorded.transcribeBuffer(
        audioBuffer,
        {
          model,
          language,
          punctuate,
          diarize,
          smart_format: true,
          paragraphs: true,
          utterances: true,
          summarize,
          detect_topics: detectTopics
        }
      );

      const result = response.result;

      if (!result.channels?.[0]?.alternatives?.[0]) {
        throw new Error('No transcription result received');
      }

      const transcript = result.channels[0].alternatives[0];

      // Extraction du texte principal
      const transcriptText = transcript.transcript || '';
      const confidence = transcript.confidence || 0;

      // Extraction des mots avec timing si disponible
      const words = transcript.words?.map(word => ({
        word: word.word || '',
        start: word.start || 0,
        end: word.end || 0,
        confidence: word.confidence || 0
      }));

      // Extraction du résumé si demandé
      let summary: string | undefined;
      if (summarize && result.results?.summary?.short) {
        summary = result.results.summary.short;
      }

      // Extraction des topics/points clés si demandés
      let keyPoints: string[] | undefined;
      if (detectTopics && result.results?.topics) {
        keyPoints = result.results.topics.map((topic: any) => topic.topic);
      }

      return {
        transcript: transcriptText,
        confidence,
        words,
        summary,
        keyPoints
      };

    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transcrit une URL audio (ex: enregistrement Twilio)
   */
  static async transcribeFromUrl(
    audioUrl: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.deepgram) {
      throw new Error('Deepgram API key not configured');
    }

    const {
      language = 'fr',
      model = 'nova-2',
      punctuate = true,
      diarize = true,
      summarize = false,
      detectTopics = false
    } = options;

    try {
      const response = await this.deepgram.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        {
          model,
          language,
          punctuate,
          diarize,
          smart_format: true,
          paragraphs: true,
          utterances: true,
          summarize,
          detect_topics: detectTopics
        }
      );

      const result = response.result;

      if (!result.channels?.[0]?.alternatives?.[0]) {
        throw new Error('No transcription result received');
      }

      const transcript = result.channels[0].alternatives[0];

      const transcriptText = transcript.transcript || '';
      const confidence = transcript.confidence || 0;

      const words = transcript.words?.map(word => ({
        word: word.word || '',
        start: word.start || 0,
        end: word.end || 0,
        confidence: word.confidence || 0
      }));

      let summary: string | undefined;
      if (summarize && result.results?.summary?.short) {
        summary = result.results.summary.short;
      }

      let keyPoints: string[] | undefined;
      if (detectTopics && result.results?.topics) {
        keyPoints = result.results.topics.map((topic: any) => topic.topic);
      }

      return {
        transcript: transcriptText,
        confidence,
        words,
        summary,
        keyPoints
      };

    } catch (error) {
      console.error('Error transcribing audio from URL:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyse le sentiment d'un texte transcrit
   */
  static async analyzeSentiment(text: string): Promise<{
    overall: 'positive' | 'negative' | 'neutral';
    score: number;
  }> {
    // Implementation basique - pourrait être améliorée avec une API dédiée
    const positiveWords = [
      'bien', 'excellent', 'parfait', 'super', 'génial', 'content', 'satisfait',
      'merci', 'oui', 'accord', 'intéressé', 'intéressant', 'bon', 'bonne'
    ];

    const negativeWords = [
      'mal', 'terrible', 'nul', 'mauvais', 'non', 'refus', 'impossible',
      'problème', 'difficile', 'compliqué', 'cher', 'trop', 'jamais'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) {
        positiveCount++;
      }
      if (negativeWords.some(neg => word.includes(neg))) {
        negativeCount++;
      }
    });

    const totalSentimentWords = positiveCount + negativeCount;

    if (totalSentimentWords === 0) {
      return { overall: 'neutral', score: 0 };
    }

    const score = (positiveCount - negativeCount) / totalSentimentWords;

    let overall: 'positive' | 'negative' | 'neutral';
    if (score > 0.2) {
      overall = 'positive';
    } else if (score < -0.2) {
      overall = 'negative';
    } else {
      overall = 'neutral';
    }

    return { overall, score };
  }

  /**
   * Génère un résumé intelligent avec l'IA Claude
   */
  static async generateAISummary(
    transcript: string,
    prospectName?: string,
    callDuration?: number
  ): Promise<{
    summary: string;
    keyPoints: string[];
    nextActions: string[];
    objections?: string[];
    outcome?: string;
  }> {
    // Import dynamique pour éviter les erreurs côté client
    const { Anthropic } = await import('@anthropic-ai/sdk');

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `
Analyse cette transcription d'appel commercial avec un prospect ${prospectName ? `(${prospectName})` : ''}.
Durée de l'appel : ${callDuration ? `${Math.floor(callDuration / 60)} minutes` : 'inconnue'}.

TRANSCRIPTION :
${transcript}

Fournis une analyse structurée au format JSON avec :

1. **summary** : Résumé de 2-3 phrases de l'appel
2. **keyPoints** : Array de 3-5 points clés abordés
3. **nextActions** : Array de 2-3 prochaines actions recommandées
4. **objections** : Array des objections soulevées par le prospect (si applicable)
5. **outcome** : Résultat de l'appel ("rdv_pris", "callback_demande", "pas_interesse", "a_rappeler", "information_demandee")

Réponds UNIQUEMENT en JSON valide, sans markdown ni texte supplémentaire.
`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from AI');
      }

      const analysis = JSON.parse(content.text);

      return {
        summary: analysis.summary || '',
        keyPoints: analysis.keyPoints || [],
        nextActions: analysis.nextActions || [],
        objections: analysis.objections || [],
        outcome: analysis.outcome || 'inconnu'
      };

    } catch (error) {
      console.error('Error generating AI summary:', error);

      // Fallback basique si l'IA échoue
      return {
        summary: `Appel ${callDuration ? `de ${Math.floor(callDuration / 60)} minutes` : ''} avec ${prospectName || 'prospect anonyme'}`,
        keyPoints: ['Transcription disponible pour analyse manuelle'],
        nextActions: ['Analyser la transcription manuellement', 'Planifier un suivi'],
        objections: [],
        outcome: 'a_analyser'
      };
    }
  }

  /**
   * Traite complètement un enregistrement d'appel
   */
  static async processCallRecording(
    audioBuffer: Buffer,
    metadata: {
      prospectName?: string;
      callDuration?: number;
      callSid?: string;
    }
  ): Promise<{
    transcription: TranscriptionResult;
    analysis: {
      summary: string;
      keyPoints: string[];
      nextActions: string[];
      objections?: string[];
      outcome?: string;
    };
    sentiment: {
      overall: 'positive' | 'negative' | 'neutral';
      score: number;
    };
  }> {
    try {
      // 1. Transcription avec Deepgram
      const transcription = await this.transcribeAudio(audioBuffer, {
        language: 'fr',
        diarize: true,
        punctuate: true,
        summarize: true,
        detectTopics: true
      });

      // 2. Analyse du sentiment
      const sentiment = await this.analyzeSentiment(transcription.transcript);

      // 3. Analyse IA avec Claude
      const analysis = await this.generateAISummary(
        transcription.transcript,
        metadata.prospectName,
        metadata.callDuration
      );

      return {
        transcription,
        analysis,
        sentiment
      };

    } catch (error) {
      console.error('Error processing call recording:', error);
      throw new Error(`Failed to process recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}