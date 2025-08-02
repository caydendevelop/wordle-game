import React, { useState, useEffect, useCallback } from 'react';
import { GameState, WordleApiError } from '../types/game';
import { WordleAPI } from '../services/api';
import GameBoard from './GameBoard';
import Keyboard from './Keyboard';
import './WordleGame.css';

const WordleGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [errorType, setErrorType] = useState<string>('');

  const startNewGame = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorType('');
      const newGame = await WordleAPI.createNewGame();
      setGameState(newGame);
      setCurrentGuess('');
    } catch (err) {
      console.error('Failed to start new game:', err);
      if (err instanceof WordleApiError) {
        setError(err.message);
        setErrorType(err.type);
      } else {
        setError('Failed to start new game. Please try again.');
        setErrorType('UNKNOWN_ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  const makeGuess = async () => {
    if (!gameState || currentGuess.length !== 5 || loading) return;

    try {
      setLoading(true);
      setError('');
      setErrorType('');
      const updatedGame = await WordleAPI.makeGuess({
        gameId: gameState.gameId,
        guess: currentGuess
      });
      setGameState(updatedGame);
      setCurrentGuess('');
    } catch (err) {
      console.error('Failed to make guess:', err);
      if (err instanceof WordleApiError) {
        setError(err.message);
        setErrorType(err.type);
        
        // Don't clear the guess for word validation errors - user can try again
        if (err.type !== 'WORD_NOT_FOUND') {
          setCurrentGuess('');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
        setErrorType('UNKNOWN_ERROR');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError('');
    setErrorType('');
  };

  const handleKeyPress = (key: string) => {
    if (gameState?.gameOver || loading) return;
    
    // Clear error when user starts typing (except for network errors)
    if (error && errorType !== 'NETWORK_ERROR') {
      clearError();
    }
    
    if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setCurrentGuess(prev => prev.slice(0, -1));
    
    // Clear word validation errors when user modifies their guess
    if (errorType === 'WORD_NOT_FOUND' || errorType === 'INVALID_LENGTH' || errorType === 'INVALID_FORMAT') {
      clearError();
    }
  };

  const handleEnter = () => {
    if (currentGuess.length === 5 && !loading) {
      makeGuess();
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameState?.gameOver || loading) return;

    if (event.key === 'Enter') {
      handleEnter();
    } else if (event.key === 'Backspace') {
      handleBackspace();
    } else if (/^[a-zA-Z]$/.test(event.key)) {
      handleKeyPress(event.key.toUpperCase());
    }
  }, [gameState, currentGuess, loading]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    startNewGame();
  }, []);

  // Determine error message styling based on error type
  const getErrorClassName = () => {
    const baseClass = 'error-message';
    switch (errorType) {
      case 'WORD_NOT_FOUND':
        return `${baseClass} error-word-validation`;
      case 'NETWORK_ERROR':
        return `${baseClass} error-network`;
      case 'TIMEOUT_ERROR':
        return `${baseClass} error-timeout`;
      default:
        return baseClass;
    }
  };

  if (!gameState && loading) {
    return (
      <div className="wordle-game loading">
        <h1>Wordle</h1>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!gameState && error) {
    return (
      <div className="wordle-game error">
        <h1>Wordle</h1>
        <div className={getErrorClassName()}>{error}</div>
        <button onClick={startNewGame} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  return (
    <div className="wordle-game">
      <header className="game-header">
        <h1>Wordle</h1>
        <button onClick={startNewGame} disabled={loading} className="new-game-btn">
          {loading ? 'Loading...' : 'New Game'}
        </button>
      </header>

      {error && (
        <div className={getErrorClassName()}>
          {error}
          {errorType === 'WORD_NOT_FOUND' && (
            <button onClick={clearError} className="dismiss-error-btn">
              Dismiss
            </button>
          )}
        </div>
      )}

      <GameBoard
        guesses={gameState.guesses}
        currentRound={gameState.currentRound}
        maxRounds={gameState.maxRounds}
        currentGuess={currentGuess} disabled={false}      />

      {gameState.gameOver && (
        <div className="game-over">
          <h2>{gameState.won ? '🎉 Congratulations!' : '😞 Game Over'}</h2>
          {gameState.message && <p>{gameState.message}</p>}
          {gameState.targetWord && (
            <p>The word was: <strong>{gameState.targetWord}</strong></p>
          )}
          <button onClick={startNewGame} className="play-again-btn" disabled={loading}>
            {loading ? 'Loading...' : 'Play Again'}
          </button>
        </div>
      )}

      <Keyboard
        onKeyPress={handleKeyPress}
        onEnter={handleEnter}
        onBackspace={handleBackspace}
        guesses={gameState.guesses}
        disabled={gameState.gameOver || loading}
      />

      <div className="game-info">
        <p>Round: {gameState.currentRound} / {gameState.maxRounds}</p>
        {currentGuess && (
          <p>Current guess: <strong>{currentGuess}</strong></p>
        )}
      </div>
    </div>
  );
};

export default WordleGame;
