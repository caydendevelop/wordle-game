import React from 'react';
import { GuessResult, LetterStatus } from '../types/game';
import './Keyboard.css';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  guesses: GuessResult[][];
  disabled: boolean;
}

const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  onEnter,
  onBackspace,
  guesses,
  disabled
}) => {
  const getKeyStatus = (letter: string): LetterStatus | null => {
    let bestStatus: LetterStatus | null = null;
    
    for (const guess of guesses) {
      for (const result of guess) {
        if (result.letter === letter) {
          // Convert both to string to avoid TypeScript enum comparison issues
          const currentStatus = result.status.toString();
          
          switch (currentStatus) {
            case 'HIT':
              return LetterStatus.HIT; // Return immediately for HIT
            case 'PRESENT':
              if (bestStatus?.toString() !== 'HIT') {
                bestStatus = LetterStatus.PRESENT;
              }
              break;
            case 'MISS':
              if (bestStatus === null) {
                bestStatus = LetterStatus.MISS;
              }
              break;
          }
        }
      }
    }
    
    return bestStatus;
  };

  const renderKey = (letter: string, isSpecial: boolean = false) => {
    const status = isSpecial ? null : getKeyStatus(letter);
    let className = 'key';
    
    if (isSpecial) {
      className += ' key-special';
    } else if (status) {
      className += ` key-${status.toString().toLowerCase()}`;
    }

    if (disabled) {
      className += ' key-disabled';
    }

    const handleClick = () => {
      if (disabled) return;
      
      if (letter === 'ENTER') {
        onEnter();
      } else if (letter === '⌫') {
        onBackspace();
      } else {
        onKeyPress(letter);
      }
    };

    return (
      <button
        key={letter}
        className={className}
        onClick={handleClick}
        disabled={disabled}
      >
        {letter}
      </button>
    );
  };

  const topRow = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  const middleRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  const bottomRow = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

  return (
    <div className="keyboard">
      <div className="keyboard-row">
        {topRow.map(letter => renderKey(letter))}
      </div>
      <div className="keyboard-row">
        {middleRow.map(letter => renderKey(letter))}
      </div>
      <div className="keyboard-row">
        {renderKey('ENTER', true)}
        {bottomRow.map(letter => renderKey(letter))}
        {renderKey('⌫', true)}
      </div>
    </div>
  );
};

export default Keyboard;
