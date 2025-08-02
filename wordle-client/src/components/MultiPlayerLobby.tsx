import React, { useState, useEffect, useRef } from 'react';
import { WordleAPI } from '../services/api';

interface Room {
  roomId: string;
  roomName: string;
  creatorId: string;
  players: Player[];
  maxPlayers: number;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  winnerId?: string;
}

interface Player {
  playerId: string;
  username: string;
  guesses: string[];
  guessResults: any[][];
  hasWon: boolean;
  rank: number;
  points: number;
}

const MultiPlayerLobby: React.FC = () => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  
  // Fix 1: Persist player ID in localStorage to survive page refreshes
  const [playerId] = useState(() => {
    let id = localStorage.getItem('wordle-player-id');
    if (!id) {
      id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('wordle-player-id', id);
    }
    return id;
  });
  
  const [username, setUsername] = useState(() => {
    // Also persist username
    return localStorage.getItem('wordle-username') || '';
  });
  
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [roomIdToJoin, setRoomIdToJoin] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  
  // Fix 2: Add WebSocket polling as fallback for real-time updates
  const [roomPollingInterval, setRoomPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Component mounted, loading rooms...');
    loadAvailableRooms();
    
    // Save username to localStorage when it changes
    if (username) {
      localStorage.setItem('wordle-username', username);
    }
  }, [username]);

