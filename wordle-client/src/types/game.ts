export enum LetterStatus {
  HIT = 'HIT',
  PRESENT = 'PRESENT',
  MISS = 'MISS'
}

export interface GuessResult {
  letter: string;
  status: LetterStatus;
}

export interface GameState {
  gameId: string;
  guesses: GuessResult[][];
  currentRound: number;
  maxRounds: number;
  gameOver: boolean;
  won: boolean;
  message?: string;
  targetWord?: string;
}

export interface GuessRequest {
  gameId: string;
  guess: string;
}

// Add error response interface
export interface ErrorResponse {
  error: string;
  message: string;
  code: number;
}

// Add custom error class
export class WordleApiError extends Error {
  constructor(
    public type: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'WordleApiError';
  }
}
