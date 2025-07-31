package com.wordle.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GuessResult {
  private char letter;
  private LetterStatus status;

  public enum LetterStatus {
    @JsonProperty("HIT")
    HIT,     // Correct letter in correct position
    @JsonProperty("PRESENT")
    PRESENT, // Correct letter in wrong position
    @JsonProperty("MISS")
    MISS     // Letter not in word
  }

  public GuessResult() {}

  public GuessResult(char letter, LetterStatus status) {
    this.letter = letter;
    this.status = status;
  }

  // Getters and setters
  public char getLetter() { return letter; }
  public void setLetter(char letter) { this.letter = letter; }
  public LetterStatus getStatus() { return status; }
  public void setStatus(LetterStatus status) { this.status = status; }
}
