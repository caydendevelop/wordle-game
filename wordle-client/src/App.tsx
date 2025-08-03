// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import WordleGame from './components/WordleGame';
import MultiPlayerLobby from './components/MultiPlayerLobby';
import './App.css';

// Wrapper component for MultiPlayerLobby to access navigation
const MultiPlayerWrapper: React.FC = () => {
  const navigate = useNavigate();
  
  const handleLeaveRoom = () => {
    // Navigate back to main menu (single player)
    navigate('/');
    
    // Clear any stored multiplayer state
    localStorage.removeItem('currentRoomId');
    localStorage.removeItem('playerId');
    localStorage.removeItem('currentRoom');
    
    // Optional: Log the action
    console.log('Left multiplayer lobby');
  };

  return <MultiPlayerLobby onLeaveRoom={handleLeaveRoom} />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navigation">
          <div className="nav-container">
            <h1 className="app-title">Wordle Game</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">Single Player</Link>
              <Link to="/multiplayer" className="nav-link">Multiplayer</Link>
            </div>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<WordleGame />} />
            <Route path="/multiplayer" element={<MultiPlayerWrapper />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
