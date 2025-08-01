import axios, { AxiosError } from 'axios';
import { GameState, GuessRequest, ErrorResponse, WordleApiError } from '../types/game';

// Multiplayer interfaces


interface MultiPlayerRoom {
  roomId: string;
  roomName: string;
  creatorId: string;
  players: Player[];
  maxPlayers: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  winnerId?: string;
}

interface Player {
  playerId: string;
  username: string;
  guesses: string[];
  guessResults: any[][];
  hasWon: boolean;
  rank: number;
  points: number;
}

interface CreateRoomRequest {
  creatorId: string;
  roomName: string;
  username: string;
  maxPlayers: number;
}

interface JoinRoomRequest {
  roomId: string;
  playerId: string;
  username: string;
}

// Environment-aware API base URL configuration
const getApiBaseUrl = (): string => {
  // Check if we're in production build
  if (import.meta.env.PROD) {
    // Use environment variable or fallback to Railway URL
    return import.meta.env.VITE_API_URL || 'http://localhost:8080';
  }
  
  // Development mode - check if we have a custom API URL
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default to localhost in development
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl() + '/api/wordle';

// Log the current configuration for debugging
console.log('Environment:', import.meta.env.MODE);
console.log('API Base URL:', API_BASE_URL);

// Add request interceptor for debugging in development
if (import.meta.env.DEV) {
  axios.interceptors.request.use(request => {
    console.log('API Request:', request.method?.toUpperCase(), request.url);
    return request;
  });
}

export class WordleAPI {
  private static handleError(error: AxiosError): never {
    console.error('API Error:', error);
    
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data as ErrorResponse;
      if (errorData.error && errorData.message) {
        throw new WordleApiError(
          errorData.error,
          error.response.status || 500,
          errorData.message
        );
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new WordleApiError(
        'NETWORK_ERROR',
        0,
        'Unable to connect to the server. Please check your connection and try again.'
      );
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      throw new WordleApiError(
        'TIMEOUT_ERROR',
        408,
        'Request timed out. Please try again.'
      );
    }
    
    // Generic error fallback
    const status = error.response?.status || 500;
    const message = error.response?.statusText || 'An unexpected error occurred';
    throw new WordleApiError('UNKNOWN_ERROR', status, message);
  }

  // Single-player methods
  static async createNewGame(maxRounds: number = 6): Promise<GameState> {
    try {
      const response = await axios.post<GameState>(`${API_BASE_URL}/new-game?maxRounds=${maxRounds}`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async makeGuess(request: GuessRequest): Promise<GameState> {
    try {
      const response = await axios.post<GameState>(`${API_BASE_URL}/guess`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async getGame(gameId: string): Promise<GameState> {
    try {
      const response = await axios.get<GameState>(`${API_BASE_URL}/game/${gameId}`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async deleteGame(gameId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/game/${gameId}`, {
        timeout: 10000,
      });
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  // Multiplayer methods
  static async createMultiPlayerRoom(request: CreateRoomRequest): Promise<MultiPlayerRoom> {
    try {
      const response = await axios.post<MultiPlayerRoom>(`${getApiBaseUrl()}/api/multiplayer/create-room`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async joinMultiPlayerRoom(request: JoinRoomRequest): Promise<MultiPlayerRoom> {
    try {
      const response = await axios.post<MultiPlayerRoom>(`${getApiBaseUrl()}/api/multiplayer/join-room`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async startMultiPlayerGame(roomId: string): Promise<void> {
    try {
      await axios.post(`${getApiBaseUrl()}/api/multiplayer/start-game`, 
        { roomId }, 
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async getMultiPlayerRoom(roomId: string): Promise<MultiPlayerRoom> {
    try {
      const response = await axios.get<MultiPlayerRoom>(`${getApiBaseUrl()}/api/multiplayer/room/${roomId}`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async getAvailableRooms(): Promise<MultiPlayerRoom[]> {
    try {
      const response = await axios.get<MultiPlayerRoom[]>(`${getApiBaseUrl()}/api/multiplayer/rooms`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
}
