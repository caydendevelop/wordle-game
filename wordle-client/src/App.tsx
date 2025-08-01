// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WordleGame from './components/WordleGame';
import MultiPlayerLobby from './components/MultiPlayerLobby';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">Single Player</Link>
          <Link to="/multiplayer">Multiplayer</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<WordleGame />} />
          <Route path="/multiplayer" element={<MultiPlayerLobby />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
