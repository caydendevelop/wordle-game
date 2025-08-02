import React, { useState, useEffect, useCallback } from 'react';
import { WordleAPI } from '../services/api';
import GameBoard from './GameBoard';
import Keyboard from './Keyboard';
import { Player, GuessResult, MultiPlayerGameState, GuessResponse } from '../types/game';

interface GameState {
  guesses: string[];
  guessResults: GuessResult[][];
  currentRound: number;
  gameOver: boolean;
  won: boolean;
  targetWord?: string;
  finished?: boolean;
}

interface MultiPlayerGameProps {
  roomId: string;
  playerId: string;
  players: Player[];
  onGameEnd: () => void;
  onLeaveGame: () => void;
}

const MultiPlayerGame: React.FC<MultiPlayerGameProps> = ({
  roomId,
  playerId,
  players: initialPlayers,
  onGameEnd,
  onLeaveGame
}) => {
  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    guessResults: [],
    currentRound: 0,
    gameOver: false,
    won: false
  });
  const [currentGuess, setCurrentGuess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gamePollingInterval, setGamePollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize game state
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true);
        const gameData: MultiPlayerGameState = await WordleAPI.getMultiPlayerGameState(roomId, playerId);
        if (gameData) {
          setGameState({
            guesses: gameData.guesses || [],
            guessResults: gameData.guessResults || [],
            currentRound: gameData.guesses?.length || 0,
            gameOver: gameData.finished || false,
            won: gameData.won || false,
            targetWord: gameData.targetWord,
            finished: gameData.finished
          });
        }
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError('Failed to load game state');
      } finally {
        setLoading(false);
      }
    };

    initializeGame();
  }, [roomId, playerId]);

  // Poll for game updates
  useEffect(() => {
    if (!gameState.gameOver) {
      const interval = setInterval(async () => {
        try {
          const [gameData, roomData] = await Promise.all([
            WordleAPI.getMultiPlayerGameState(roomId, playerId),
            WordleAPI.getMultiPlayerRoom(roomId)
          ]);

          if (gameData) {
            setGameState(prev => ({
              ...prev,
              guesses: gameData.guesses || prev.guesses,
              guessResults: gameData.guessResults || prev.guessResults,
              currentRound: gameData.guesses?.length || prev.currentRound,
              gameOver: gameData.finished || prev.gameOver,
              won: gameData.won || prev.won,
              targetWord: gameData.targetWord || prev.targetWord,
              finished: gameData.finished || prev.finished
            }));
          }

          if (roomData?.players) {
            setPlayers(roomData.players);
          }
        } catch (error) {
          console.error('Failed to poll game updates:', error);
        }
      }, 1000);

      setGamePollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else {
      if (gamePollingInterval) {
        clearInterval(gamePollingInterval);
        setGamePollingInterval(null);
      }
    }
  }, [roomId, playerId, gameState.gameOver]);

  // Handle game end
  useEffect(() => {
    if (gameState.gameOver && gameState.finished) {
      const timer = setTimeout(() => {
        onGameEnd();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState.gameOver, gameState.finished, onGameEnd]);

  const handleKeyPress = useCallback((key: string) => {
    if (gameState.gameOver || loading) return;
    
    if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key.toUpperCase());
    }
  }, [gameState.gameOver, loading, currentGuess.length]);

  const handleBackspace = useCallback(() => {
    if (gameState.gameOver || loading) return;
    
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameState.gameOver, loading]);

  const handleEnter = useCallback(async () => {
  if (gameState.gameOver || loading || currentGuess.length !== 5) return;

  try {
    setLoading(true);
    setError(null);

    const response: GuessResponse = await WordleAPI.submitMultiPlayerGuess(roomId, playerId, currentGuess);
    
    if (response.success) {
      const newGuesses = [...gameState.guesses, currentGuess];
      const isCorrect = response.result?.every((r: GuessResult) => r.status === 'HIT');
      const isGameOver = isCorrect || newGuesses.length >= 6;

      // Fix: Properly handle the guessResults update
      let newGuessResults = [...gameState.guessResults];
      if (response.result) {
        newGuessResults.push(response.result);
      }

      setGameState(prev => ({
        ...prev,
        guesses: newGuesses,
        guessResults: newGuessResults, // Use the properly constructed array
        currentRound: newGuesses.length,
        gameOver: isGameOver,
        won: isCorrect || false,
        finished: isGameOver
      }));

      setCurrentGuess('');
    } else {
      setError(response.message || 'Invalid guess');
    }
  } catch (err) {
    console.error('Failed to submit guess:', err);
    setError('Failed to submit guess');
  } finally {
    setLoading(false);
  }
}, [gameState.gameOver, gameState.guesses, gameState.guessResults, loading, currentGuess, roomId, playerId]);

  const handleLeaveGame = () => {
    if (gamePollingInterval) {
      clearInterval(gamePollingInterval);
      setGamePollingInterval(null);
    }
    onLeaveGame();
  };

  if (loading && gameState.guesses.length === 0) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <div className="multiplayer-game">
      <div className="game-header">
        <div className="game-title">
          <h2>Multiplayer Wordle</h2>
          <div className="room-info">
            <span>Room: {roomId}    |   </span>
            <span>Player: {playerId}</span>
          </div>
        </div>
        <button onClick={handleLeaveGame} className="leave-game-btn">
          Leave Game
        </button>
      </div>

      <div className="game-content">
        <div className="game-area">
          <GameBoard 
            guesses={gameState.guessResults}
            currentRound={gameState.currentRound}
            maxRounds={6}
            currentGuess={currentGuess}
            disabled={gameState.gameOver}
          />
          
          <Keyboard 
            onKeyPress={handleKeyPress}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            guesses={gameState.guessResults}
            disabled={gameState.gameOver || loading}
          />

          <div className="game-status">
            {error && <div className="error-message">{error}</div>}
            
            {gameState.gameOver && (
              <div className={`game-result ${gameState.won ? 'won' : 'lost'}`}>
                {gameState.won ? (
                  <div>
                    <h3>🎉 You Won!</h3>
                    <p>You guessed the word in {gameState.guesses.length} tries!</p>
                  </div>
                ) : (
                  <div>
                    <h3>😔 Game Over</h3>
                    <p>The word was: <strong>{gameState.targetWord}</strong></p>
                  </div>
                )}
              </div>
            )}

            {loading && <div className="loading-indicator">Submitting guess...</div>}
          </div>
        </div>

        <div className="players-sidebar">
          <h3>Players</h3>
          <div className="players-standings">
            {players
              .sort((a, b) => {
                if (a.rank && b.rank) return a.rank - b.rank;
                if (a.rank) return -1;
                if (b.rank) return 1;
                return (a.guesses?.length || 0) - (b.guesses?.length || 0);
              })
              .map((player: Player) => (
                <div 
                  key={player.playerId} 
                  className={`player-status ${player.playerId === playerId ? 'current-player' : ''} ${player.finished ? 'finished' : ''}`}
                >
                  <div className="player-header">
                   <span className="player-name">
                      {player.username || player.playerId}
                       <span> {player.playerId === playerId && ' (You) '} : </span>
                    </span>
                    {player.rank && <span className="rank">#{player.rank}</span>}
                  </div>
                  
                  <div className="player-progress">
                    <span className="guesses-count">
                      Guesses: {player.guesses?.length || 0}/6
                    </span>
                    
                    {player.finished && (
                      <span className={`finish-status ${player.won || player.hasWon ? 'won' : 'lost'}`}>
                        {player.won || player.hasWon ? '✅ Won' : '❌ Lost'}
                      </span>
                    )}
                  </div>

                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${((player.guesses?.length || 0) / 6) * 100}%`,
                        backgroundColor: player.finished 
                          ? (player.won || player.hasWon) ? '#22c55e' : '#ef4444'
                          : '#3b82f6'
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiPlayerGame;
