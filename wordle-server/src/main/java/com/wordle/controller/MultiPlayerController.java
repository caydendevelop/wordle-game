package com.wordle.controller;

import com.wordle.model.GuessResult;
import com.wordle.model.MultiPlayerRoom;
import com.wordle.model.Player;
import com.wordle.service.MultiPlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/multiplayer")
@CrossOrigin(origins = "http://localhost:3000")
public class MultiPlayerController {

  private final MultiPlayerService multiPlayerService;

  public MultiPlayerController(MultiPlayerService multiPlayerService) {
    this.multiPlayerService = multiPlayerService;
  }

  @PostMapping("/create-room")
  public ResponseEntity<MultiPlayerRoom> createRoom(@RequestBody Map<String, Object> request) {
    try {
      String creatorId = (String) request.get("creatorId");
      String roomName = (String) request.get("roomName");
      String username = (String) request.get("username");
      Integer maxPlayers = (Integer) request.get("maxPlayers");

      if (maxPlayers == null) maxPlayers = 4;

      MultiPlayerRoom room = multiPlayerService.createRoom(creatorId, roomName, maxPlayers, username);
      return ResponseEntity.ok(room);
    } catch (Exception e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @PostMapping("/join-room")
  public ResponseEntity<MultiPlayerRoom> joinRoom(@RequestBody Map<String, String> request) {
    try {
      String roomId = request.get("roomId");
      String playerId = request.get("playerId");
      String username = request.get("username");

      MultiPlayerRoom room = multiPlayerService.joinRoom(roomId, playerId, username);
      return ResponseEntity.ok(room);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @PostMapping("/start-game")
  public ResponseEntity<Void> startGame(@RequestBody Map<String, String> request) {
    try {
      String roomId = request.get("roomId");
      multiPlayerService.startGame(roomId);
      return ResponseEntity.ok().build();
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @MessageMapping("/guess/{roomId}")
  public void makeGuess(@DestinationVariable String roomId, Map<String, String> request) {
    try {
      String playerId = request.get("playerId");
      String guess = request.get("guess");
      multiPlayerService.processGuess(roomId, playerId, guess);
    } catch (Exception e) {
      // Error handling would send error message back to client
    }
  }

  @GetMapping("/room/{roomId}")
  public ResponseEntity<MultiPlayerRoom> getRoom(@PathVariable String roomId) {
    MultiPlayerRoom room = multiPlayerService.getRoom(roomId);
    if (room == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(room);
  }

  @GetMapping("/rooms")
  public ResponseEntity<List<MultiPlayerRoom>> getAvailableRooms() {
    return ResponseEntity.ok(multiPlayerService.getAvailableRooms());
  }

  // Add these endpoints to your MultiPlayerController class

  @GetMapping("/game-state/{roomId}/{playerId}")
  public ResponseEntity<?> getGameState(@PathVariable String roomId, @PathVariable String playerId) {
    try {
      MultiPlayerRoom room = multiPlayerService.getRoom(roomId);
      if (room == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "Room not found"));
      }

      Player player = room.getPlayers().stream()
              .filter(p -> p.getPlayerId().equals(playerId))
              .findFirst()
              .orElse(null);

      if (player == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "Player not found"));
      }

      Map<String, Object> gameState = new HashMap<>();
      gameState.put("guesses", player.getGuesses());
      gameState.put("guessResults", player.getGuessResults());
      gameState.put("finished", player.isFinished());
      gameState.put("won", player.isHasWon());
      gameState.put("rank", player.getRank());
      gameState.put("points", player.getPoints());

      // Only include target word if game is finished
      if (room.getStatus() == MultiPlayerRoom.RoomStatus.FINISHED) {
        gameState.put("targetWord", room.getCurrentWord());
      }

      return ResponseEntity.ok(gameState);
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/guess")
  public ResponseEntity<?> submitGuess(@RequestBody Map<String, String> request) {
    try {
      String roomId = request.get("roomId");
      String playerId = request.get("playerId");
      String guess = request.get("guess");

      MultiPlayerRoom room = multiPlayerService.getRoom(roomId);
      Player player = room.getPlayers().stream()
              .filter(p -> p.getPlayerId().equals(playerId))
              .findFirst()
              .orElse(null);

      multiPlayerService.processGuess(roomId, playerId, guess);

      Player updatedPlayer = room.getPlayers().stream()
              .filter(p -> p.getPlayerId().equals(playerId))
              .findFirst()
              .orElse(null);

      List<GuessResult> result = updatedPlayer.getGuessResults().get(updatedPlayer.getGuessResults().size() - 1);

      Map<String, Object> gameState = new HashMap<>();
      gameState.put("guesses", updatedPlayer.getGuesses());
      gameState.put("guessResults", updatedPlayer.getGuessResults());
      gameState.put("finished", updatedPlayer.isFinished());
      gameState.put("won", updatedPlayer.isHasWon());
      gameState.put("rank", updatedPlayer.getRank());
      gameState.put("points", updatedPlayer.getPoints());

      return ResponseEntity.ok(Map.of(
              "success", true,
              "result", result,
              "gameState", gameState
      ));

    } catch (IllegalArgumentException e) {
      return ResponseEntity.ok(Map.of(
              "success", false,
              "message", e.getMessage()
      ));
    } catch (Exception e) {
      return ResponseEntity.badRequest().body(Map.of(
              "success", false,
              "message", "Failed to process guess"
      ));
    }
  }


}
