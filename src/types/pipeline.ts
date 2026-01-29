export interface UnifiedStage {
  id: string;
  slug: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

export type WaitingSubtype = 'plaquette' | 'rappel_differe';




