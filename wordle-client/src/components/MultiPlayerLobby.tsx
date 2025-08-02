import React, { useState, useEffect } from 'react';
import { WordleAPI } from '../services/api';
import MultiPlayerGame from './MultiPlayerGame';
import { MultiPlayerRoom, Player } from '../types/game';

interface MultiPlayerLobbyProps {
  onLeaveRoom: () => void;
}

const MultiPlayerLobby: React.FC<MultiPlayerLobbyProps> = ({
  onLeaveRoom
}) => {
  const [availableRooms, setAvailableRooms] = useState<MultiPlayerRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<MultiPlayerRoom | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomPollingInterval, setRoomPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Load available rooms on component mount
  useEffect(() => {
    const loadAvailableRooms = async () => {
      try {
        setLoading(true);
        const rooms = await WordleAPI.getAvailableRooms();
        setAvailableRooms(rooms || []);
      } catch (err) {
        console.error('Failed to load available rooms:', err);
        setError('Failed to load available rooms');
      } finally {
        setLoading(false);
      }
    };

    loadAvailableRooms();
  }, []);

  // Load specific room data when a room is selected
  useEffect(() => {
    if (!selectedRoomId) return;

    const loadRoom = async () => {
      try {
        setLoading(true);
        const room = await WordleAPI.getMultiPlayerRoom(selectedRoomId);
        if (room) {
          setCurrentRoom(room);
        } else {
          setError('Room not found');
        }
      } catch (err) {
        console.error('Failed to load room:', err);
        setError('Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [selectedRoomId]);

  // Set up room polling when in a room but WebSocket isn't working
  useEffect(() => {
    if (currentRoom && (currentRoom.status === 'WAITING' || currentRoom.status === 'IN_PROGRESS')) {
      const interval = setInterval(async () => {
        try {
          const updatedRoom = await WordleAPI.getMultiPlayerRoom(currentRoom.roomId);
          if (updatedRoom && JSON.stringify(updatedRoom) !== JSON.stringify(currentRoom)) {
            console.log('Room updated via polling:', updatedRoom);
            setCurrentRoom(updatedRoom);
          }
        } catch (error) {
          console.error('Failed to poll room updates:', error);
        }
      }, 2000);
      
      setRoomPollingInterval(interval);
      
      return () => {
        clearInterval(interval);
      };
    } else {
      if (roomPollingInterval) {
        clearInterval(roomPollingInterval);
        setRoomPollingInterval(null);
      }
    }
  }, [currentRoom]);

  const handleJoinRoom = async (roomId: string) => {
    if (!playerId.trim()) {
      setError('Please enter a player ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const joinRequest = {
        roomId,
        playerId: playerId.trim(),
        username: playerId.trim()
      };
      
      const room = await WordleAPI.joinMultiPlayerRoom(joinRequest);
      setCurrentRoom(room);
      setSelectedRoomId(roomId);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!playerId.trim()) {
      setError('Please enter a player ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const createRequest = {
        creatorId: playerId.trim(),
        roomName: `${playerId.trim()}'s Room`,
        username: playerId.trim(),
        maxPlayers: 4
      };
      
      const room = await WordleAPI.createMultiPlayerRoom(createRequest);
      setCurrentRoom(room);
      setSelectedRoomId(room.roomId);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!currentRoom || playerId !== currentRoom.creatorId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await WordleAPI.startMultiPlayerGame(currentRoom.roomId, playerId);
      if (response.success) {
        console.log('Game started successfully');
      } else {
        setError(response.message || 'Failed to start game');
      }
    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    if (roomPollingInterval) {
      clearInterval(roomPollingInterval);
      setRoomPollingInterval(null);
    }
    
    // Reset to room selection view
    setCurrentRoom(null);
    setSelectedRoomId(null);
    setError(null);
    
    // Refresh available rooms
    const loadAvailableRooms = async () => {
      try {
        const rooms = await WordleAPI.getAvailableRooms();
        setAvailableRooms(rooms || []);
      } catch (err) {
        console.error('Failed to refresh rooms:', err);
      }
    };
    loadAvailableRooms();
  };

  const handleBackToMainLobby = () => {
    if (roomPollingInterval) {
      clearInterval(roomPollingInterval);
      setRoomPollingInterval(null);
    }
    onLeaveRoom();
  };

  const renderGameContent = () => {
    if (loading && availableRooms.length === 0 && !currentRoom) {
      return <div className="loading">Loading rooms...</div>;
    }

    if (error && !currentRoom) {
      return (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={handleBackToMainLobby} className="back-button">
            Back to Main Menu
          </button>
        </div>
      );
    }

    // Show game interface when room is in progress
    if (currentRoom?.status === 'IN_PROGRESS') {
      return (
        <MultiPlayerGame 
          roomId={currentRoom.roomId}
          playerId={playerId}
          players={currentRoom.players}
          onGameEnd={() => {
            setCurrentRoom(prev => prev ? { ...prev, status: 'FINISHED' } : null);
          }}
          onLeaveGame={handleLeaveRoom}
        />
      );
    }

    // Show specific room lobby when a room is selected
    if (currentRoom && currentRoom.status === 'WAITING') {
      return (
        <div className="multiplayer-lobby">
          <div className="lobby-header">
            <h2>Room Lobby</h2>
            <button onClick={handleLeaveRoom} className="leave-button">
              Leave Room
            </button>
          </div>
          
          <div className="room-info">
            <div className="room-details">
              <h3>Room: {currentRoom.roomId}</h3>
              <p>Status: <span className={`status ${currentRoom.status.toLowerCase()}`}>{currentRoom.status}</span></p>
              <p>Player ID: <code>{playerId}</code></p>
              <p>Updates: <span className={wsConnected ? 'connected' : 'polling'}>
                {wsConnected ? '🟢 Live' : '🔴 Polling'}
              </span></p>
            </div>
          </div>

          <div className="players-section">
            <h3>Players ({currentRoom.players.length}/{currentRoom.maxPlayers})</h3>
            <div className="players-list">
              {currentRoom.players.map((player: Player) => (
                <div key={player.playerId} className="player-item">
                  <div className="player-info">
                    <span className="player-name">{player.username || player.playerId}</span>
                    {player.playerId === currentRoom.creatorId && (
                      <span className="host-badge">HOST</span>
                    )}
                  </div>
                  <div className="player-status">
                    {player.playerId === playerId && <span className="you-badge">YOU</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="game-controls">
            {playerId === currentRoom.creatorId ? (
              <button 
                onClick={handleStartGame}
                disabled={loading || currentRoom.players.length < 2}
                className="start-game-btn primary-button"
              >
                {loading ? 'Starting...' : 'Start Game'}
              </button>
            ) : (
              <div className="waiting-message">
                Waiting for host to start the game...
              </div>
            )}
            
            {currentRoom.players.length < 2 && (
              <p className="min-players-notice">
                Need at least 2 players to start the game
              </p>
            )}
          </div>

          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>
      );
    }

    // Show game finished state
    if (currentRoom?.status === 'FINISHED') {
      return (
        <div className="game-finished">
          <h2>Game Finished!</h2>
          <div className="final-results">
            <h3>Final Results:</h3>
            <div className="players-results">
              {currentRoom.players
                .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                .map((player: Player) => (
                  <div key={player.playerId} className="player-result">
                    <span className="rank">#{player.rank || '-'}</span>
                    <span className="name">{player.username || player.playerId}</span>
                    <span className="guesses">{player.guesses?.length || 0}/6 guesses</span>
                  </div>
                ))}
            </div>
          </div>
          <button onClick={handleLeaveRoom} className="back-button">
            Back to Room Selection
          </button>
        </div>
      );
    }

    // Default view: Show available rooms
    return (
      <div className="room-selection">
        <div className="room-selection-header">
          <h2>Multiplayer Lobby</h2>
          <button onClick={handleBackToMainLobby} className="back-button">
            Back to Main Menu
          </button>
        </div>

        <div className="player-input">
          <label htmlFor="playerId">Enter your Player ID:</label>
          <input
            id="playerId"
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="Enter your player ID"
            className="player-id-input"
          />
        </div>

        <div className="room-actions">
          <button 
            onClick={handleCreateRoom}
            disabled={loading || !playerId.trim()}
            className="create-room-btn primary-button"
          >
            {loading ? 'Creating...' : 'Create New Room'}
          </button>
        </div>

        <div className="available-rooms">
          <h3>Available Rooms</h3>
          {availableRooms.length === 0 ? (
            <div className="no-rooms">
              <p>No rooms available. Create a new room to get started!</p>
            </div>
          ) : (
            <div className="rooms-list">
              {availableRooms.map((room) => (
                <div key={room.roomId} className="room-item">
                  <div className="room-info">
                    <h4>{room.roomName || room.roomId}</h4>
                    <p>Players: {room.players.length}/{room.maxPlayers}</p>
                    <p>Status: <span className={`status ${room.status.toLowerCase()}`}>{room.status}</span></p>
                  </div>
                  <div className="room-actions">
                    <button
                      onClick={() => handleJoinRoom(room.roomId)}
                      disabled={loading || !playerId.trim() || room.players.length >= room.maxPlayers || room.status !== 'WAITING'}
                      className="join-room-btn"
                    >
                      {loading ? 'Joining...' : 'Join Room'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>
    );
  };

  return (
    <div className="multiplayer-container">
      {renderGameContent()}
    </div>
  );
};

export default MultiPlayerLobby;
