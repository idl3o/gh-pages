- --
layout: default
title: Blockchain Miner Game
description: Play our blockchain-themed minigame while learning about crypto concepts
permalink: /game/
- --

# Blockchain Miner Game

<div class="game-container">
  <div class="game-ui">
    <div class="game-stats">
      <div class="stat">
        <span>STREAM Tokens:</span>
        <span id="score">0</span>
      </div>
      <div class="stat">
        <span>Blocks Mined:</span>
        <span id="blocks">0</span>
      </div>
      <div class="stat">
        <span>Difficulty:</span>
        <span id="level">1</span>
      </div>
    </div>
    
    <div class="game-controls">
      <button id="start-game" class="button primary">Start Mining</button>
      <button id="pause-game" class="button secondary hidden">Pause</button>
    </div>
  </div>
  
  <canvas id="game-canvas" width="800" height="500"></canvas>
  
  <div class="game-overlay hidden" id="game-overlay">
    <div class="overlay-content">
      <h2 id="overlay-title">Game Over</h2>
      <p id="overlay-message">You collected <span id="final-score">0</span> STREAM tokens!</p>
      <button id="play-again" class="button primary">Mine Again</button>
    </div>
  </div>
  
  <div class="game-instructions">
    <h3>How to Play</h3>
    <ul>
      <li><strong>Goal:</strong> Collect as many STREAM tokens as possible while avoiding obstacles</li>
      <li><strong>Controls:</strong> Use arrow keys or WASD to move your miner</li>
      <li><strong>Tokens:</strong> Blue tokens = 1 STREAM, Purple tokens = 5 STREAM, Gold tokens = 25 STREAM</li>
      <li><strong>Blocks:</strong> Collect a certain number of tokens to mine a block and advance the difficulty</li>
      <li><strong>Obstacles:</strong> Avoid red error blocks and security breaches</li>
    </ul>
    
    <h3>Crypto Concepts</h3>
    <p>This game simulates several blockchain concepts:</p>
    <ul>
      <li><strong>Mining:</strong> Collecting tokens represents solving computational puzzles</li>
      <li><strong>Block Rewards:</strong> Each completed block rewards you with bonus tokens</li>
      <li><strong>Difficulty Adjustment:</strong> As you progress, the game becomes more challenging, similar to increasing mining difficulty</li>
      <li><strong>Consensus Mechanisms:</strong> Special events require you to follow specific patterns to validate blocks</li>
    </ul>
  </div>
</div>

<div class="game-leaderboard">
  <h3>Top Miners</h3>
  <div class="leaderboard-container" id="leaderboard">
    <div class="leaderboard-entry">
      <span class="position">1</span>
      <span class="name">CryptoMaster</span>
      <span class="score">25,420</span>
    </div>
    <div class="leaderboard-entry">
      <span class="position">2</span>
      <span class="name">BlockchainWizard</span>
      <span class="score">19,876</span>
    </div>
    <div class="leaderboard-entry">
      <span class="position">3</span>
      <span class="name">TokenCollector</span>
      <span class="score">15,230</span>
    </div>
  </div>
</div>

<link rel="stylesheet" href="{{ '/assets/css/blockchain-game.css' | relative_url }}">
<script src="{{ '/assets/js/blockchain-game.js' | relative_url }}"></script>

