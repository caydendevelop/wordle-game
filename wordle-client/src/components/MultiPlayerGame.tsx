import React, { useState, useEffect, useRef } from 'react';
import { WebSocketService } from '../services/WebSocketService';

interface GameProps {
  room: any;
  playerId: string;
  onRoomUpdate: (room: any) => void;
}

const MultiPlayerGame: React.FC<GameProps> = ({ room, playerId, onRoomUpdate }) => {
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState(room);
  const [targetWord, setTargetWord] = useState<string>('');
  const wsService = useRef<WebSocketService>(new WebSocketService());

  const currentPlayer = gameState.players.find((p: any) => p.playerId === playerId);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await wsService.current.connect(room.roomId, handleWebSocketMessage);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      wsService.current.disconnect();
    };
  }, [room.roomId]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'PLAYER_JOINED':
        setGameState(message.room);
        onRoomUpdate(message.room);
        break;
      case 'GAME_STARTED':
        setGameState(message.room);
        onRoomUpdate(message.room);
        break;
      case 'GUESS_RESULT':
        setGameState(message.room);
        onRoomUpdate(message.room);
        break;
      case 'GAME_ENDED':
        setGameState(message.room);
        setTargetWord(message.targetWord);
        onRoomUpdate(message.room);
        break;
    }
  };

  const submitGuess = (guess: string) => {
    if (guess.length === 5 && currentPlayer && !currentPlayer.hasWon && currentPlayer.guesses.length < 6) {
      wsService.current.sendGuess(playerId, guess);
      setCurrentGuess('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitGuess(currentGuess);
    } else if (e.key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + e.key.toUpperCase());
    }
  };

  const getLetterStyle = (result: any) => {
    switch (result.status) {
      case 'HIT': return { backgroundColor: '#6aaa64', color: 'white' };
      case 'PRESENT': return { backgroundColor: '#c9b458', color: 'white' };
      default: return { backgroundColor: '#787c7e', color: 'white' };
    }
  };

  const isGameFinished = gameState.status === 'FINISHED';

  return (
    <div className="multiplayer-game" onKeyDown={handleKeyPress} tabIndex={0}>
      <h2>Multi-player Wordle - {gameState.roomName}</h2>
      
      <div className="players-section">
        <h3>Players Progress</h3>
        <div className="players-grid">
          {gameState.players.map((player: any) => (
            <div key={player.playerId} className={`player-card ${player.playerId === playerId ? 'current-player' : ''}`}>
              <h4>
                {player.username} 
                {player.hasWon && <span className="winner-badge">🏆</span>}
                {player.playerId === playerId && <span className="you-badge">(You)</span>}
              </h4>
              <p>Round: {player.guesses.length}/6</p>
              {player.rank > 0 && <p>Rank: #{player.rank} ({player.points} pts)</p>}
              
              <div className="mini-grid">
                {player.guessResults.map((guessResult: any, index: number) => (
                  <div key={index} className="mini-row">
                    {guessResult.map((letterResult: any, letterIndex: number) => (
                      <div 
                        key={letterIndex} 
                        className="mini-cell"
                        style={getLetterStyle(letterResult)}
                      >
                        {letterResult.letter}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="main-game-section">
        <h3>Your Game</h3>
        <div className="game-grid">
          {currentPlayer?.guessResults.map((guessResult: any, index: number) => (
            <div key={index} className="guess-row">
              {guessResult.map((letterResult: any, letterIndex: number) => (
                <div 
                  key={letterIndex} 
                  className="game-cell filled"
                  style={getLetterStyle(letterResult)}
                >
                  {letterResult.letter}
                </div>
              ))}
            </div>
          ))}
          
          {!currentPlayer?.hasWon && currentPlayer?.guesses.length < 6 && !isGameFinished && (
            <div className="guess-row">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="game-cell">
                  {currentGuess[index] || ''}
                </div>
              ))}
            </div>
          )}
          
          {Array.from({ 
            length: Math.max(0, 6 - (currentPlayer?.guesses.length || 0) - ((!currentPlayer?.hasWon && !isGameFinished && (currentPlayer?.guesses.length || 0) < 6) ? 1 : 0))
          }, (_, index) => (
            <div key={index} className="guess-row">
              {Array.from({ length: 5 }, (_, cellIndex) => (
                <div key={cellIndex} className="game-cell"></div>
              ))}
            </div>
          ))}
        </div>

        <div className="game-input">
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="Enter your guess"
            maxLength={5}
            disabled={currentPlayer?.hasWon || isGameFinished || (currentPlayer?.guesses.length || 0) >= 6}
            onKeyPress={(e) => e.key === 'Enter' && submitGuess(currentGuess)}
          />
          <button 
            onClick={() => submitGuess(currentGuess)}
            disabled={currentGuess.length !== 5 || currentPlayer?.hasWon || isGameFinished || (currentPlayer?.guesses.length || 0) >= 6}
          >
            Submit Guess
          </button>
        </div>

        {isGameFinished && (
          <div className="game-results">
            <h3>Game Finished!</h3>
            <p><strong>The word was: {targetWord}</strong></p>
            {gameState.winnerId && (
              <p>Winner: {gameState.players.find((p: any) => p.playerId === gameState.winnerId)?.username}</p>
            )}
            
            <div className="final-rankings">
              <h4>Final Rankings:</h4>
              {gameState.players
                .filter((p: any) => p.rank > 0)
                .sort((a: any, b: any) => a.rank - b.rank)
                .map((player: any) => (
                  <div key={player.playerId} className="rank-item">
                    #{player.rank} - {player.username} ({player.points} points)
                  </div>
                ))}
            </div>
            
            <button onClick={() => window.location.reload()}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiPlayerGame;
