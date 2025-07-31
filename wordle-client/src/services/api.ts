import axios, { AxiosError } from 'axios';
import { GameState, GuessRequest, ErrorResponse, WordleApiError } from '../types/game';

const API_BASE_URL = '/api/wordle';

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

  static async createNewGame(maxRounds: number = 6): Promise<GameState> {
    try {
      const response = await axios.post<GameState>(`${API_BASE_URL}/new-game?maxRounds=${maxRounds}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async makeGuess(request: GuessRequest): Promise<GameState> {
    try {
      console.log('Making guess request:', request);
      const response = await axios.post<GameState>(`${API_BASE_URL}/guess`, request, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async getGame(gameId: string): Promise<GameState> {
    try {
      const response = await axios.get<GameState>(`${API_BASE_URL}/game/${gameId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  static async deleteGame(gameId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/game/${gameId}`);
    } catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }
}
