import React from 'react';
import { GuessResult, LetterStatus } from '../types/game';
import './GameBoard.css';

interface GameBoardProps {
  guesses: GuessResult[][];
  currentRound: number;
  maxRounds: number;
  currentGuess: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  guesses, 
  currentRound, 
  maxRounds, 
  currentGuess 
}) => {
  const renderCell = (letter: string, status?: LetterStatus, index?: number) => {
    let className = 'cell';
    if (status) {
      className += ` cell-${status.toLowerCase()}`;
    } else if (letter) {
      className += ' cell-filled';
    }

    return (
      <div key={index} className={className}>
        {letter}
      </div>
    );
  };

  const renderRow = (rowIndex: number) => {
    if (rowIndex < guesses.length) {
      // Completed guess
      return (
        <div key={rowIndex} className="row">
          {guesses[rowIndex].map((result, i) => 
            renderCell(result.letter, result.status, i)
          )}
        </div>
      );
    } else if (rowIndex === currentRound) {
      // Current guess row
      const letters = currentGuess.split('');
      return (
        <div key={rowIndex} className="row">
          {Array.from({ length: 5 }, (_, i) => 
            renderCell(letters[i] || '', undefined, i)
          )}
        </div>
      );
    } else {
      // Empty row
      return (
        <div key={rowIndex} className="row">
          {Array.from({ length: 5 }, (_, i) => 
            renderCell('', undefined, i)
          )}
        </div>
      );
    }
  };

  return (
    <div className="game-board">
      {Array.from({ length: maxRounds }, (_, i) => renderRow(i))}
    </div>
  );
};

export default GameBoard;
