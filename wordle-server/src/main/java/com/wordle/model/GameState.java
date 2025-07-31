// src/main/java/com/wordle/model/GameState.java
package com.wordle.model;

import java.util.List;
import java.util.ArrayList;

public class GameState {
  private String gameId;
  private String targetWord;
  private List<List<GuessResult>> guesses;
  private int currentRound;
  private int maxRounds;
  private boolean gameOver;
  private boolean won;

  public GameState(String gameId, String targetWord, int maxRounds) {
    this.gameId = gameId;
    this.targetWord = targetWord.toUpperCase();
    this.maxRounds = maxRounds;
    this.guesses = new ArrayList<>();
    this.currentRound = 0;
    this.gameOver = false;
    this.won = false;
  }

  // Getters and setters
  public String getGameId() { return gameId; }
  public void setGameId(String gameId) { this.gameId = gameId; }
  public String getTargetWord() { return targetWord; }
  public void setTargetWord(String targetWord) { this.targetWord = targetWord; }
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
}