// Fix 3: Set up room polling when in a room but WebSocket isn't working
useEffect(() => {
  if (currentRoom && currentRoom.status === 'WAITING') {
    // Poll room status every 2 seconds to get real-time updates as fallback
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
    // Clear polling when not needed
    if (roomPollingInterval) {
      clearInterval(roomPollingInterval);
      setRoomPollingInterval(null);
    }
  }
}, [currentRoom]); // Remove roomPollingInterval from dependencies


  // Fix 4: Simulate WebSocket messages with HTTP polling for now
  const simulateWebSocketConnection = (roomId: string) => {
    console.log('Simulating WebSocket connection for room:', roomId);
    setWsConnected(true);
    
    // In a real implementation, you would connect to WebSocket here
    // For now, we're using the polling mechanism above
  };

  const loadAvailableRooms = async () => {
    try {
      console.log('Loading available rooms...');
      const rooms = await WordleAPI.getAvailableRooms();
      console.log('Loaded rooms:', rooms);
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const createRoom = async () => {
    if (!username.trim() || !roomName.trim()) {
      alert('Please enter your username and room name');
      return;
    }

    try {
      console.log('Creating room...');
      const room = await WordleAPI.createMultiPlayerRoom({
        creatorId: playerId,
        roomName: roomName.trim(),
        username: username.trim(),
        maxPlayers
      });
      console.log('Room created:', room);
      setCurrentRoom(room);
      simulateWebSocketConnection(room.roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }

    try {
      console.log('Joining room:', roomId);
      const room = await WordleAPI.joinMultiPlayerRoom({
        roomId,
        playerId,
        username: username.trim()
      });
      console.log('Joined room:', room);
      setCurrentRoom(room);
      simulateWebSocketConnection(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please try again.');
    }
  };

  const startGame = async () => {
    if (!currentRoom) return;

    try {
      console.log('Starting game for room:', currentRoom.roomId);
      await WordleAPI.startMultiPlayerGame(currentRoom.roomId);
      console.log('Game start request sent');
      
      // Manually refresh room state after starting game
      setTimeout(async () => {
        try {
          const updatedRoom = await WordleAPI.getMultiPlayerRoom(currentRoom.roomId);
          setCurrentRoom(updatedRoom);
        } catch (error) {
          console.error('Failed to get updated room after game start:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const leaveRoom = () => {
    // Clear polling interval
    if (roomPollingInterval) {
      clearInterval(roomPollingInterval);
      setRoomPollingInterval(null);
    }
    
    setWsConnected(false);
    setCurrentRoom(null);
    
    // Refresh available rooms
    loadAvailableRooms();
  };

  // Fix 5: Add manual refresh button for immediate updates
  const refreshRoom = async () => {
    if (!currentRoom) return;
    
    try {
      console.log('Manually refreshing room...');
      const updatedRoom = await WordleAPI.getMultiPlayerRoom(currentRoom.roomId);
      setCurrentRoom(updatedRoom);
      console.log('Room refreshed:', updatedRoom);
    } catch (error) {
      console.error('Failed to refresh room:', error);
    }
  };

  // Show simple game interface when game is in progress
  if (currentRoom && (currentRoom.status === 'IN_PROGRESS' || currentRoom.status === 'FINISHED')) {
    return (
      <div className="multiplayer-lobby">
        <h2>🎮 Game: {currentRoom.roomName}</h2>
        <p>Status: <strong>{currentRoom.status}</strong></p>
        <p>Player ID: <code>{playerId}</code></p>
        <p>Updates: <strong>{wsConnected ? '🟢 Live (Polling)' : '🔴 Manual'}</strong></p>
        
        <button onClick={refreshRoom} className="refresh-btn">
          🔄 Refresh Game
        </button>
        
        <div className="players-section">
          <h3>Players in Game</h3>
          {currentRoom.players.map(player => (
            <div key={player.playerId} className={`player-card ${player.playerId === playerId ? 'current-player' : ''}`}>
              <h4>
                {player.username} 
                {player.hasWon && <span className="winner-badge">🏆</span>}
                {player.playerId === playerId && <span className="you-badge">(You)</span>}
              </h4>
              <p>Guesses: {player.guesses.length}/6</p>
            </div>
          ))}
        </div>

        <button onClick={leaveRoom} className="leave-room-btn">
          Leave Game
        </button>
        
        <p><strong>🎯 Game interface would be fully interactive here</strong></p>
      </div>
    );
  }

  // Show room waiting lobby
  if (currentRoom) {
    return (
      <div className="multiplayer-lobby">
        <h2>🏠 Room: {currentRoom.roomName}</h2>
        <p>Room ID: <strong>{currentRoom.roomId}</strong></p>
        <p>Status: {currentRoom.status}</p>
        <p>Player ID: <code>{playerId}</code></p>
        <p>Updates: <strong>{wsConnected ? '🟢 Live (Polling every 2s)' : '🔴 Manual'}</strong></p>
        <p>Players ({currentRoom.players.length}/{currentRoom.maxPlayers})</p>
        
        <button onClick={refreshRoom} className="refresh-btn">
          🔄 Refresh Room
        </button>
        
        <div className="participants-list">
          {currentRoom.players.map(player => (
            <div key={player.playerId} className="participant">
              <span>{player.username}</span>
              {player.playerId === currentRoom.creatorId && <span className="creator-badge">Host</span>}
              {player.playerId === playerId && <span className="you-badge">(You)</span>}
            </div>
          ))}
        </div>

        {currentRoom.creatorId === playerId && (
          <button 
            onClick={startGame}
            disabled={currentRoom.players.length < 2}
            className="start-game-btn"
          >
            Start Game ({currentRoom.players.length}/2+ players)
          </button>
        )}

        <button onClick={leaveRoom} className="leave-room-btn">
          Leave Room
        </button>
        
        <div className="debug-info">
          <h4>Debug Info:</h4>
          <p>Your Player ID: <code>{playerId}</code></p>
          <p>Room Creator: <code>{currentRoom.creatorId}</code></p>
          <p>You are {playerId === currentRoom.creatorId ? 'the HOST' : 'a PARTICIPANT'}</p>
        </div>
      </div>
    );
  }

  // Main lobby interface
  return (
    <div className="multiplayer-lobby">
      <h2>🎯 Multi-player Wordle</h2>
      <p>Your Player ID: <code>{playerId}</code></p>
      
      <div className="user-setup">
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="username-input"
        />
        {username && <p>✅ Username saved: <strong>{username}</strong></p>}
      </div>

      <div className="create-room-section">
        <h3>Create New Room</h3>
        <input
          type="text"
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="room-name-input"
        />
        <select 
          value={maxPlayers} 
          onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
          className="max-players-select"
        >
          <option value={2}>2 Players</option>
          <option value={3}>3 Players</option>
          <option value={4}>4 Players</option>
          <option value={6}>6 Players</option>
          <option value={8}>8 Players</option>
        </select>
        <button onClick={createRoom} className="create-room-btn">
          Create Room
        </button>
      </div>

      <div className="join-by-id-section">
        <h3>Join by Room ID</h3>
        <input
          type="text"
          placeholder="Enter room ID"
          value={roomIdToJoin}
          onChange={(e) => setRoomIdToJoin(e.target.value.toUpperCase())}
          className="room-id-input"
        />
        <button 
          onClick={() => joinRoom(roomIdToJoin)}
          disabled={!roomIdToJoin.trim()}
          className="join-room-btn"
        >
          Join Room
        </button>
      </div>

      <div className="available-rooms-section">
        <h3>Available Rooms</h3>
        <button onClick={loadAvailableRooms} className="refresh-btn">
          🔄 Refresh
        </button>
        
        <div className="rooms-list">
          {availableRooms.length === 0 ? (
            <p>No rooms available</p>
          ) : (
            availableRooms.map(room => (
              <div key={room.roomId} className="room-card">
                <h4>{room.roomName}</h4>
                <p>ID: {room.roomId}</p>
                <p>{room.players.length}/{room.maxPlayers} players</p>
                <button 
                  onClick={() => joinRoom(room.roomId)}
                  className="join-room-btn"
                >
                  Join Room
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiPlayerLobby;
