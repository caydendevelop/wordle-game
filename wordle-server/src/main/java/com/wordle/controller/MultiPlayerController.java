package com.wordle.controller;

import com.wordle.model.MultiPlayerRoom;
import com.wordle.service.MultiPlayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

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
}
