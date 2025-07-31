package com.wordle.dto;

public class ErrorResponse {
  private String error;
  private String message;
  private int code;

  public ErrorResponse() {}

  public ErrorResponse(String error, String message, int code) {
    this.error = error;
    this.message = message;
    this.code = code;
  }

  // Getters and setters
  public String getError() { return error; }
  public void setError(String error) { this.error = error; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public int getCode() { return code; }
  public void setCode(int code) { this.code = code; }
}
