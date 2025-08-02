import axios, { AxiosError } from 'axios';
import { 
  GameState, 
  GuessRequest, 
  ErrorResponse, 
  WordleApiError,
  MultiPlayerRoom,
  Player,
  MultiPlayerGameState,
  GuessResponse,
  CreateRoomRequest,
  JoinRoomRequest,
  GuessResult
} from '../types/game';

const getApiBaseUrl = (): string => {
  return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl() + '/api/wordle';
console.log('API Base URL:', API_BASE_URL);


axios.interceptors.request.use(request => {
  console.log('API Request:', request.method?.toUpperCase(), request.url);
  return request;
});


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
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new WordleApiError(
        'NETWORK_ERROR',
        0,
        'Unable to connect to the server. Please check your connection and try again.'
      );
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new WordleApiError(
        'TIMEOUT_ERROR',
        408,
        'Request timed out. Please try again.'
      );
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.statusText || 'An unexpected error occurred';
    throw new WordleApiError('UNKNOWN_ERROR', status, message);
  }

  // Single-player methods
  static async createNewGame(maxRounds: number = 6): Promise<GameState> {
    try {
      const response = await axios.post<GameState>(`${API_BASE_URL}/new-game?maxRounds=${maxRounds}`, {}, {
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async startMultiPlayerGame(roomId: string, playerId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await axios.post(`${getApiBaseUrl()}/api/multiplayer/start-game`, {
        roomId
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      
      return { success: true };
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Cannot start game';
        return { success: false, message: errorMessage };
      }
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

  static async getMultiPlayerGameState(roomId: string, playerId: string): Promise<MultiPlayerGameState> {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/api/multiplayer/game-state/${roomId}/${playerId}`, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async submitMultiPlayerGuess(roomId: string, playerId: string, guess: string): Promise<GuessResponse> {
    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/multiplayer/guess`, {
        roomId,
        playerId,
        guess
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid guess';
        return { success: false, message: errorMessage };
      }
      throw this.handleError(error as AxiosError);
    }
  }
}
