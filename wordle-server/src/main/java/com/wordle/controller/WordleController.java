package com.wordle.controller;

import com.wordle.dto.GuessRequest;
import com.wordle.dto.GameResponse;
import com.wordle.dto.ErrorResponse;
import com.wordle.model.GameState;
import com.wordle.service.WordleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/wordle")
@CrossOrigin(origins = {"http://localhost:3000"}, allowCredentials = "true")
public class WordleController {

  private final WordleService wordleService;

  @Autowired
  public WordleController(WordleService wordleService) {
    this.wordleService = wordleService;
  }

  @PostMapping("/new-game")
  public ResponseEntity<GameResponse> createNewGame(@RequestParam(defaultValue = "6") int maxRounds) {
    try {
      String gameId = wordleService.createNewGame(maxRounds);
      GameState gameState = wordleService.getGame(gameId);
      return ResponseEntity.ok(new GameResponse(gameState));
    } catch (Exception e) {
      System.out.println("ERROR: Failed to create new game - " + e.getMessage());
      return ResponseEntity.internalServerError().build();
    }
  }

  @PostMapping("/guess")
  public ResponseEntity<?> makeGuess(@Valid @RequestBody GuessRequest request) {
    try {
      System.out.println("=== DEBUG: Making guess ===");
      System.out.println("Game ID: " + request.getGameId());
      System.out.println("Guess: " + request.getGuess());

      GameState gameState = wordleService.makeGuess(request.getGameId(), request.getGuess());

      if (gameState == null) {
        System.out.println("ERROR: Game state is null - game not found or already over");
        ErrorResponse errorResponse = new ErrorResponse(
                "GAME_NOT_FOUND",
                "Game not found or already finished",
                404
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
      }

      System.out.println("SUCCESS: Guess processed successfully");
      return ResponseEntity.ok(new GameResponse(gameState));

    } catch (IllegalArgumentException e) {
      System.out.println("ERROR: Invalid guess - " + e.getMessage());

      // Determine the specific type of validation error
      String errorType;
      String errorMessage = e.getMessage();

      if (errorMessage.contains("Invalid word")) {
        errorType = "WORD_NOT_FOUND";
        errorMessage = "The word '" + request.getGuess() + "' is not in our dictionary. Please try another word.";
      } else if (errorMessage.contains("5 letters")) {
        errorType = "INVALID_LENGTH";
        errorMessage = "Your guess must be exactly 5 letters long.";
      } else {
        errorType = "INVALID_FORMAT";
        errorMessage = "Your guess must contain only letters.";
      }

      ErrorResponse errorResponse = new ErrorResponse(errorType, errorMessage, 422);
      return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(errorResponse);

    } catch (Exception e) {
      System.out.println("ERROR: Unexpected error - " + e.getMessage());
      e.printStackTrace();
      ErrorResponse errorResponse = new ErrorResponse(
              "INTERNAL_ERROR",
              "An unexpected error occurred. Please try again.",
              500
      );
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
  }

  @GetMapping("/game/{gameId}")
  public ResponseEntity<GameResponse> getGame(@PathVariable String gameId) {
    GameState gameState = wordleService.getGame(gameId);
    if (gameState == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(new GameResponse(gameState));
  }

  @DeleteMapping("/game/{gameId}")
  public ResponseEntity<Void> deleteGame(@PathVariable String gameId) {
    wordleService.deleteGame(gameId);
    return ResponseEntity.ok().build();
  }
}
