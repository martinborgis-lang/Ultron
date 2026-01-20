// Types pour le système de meeting avec transcription temps réel

export interface MeetingTranscript {
  id: string;
  organization_id: string;
  prospect_id: string | null;
  user_id: string;

  meeting_date: string;
  duration_seconds: number | null;

  transcript_text: string | null;
  transcript_json: TranscriptSegment[] | null;

  ai_summary: string | null;
  key_points: string[] | null;
  objections_detected: ObjectionDetected[] | null;
  next_actions: string[] | null;

  pdf_url: string | null;
  google_meet_link: string | null;

  created_at: string;
}

export interface TranscriptSegment {
  timestamp: number; // Seconds from start
  speaker: 'advisor' | 'prospect' | 'unknown';
  text: string;
  confidence: number;
}

export interface ObjectionDetected {
  timestamp: number;
  objection: string;
  suggested_response: string;
  category: 'price' | 'trust' | 'timing' | 'competition' | 'need' | 'other';
}

export interface RealtimeAnalysis {
  objectionDetectee: string | null;
  reponseObjection: string | null;
  questionSuivante: string | null;
  pointCle: string | null;
  tonalite: 'Positive' | 'Neutre' | 'Negative';
}

export interface MeetingPrepSuggestions {
  questionsSuggerees: string[];
  argumentsCles: string[];
  objectionsProba: string[];
}

export interface DeepgramTranscriptResponse {
  channel: {
    alternatives: {
      transcript: string;
      confidence: number;
      words: {
        word: string;
        start: number;
        end: number;
        confidence: number;
      }[];
    }[];
  };
  is_final: boolean;
  speech_final: boolean;
}

export interface SaveMeetingRequest {
  prospect_id: string;
  google_meet_link?: string;
  transcript_segments: TranscriptSegment[];
  duration_seconds: number;
}

export interface SaveMeetingResponse {
  id: string;
  ai_summary: string;
  key_points: string[];
  objections_detected: ObjectionDetected[];
  next_actions: string[];
  pdf_url: string | null;
}

// Types pour le streaming WebSocket
export interface DeepgramConfig {
  model: 'nova-2' | 'nova' | 'enhanced' | 'base';
  language: string;
  punctuate: boolean;
  interim_results: boolean;
  encoding: 'linear16' | 'opus' | 'mp3' | 'flac';
  sample_rate: number;
  channels: number;
}

export const DEFAULT_DEEPGRAM_CONFIG: DeepgramConfig = {
  model: 'nova-2',
  language: 'fr',
  punctuate: true,
  interim_results: true,
  encoding: 'linear16',
  sample_rate: 16000,
  channels: 1,
};
