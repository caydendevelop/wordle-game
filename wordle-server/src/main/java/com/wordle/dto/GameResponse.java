// src/main/java/com/wordle/dto/GameResponse.java
package com.wordle.dto;

import com.wordle.model.GameState;
import com.wordle.model.GuessResult;
import java.util.List;

public class GameResponse {
  private String gameId;
  private List<List<GuessResult>> guesses;
  private int currentRound;
  private int maxRounds;
  private boolean gameOver;
  private boolean won;
  private String message;
  private String targetWord; // Only shown when game is over

  public GameResponse(GameState gameState) {
    this.gameId = gameState.getGameId();
    this.guesses = gameState.getGuesses();
    this.currentRound = gameState.getCurrentRound();
    this.maxRounds = gameState.getMaxRounds();
    this.gameOver = gameState.isGameOver();
    this.won = gameState.isWon();

    if (gameState.isGameOver()) {
      this.targetWord = gameState.getTargetWord();
      this.message = gameState.isWon() ? "Congratulations! You won!" : "Game over! Better luck next time.";
    }
  }

  // Getters and setters
  public String getGameId() { return gameId; }
  public void setGameId(String gameId) { this.gameId = gameId; }
  public List<List<GuessResult>> getGuesses() { return guesses; }
  public void setGuesses(List<List<GuessResult>> guesses) { this.guesses = guesses; }
  public int getCurrentRound() { return currentRound; }
  public void setCurrentRound(int currentRound) { this.currentRound = currentRound; }
  public int getMaxRounds() { return maxRounds; }
  public void setMaxRounds(int maxRounds) { this.maxRounds = maxRounds; }
  public boolean isGameOver() { return gameOver; }
  public void setGameOver(boolean gameOver) { this.gameOver = gameOver; }
  public boolean isWon() { return won; }
  public void setWon(boolean won) { this.won = won; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public String getTargetWord() { return targetWord; }
  public void setTargetWord(String targetWord) { this.targetWord = targetWord; }
}
