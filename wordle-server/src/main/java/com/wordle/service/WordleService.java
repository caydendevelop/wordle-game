package com.wordle.service;

import com.wordle.model.GameState;
import com.wordle.model.GuessResult;
import com.wordle.model.GuessResult.LetterStatus;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class WordleService {

  private final Map<String, GameState> games = new ConcurrentHashMap<>();
  private List<String> wordList;
  private final Random random = new Random();
  private static final int DEFAULT_MAX_ROUNDS = 6;

  private final ResourceLoader resourceLoader;

  public WordleService(ResourceLoader resourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  @PostConstruct
  public void init() throws Exception {
    // load wordlist.txt from classpath
    Resource r = resourceLoader.getResource("classpath:wordlist.txt");
    try (BufferedReader br = new BufferedReader(
            new InputStreamReader(r.getInputStream(), StandardCharsets.UTF_8))) {
      wordList = br.lines()
              .map(String::trim)
              .filter(line -> line.length() == 5)
              .map(String::toUpperCase)
              .collect(Collectors.toUnmodifiableList());
    }

    if (wordList.isEmpty()) {
      throw new IllegalStateException("wordlist.txt is empty or not found");
    }
  }

  public String createNewGame(int maxRounds) {
    String gameId = UUID.randomUUID().toString();
    String targetWord = wordList.get(random.nextInt(wordList.size()));
    GameState gameState = new GameState(gameId, targetWord,
            maxRounds > 0 ? maxRounds : DEFAULT_MAX_ROUNDS);
    games.put(gameId, gameState);
    return gameId;
  }

  public GameState getGame(String gameId) {
    return games.get(gameId);
  }

  public GameState makeGuess(String gameId, String guess) {
    System.out.println("=== SERVICE DEBUG ===");
    System.out.println("Looking for game with ID: " + gameId);
    System.out.println("Available games: " + games.keySet());

    GameState gameState = games.get(gameId);
    if (gameState == null) {
      System.out.println("ERROR: Game not found with ID: " + gameId);
      return null;
    }

    if (gameState.isGameOver()) {
      System.out.println("ERROR: Game is already over");
      return null;
    }

    System.out.println("Game found, processing guess: " + guess);

    // Validate guess
    guess = guess.toUpperCase().trim();
    if (guess.length() != 5 || !guess.matches("[A-Z]+")) {
      System.out.println("ERROR: Invalid guess format");
      throw new IllegalArgumentException("Guess must be exactly 5 letters");
    }

    if (!wordList.contains(guess)) {
      System.out.println("ERROR: Word not in dictionary");
      throw new IllegalArgumentException("Invalid word");
    }

    // Process the guess
    List<GuessResult> result = processGuess(gameState.getTargetWord(), guess);
    gameState.getGuesses().add(result);
    gameState.setCurrentRound(gameState.getCurrentRound() + 1);

    // Check win condition
    if (guess.equals(gameState.getTargetWord())) {
      gameState.setWon(true);
      gameState.setGameOver(true);
      System.out.println("Player won!");
    } else if (gameState.getCurrentRound() >= gameState.getMaxRounds()) {
      gameState.setGameOver(true);
      System.out.println("Game over - max rounds reached");
    }

    System.out.println("Guess processed successfully");
    return gameState;
  }


  private List<GuessResult> processGuess(String targetWord, String guess) {
    List<GuessResult> result = new ArrayList<>();
    char[] target = targetWord.toCharArray();
    char[] guessChars = guess.toCharArray();
    boolean[] targetUsed = new boolean[5];
    boolean[] guessUsed = new boolean[5];

    // First pass: find exact matches (HIT)
    for (int i = 0; i < 5; i++) {
      if (guessChars[i] == target[i]) {
        result.add(new GuessResult(guessChars[i], LetterStatus.HIT));
        targetUsed[i] = true;
        guessUsed[i] = true;
      } else {
        result.add(new GuessResult(guessChars[i], LetterStatus.MISS)); // Placeholder
      }
    }

    // Second pass: find present letters (PRESENT)
    for (int i = 0; i < 5; i++) {
      if (!guessUsed[i]) {
        for (int j = 0; j < 5; j++) {
          if (!targetUsed[j] && guessChars[i] == target[j]) {
            result.set(i, new GuessResult(guessChars[i], LetterStatus.PRESENT));
            targetUsed[j] = true;
            break;
          }
        }
      }
    }

    return result;
  }

  public List<String> getWordList() {
    return new ArrayList<>(wordList);
  }

  public void deleteGame(String gameId) {
    games.remove(gameId);
  }
}
