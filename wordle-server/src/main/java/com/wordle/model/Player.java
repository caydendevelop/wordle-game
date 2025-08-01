package com.wordle.model;

import java.time.LocalDateTime;
import java.util.*;

public class Player {
  private String playerId;
  private String username;
  private List<String> guesses;
  private List<List<GuessResult>> guessResults;
  private boolean hasWon;
  private LocalDateTime winTime;
  private int rank;
  private int points;

  public Player() {}

  public Player(String playerId, String username) {
    this.playerId = playerId;
    this.username = username;
    this.guesses = new ArrayList<>();
    this.guessResults = new ArrayList<>();
    this.hasWon = false;
    this.rank = 0;
    this.points = 0;
  }

  // Getters and setters
  public String getPlayerId() { return playerId; }
  public void setPlayerId(String playerId) { this.playerId = playerId; }

  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }

  public List<String> getGuesses() { return guesses; }
  public void setGuesses(List<String> guesses) { this.guesses = guesses; }

  public List<List<GuessResult>> getGuessResults() { return guessResults; }
  public void setGuessResults(List<List<GuessResult>> guessResults) { this.guessResults = guessResults; }

  public boolean isHasWon() { return hasWon; }
  public void setHasWon(boolean hasWon) { this.hasWon = hasWon; }

  public LocalDateTime getWinTime() { return winTime; }
  public void setWinTime(LocalDateTime winTime) { this.winTime = winTime; }

  public int getRank() { return rank; }
  public void setRank(int rank) { this.rank = rank; }

  public int getPoints() { return points; }
  public void setPoints(int points) { this.points = points; }

  public int getCurrentRound() {
    return guesses.size();
  }

  public boolean isFinished() {
    return hasWon || getCurrentRound() >= 6;
  }
}
