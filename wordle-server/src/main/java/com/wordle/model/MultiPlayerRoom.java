package com.wordle.model;

import java.time.LocalDateTime;
import java.util.*;

public class MultiPlayerRoom {
  private String roomId;
  private String roomName;
  private String creatorId;
  private List<Player> players;
  private int maxPlayers;
  private RoomStatus status;
  private String currentWord;
  private LocalDateTime createdAt;
  private String winnerId;

  public enum RoomStatus {
    WAITING, IN_PROGRESS, FINISHED
  }

  public MultiPlayerRoom() {}

  public MultiPlayerRoom(String roomId, String roomName, String creatorId, int maxPlayers) {
    this.roomId = roomId;
    this.roomName = roomName;
    this.creatorId = creatorId;
    this.maxPlayers = maxPlayers;
    this.players = new ArrayList<>();
    this.status = RoomStatus.WAITING;
    this.createdAt = LocalDateTime.now();
  }

  // Getters and setters
  public String getRoomId() { return roomId; }
  public void setRoomId(String roomId) { this.roomId = roomId; }

  public String getRoomName() { return roomName; }
  public void setRoomName(String roomName) { this.roomName = roomName; }

  public String getCreatorId() { return creatorId; }
  public void setCreatorId(String creatorId) { this.creatorId = creatorId; }

  public List<Player> getPlayers() { return players; }
  public void setPlayers(List<Player> players) { this.players = players; }

  public int getMaxPlayers() { return maxPlayers; }
  public void setMaxPlayers(int maxPlayers) { this.maxPlayers = maxPlayers; }

  public RoomStatus getStatus() { return status; }
  public void setStatus(RoomStatus status) { this.status = status; }

  public String getCurrentWord() { return currentWord; }
  public void setCurrentWord(String currentWord) { this.currentWord = currentWord; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public String getWinnerId() { return winnerId; }
  public void setWinnerId(String winnerId) { this.winnerId = winnerId; }

  public boolean isFull() {
    return players.size() >= maxPlayers;
  }

  public boolean canStart() {
    return players.size() >= 2 && status == RoomStatus.WAITING;
  }
}
