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
  finished?: boolean;
}

export interface GuessRequest {
  gameId: string;
  guess: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: number;
}

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

export interface MultiPlayerGameState {
  guesses: string[];
  guessResults: GuessResult[][];
  finished: boolean;
  won: boolean;
  targetWord?: string;
  rank?: number;
  points?: number;
}

export interface Player {
  playerId: string;
  username?: string;
  guesses?: string[];
  guessResults?: GuessResult[][];
  rank?: number;
  finished?: boolean;
  won?: boolean;
  hasWon?: boolean;
  points?: number;
  winTime?: string;
}

export interface MultiPlayerRoom {
  roomId: string;
  roomName?: string;
  creatorId: string;
  players: Player[];
  maxPlayers: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  winnerId?: string;
  createdAt?: string;
  currentWord?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GuessResponse {
  success: boolean;
  message?: string;
  result?: GuessResult[];
  gameState?: MultiPlayerGameState;
}

export interface CreateRoomRequest {
  creatorId: string;
  roomName: string;
  username: string;
  maxPlayers: number;
}

export interface JoinRoomRequest {
  roomId: string;
  playerId: string;
  username: string;
}
