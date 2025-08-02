package com.wordle.service;

import com.wordle.model.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MultiPlayerService {

  private final Map<String, MultiPlayerRoom> rooms = new ConcurrentHashMap<>();
  private final WordleService wordleService;

  public MultiPlayerService(WordleService wordleService) {
    this.wordleService = wordleService;
  }

  public MultiPlayerRoom createRoom(String creatorId, String roomName, int maxPlayers, String username) {
    String roomId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    MultiPlayerRoom room = new MultiPlayerRoom(roomId, roomName, creatorId, maxPlayers);

    Player creator = new Player(creatorId, username);
    room.getPlayers().add(creator);

    rooms.put(roomId, room);
    return room;
  }

  public MultiPlayerRoom joinRoom(String roomId, String playerId, String username) {
    MultiPlayerRoom room = rooms.get(roomId);
    if (room == null) {
      throw new IllegalArgumentException("Room not found");
    }

    if (room.isFull()) {
      throw new IllegalArgumentException("Room is full");
    }

    if (room.getStatus() != MultiPlayerRoom.RoomStatus.WAITING) {
      throw new IllegalArgumentException("Game already in progress");
    }

    // Check if player already in room
    boolean playerExists = room.getPlayers().stream()
            .anyMatch(p -> p.getPlayerId().equals(playerId));

    if (!playerExists) {
      Player player = new Player(playerId, username);
      room.getPlayers().add(player);

    }

    return room;
  }

  public void startGame(String roomId) {
    MultiPlayerRoom room = rooms.get(roomId);
    if (room == null || !room.canStart()) {
      throw new IllegalArgumentException("Cannot start game");
    }

    // Get random word
    List<String> wordList = wordleService.getWordList();
    String targetWord = wordList.get(new Random().nextInt(wordList.size()));
    System.out.println(String.format("targetWord is %s", targetWord));
    room.setCurrentWord(targetWord);
    room.setStatus(MultiPlayerRoom.RoomStatus.IN_PROGRESS);

    // Reset all players
    room.getPlayers().forEach(player -> {
      player.getGuesses().clear();
      player.getGuessResults().clear();
      player.setHasWon(false);
      player.setWinTime(null);
      player.setRank(0);
      player.setPoints(0);
    });

    // Broadcast game started (without revealing the word)
    Map<String, Object> gameData = new HashMap<>();
    gameData.put("type", "GAME_STARTED");
    gameData.put("room", sanitizeRoomForClient(room));
  }

  public void processGuess(String roomId, String playerId, String guess) {
    MultiPlayerRoom room = rooms.get(roomId);
    if (room == null) {
      throw new IllegalArgumentException("Room not found");
    }

    if (room.getStatus() != MultiPlayerRoom.RoomStatus.IN_PROGRESS) {
      throw new IllegalArgumentException("Game not in progress");
    }

    Player player = room.getPlayers().stream()
            .filter(p -> p.getPlayerId().equals(playerId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Player not found"));

    if (player.isFinished()) {
      throw new IllegalArgumentException("Player already finished");
    }

    // Validate guess
    guess = guess.toUpperCase().trim();
    if (guess.length() != 5 || !guess.matches("[A-Z]+")) {
      throw new IllegalArgumentException("Guess must be exactly 5 letters");
    }

    if (!wordleService.getWordList().contains(guess)) {
      throw new IllegalArgumentException("Invalid word");
    }

    // Process the guess
    List<GuessResult> result = evaluateGuess(room.getCurrentWord(), guess);
    player.getGuesses().add(guess);
    player.getGuessResults().add(result);

    // Check if player won
    boolean won = guess.equals(room.getCurrentWord());
    if (won) {
      player.setHasWon(true);
      player.setWinTime(LocalDateTime.now());

      // If this is the first winner
      if (room.getWinnerId() == null) {
        room.setWinnerId(playerId);
      }
    }

    // Check if game should end
    checkGameEnd(room);

    // Broadcast guess result
    Map<String, Object> guessData = new HashMap<>();
    guessData.put("type", "GUESS_RESULT");
    guessData.put("playerId", playerId);
    guessData.put("guess", guess);
    guessData.put("result", result);
    guessData.put("room", sanitizeRoomForClient(room));

  }

  private void checkGameEnd(MultiPlayerRoom room) {
    boolean hasWinner = room.getWinnerId() != null;
    boolean allFinished = room.getPlayers().stream().allMatch(Player::isFinished);

    if (hasWinner || allFinished) {
      room.setStatus(MultiPlayerRoom.RoomStatus.FINISHED);
      calculateRanks(room);

      Map<String, Object> endData = new HashMap<>();
      endData.put("type", "GAME_ENDED");
      endData.put("room", room); // Include full room with word revealed
      endData.put("targetWord", room.getCurrentWord());

    }
  }

  private void calculateRanks(MultiPlayerRoom room) {
    List<Player> finishedPlayers = room.getPlayers().stream()
            .filter(Player::isFinished)
            .sorted((a, b) -> {
              if (a.isHasWon() && !b.isHasWon()) return -1;
              if (!a.isHasWon() && b.isHasWon()) return 1;
              if (a.isHasWon() && b.isHasWon()) {
                return a.getWinTime().compareTo(b.getWinTime());
              }
              return Integer.compare(a.getCurrentRound(), b.getCurrentRound());
            })
            .toList();

    for (int i = 0; i < finishedPlayers.size(); i++) {
      Player player = finishedPlayers.get(i);
      player.setRank(i + 1);

      // Award points
      if (i == 0) player.setPoints(10);
      else if (i == 1) player.setPoints(7);
      else if (i == 2) player.setPoints(5);
      else player.setPoints(2);
    }
  }

  private List<GuessResult> evaluateGuess(String targetWord, String guess) {
    List<GuessResult> result = new ArrayList<>();
    char[] target = targetWord.toCharArray();
    char[] guessChars = guess.toCharArray();
    boolean[] targetUsed = new boolean[5];
    boolean[] guessUsed = new boolean[5];

    // First pass: exact matches
    for (int i = 0; i < 5; i++) {
      if (guessChars[i] == target[i]) {
        result.add(new GuessResult(guessChars[i], GuessResult.LetterStatus.HIT));
        targetUsed[i] = true;
        guessUsed[i] = true;
      } else {
        result.add(new GuessResult(guessChars[i], GuessResult.LetterStatus.MISS));
      }
    }

    // Second pass: present letters
    for (int i = 0; i < 5; i++) {
      if (!guessUsed[i]) {
        for (int j = 0; j < 5; j++) {
          if (!targetUsed[j] && guessChars[i] == target[j]) {
            result.set(i, new GuessResult(guessChars[i], GuessResult.LetterStatus.PRESENT));
            targetUsed[j] = true;
            break;
          }
        }
      }
    }
    return result;
  }

  private MultiPlayerRoom sanitizeRoomForClient(MultiPlayerRoom room) {
    MultiPlayerRoom sanitized = new MultiPlayerRoom();
    sanitized.setRoomId(room.getRoomId());
    sanitized.setRoomName(room.getRoomName());
    sanitized.setCreatorId(room.getCreatorId());
    sanitized.setPlayers(room.getPlayers());
    sanitized.setMaxPlayers(room.getMaxPlayers());
    sanitized.setStatus(room.getStatus());
    sanitized.setCreatedAt(room.getCreatedAt());
    sanitized.setWinnerId(room.getWinnerId());
    // Don't include currentWord
    return sanitized;
  }

  public MultiPlayerRoom getRoom(String roomId) {
    return rooms.get(roomId);
  }

  public List<MultiPlayerRoom> getAvailableRooms() {
    return rooms.values().stream()
            .filter(room -> room.getStatus() == MultiPlayerRoom.RoomStatus.WAITING && !room.isFull())
            .toList();
  }
}
