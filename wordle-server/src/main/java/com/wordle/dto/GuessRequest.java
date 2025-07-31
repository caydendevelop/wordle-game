package com.wordle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GuessRequest {

  @NotBlank(message = "Game ID cannot be blank")
  private String gameId;

  @NotBlank(message = "Guess cannot be blank")
  @Size(min = 5, max = 5, message = "Guess must be exactly 5 characters")
  private String guess;

  public GuessRequest() {}

  public GuessRequest(String gameId, String guess) {
    this.gameId = gameId;
    this.guess = guess;
  }

  // Getters and setters
  public String getGameId() { return gameId; }
  public void setGameId(String gameId) { this.gameId = gameId; }
  public String getGuess() { return guess; }
  public void setGuess(String guess) { this.guess = guess; }
}
