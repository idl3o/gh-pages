/**
 * Blockchain Miner Game
 * A simple game that simulates mining blockchain tokens
 */

document.addEventListener('DOMContentLoaded', function() {
  // Game elements
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const startButton = document.getElementById('start-game');
  const pauseButton = document.getElementById('pause-game');
  const gameOverlay = document.getElementById('game-overlay');
  const playAgainButton = document.getElementById('play-again');
  const scoreElement = document.getElementById('score');
  const blocksElement = document.getElementById('blocks');
  const levelElement = document.getElementById('level');
  const finalScoreElement = document.getElementById('final-score');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');

  // Game state
  let gameRunning = false;
  let gamePaused = false;
  let score = 0;
  let blocks = 0;
  let level = 1;
  let tokensToNextBlock = 10;
  let animationFrame;
  let lastFrameTime = 0;
  
  // Game objects
  let miner = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    speed: 5,
    speedBoost: 1,
    moving: {
      left: false,
      right: false,
      up: false,
      down: false
    }
  };
  
  let tokens = [];
  let obstacles = [];
  let powerups = [];
  let effects = [];
  
  // Token types
  const tokenTypes = {
    standard: {
      color: '#00d8ff', // Blue
      value: 1,
      radius: 8,
      speed: 2
    },
    premium: {
      color: '#6e45e2', // Purple
      value: 5,
      radius: 10,
      speed: 3
    },
    rare: {
      color: '#FFD700', // Gold
      value: 25,
      radius: 12,
      speed: 4
    }
  };
  
  // Obstacle types
  const obstacleTypes = {
    error: {
      color: '#FF4444',
      width: 40,
      height: 10,
      speed: 3,
      damage: 15
    },
    security: {
      color: '#FF0000',
      width: 20,
      height: 20,
      speed: 4,
      damage: 25
    }
  };
  
  // Game initialization
  function init() {
    // Reset game state
    score = 0;
    blocks = 0;
    level = 1;
    tokensToNextBlock = 10;
    
    scoreElement.textContent = score;
    blocksElement.textContent = blocks;
    levelElement.textContent = level;
    
    gameOverlay.classList.add('hidden');
    pauseButton.classList.remove('hidden');
    startButton.classList.add('hidden');
    
    // Reset miner position
    miner.x = canvas.width / 2 - 15;
    miner.y = canvas.height - 50;
    
    // Clear all arrays
    tokens = [];
    obstacles = [];
    powerups = [];
    effects = [];
    
    // Set game running
    gameRunning = true;
    gamePaused = false;
    
    // Start game loop
    lastFrameTime = performance.now();
    gameLoop();
    
    // Start spawning game objects
    startSpawning();
  }
  
  function startSpawning() {
    // Set intervals for spawning different game objects
    window.tokenInterval = setInterval(spawnToken, 1000);
    window.obstacleInterval = setInterval(spawnObstacle, 2000);
    window.powerupInterval = setInterval(spawnPowerup, 7000);
    window.difficultyInterval = setInterval(increaseDifficulty, 20000);
  }
  
  function stopSpawning() {
    clearInterval(window.tokenInterval);
    clearInterval(window.obstacleInterval);
    clearInterval(window.powerupInterval);
    clearInterval(window.difficultyInterval);
  }
  
  // Game loop
  function gameLoop(timestamp) {
    if (!gameRunning || gamePaused) return;
    
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game objects
    updateMiner();
    updateTokens(deltaTime);
    updateObstacles(deltaTime);
    updatePowerups(deltaTime);
    updateEffects(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Render game objects
    drawMiner();
    drawTokens();
    drawObstacles();
    drawPowerups();
    drawEffects();
    
    // Progress bar for next block
    drawBlockProgress();
    
    // Continue game loop
    animationFrame = requestAnimationFrame(gameLoop);
  }
  
  // Game object updates
  function updateMiner() {
    // Move miner based on input
    let movementSpeed = miner.speed * miner.speedBoost;
    
    if (miner.moving.left && miner.x > 0) {
      miner.x -= movementSpeed;
    }
    if (miner.moving.right && miner.x < canvas.width - miner.width) {
      miner.x += movementSpeed;
    }
    if (miner.moving.up && miner.y > 0) {
      miner.y -= movementSpeed;
    }
    if (miner.moving.down && miner.y < canvas.height - miner.height) {
      miner.y += movementSpeed;
    }
  }
  
  function updateTokens(deltaTime) {
    for (let i = tokens.length - 1; i >= 0; i--) {
      tokens[i].y += tokens[i].speed * (deltaTime / 16);
      
      // Remove tokens that are out of bounds
      if (tokens[i].y > canvas.height + tokens[i].radius) {
        tokens.splice(i, 1);
      }
    }
  }
  
  function updateObstacles(deltaTime) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].y += obstacles[i].speed * (deltaTime / 16);
      
      // Remove obstacles that are out of bounds
      if (obstacles[i].y > canvas.height + obstacles[i].height) {
        obstacles.splice(i, 1);
      }
    }
  }
  
  function updatePowerups(deltaTime) {
    for (let i = powerups.length - 1; i >= 0; i--) {
      powerups[i].y += powerups[i].speed * (deltaTime / 16);
      
      // Remove powerups that are out of bounds
      if (powerups[i].y > canvas.height + powerups[i].radius) {
        powerups.splice(i, 1);
      }
    }
  }
  
  function updateEffects(deltaTime) {
    for (let i = effects.length - 1; i >= 0; i--) {
      effects[i].time -= deltaTime;
      
      // Remove effects that have expired
      if (effects[i].time <= 0) {
        // Reset any effect modifications
        if (effects[i].type === 'speedBoost') {
          miner.speedBoost = 1;
        }
        
        effects.splice(i, 1);
      }
    }
  }
  
  // Collision detection
  function checkCollisions() {
    // Check token collisions
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (isColliding(miner, tokens[i], true)) {
        // Add score
        addScore(tokens[i].value);
        
        // Add token collection effect
        addScoreEffect(tokens[i].x, tokens[i].y, tokens[i].value);
        
        // Remove collected token
        tokens.splice(i, 1);
      }
    }
    
    // Check obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (isColliding(miner, obstacles[i])) {
        // Deduct score
        addScore(-obstacles[i].damage);
        
        // Add damage effect
        addDamageEffect(obstacles[i].x, obstacles[i].y, obstacles[i].damage);
        
        // Remove collided obstacle
        obstacles.splice(i, 1);
        
        // Check game over
        if (score < 0) {
          gameOver();
        }
      }
    }
    
    // Check powerup collisions
    for (let i = powerups.length - 1; i >= 0; i--) {
      if (isColliding(miner, powerups[i], true)) {
        // Apply powerup effect
        applyPowerup(powerups[i].type);
        
        // Remove collected powerup
        powerups.splice(i, 1);
      }
    }
  }
  
  function isColliding(rect, obj, isCircle = false) {
    if (isCircle) {
      // Circle collision
      const dx = Math.abs((obj.x) - (rect.x + rect.width/2));
      const dy = Math.abs((obj.y) - (rect.y + rect.height/2));
      
      if (dx > rect.width/2 + obj.radius) { return false; }
      if (dy > rect.height/2 + obj.radius) { return false; }
      
      if (dx <= rect.width/2) { return true; }
      if (dy <= rect.height/2) { return true; }
      
      const cornerDistanceSq = Math.pow(dx - rect.width/2, 2) + Math.pow(dy - rect.height/2, 2);
      return cornerDistanceSq <= Math.pow(obj.radius, 2);
    } else {
      // Rectangle collision
      return (
        rect.x < obj.x + obj.width &&
        rect.x + rect.width > obj.x &&
        rect.y < obj.y + obj.height &&
        rect.y + rect.height > obj.y
      );
    }
  }
  
  // Game object drawing
  function drawMiner() {
    ctx.fillStyle = '#00d8ff';
    ctx.fillRect(miner.x, miner.y, miner.width, miner.height);
    
    // Draw mining hardware
    ctx.fillStyle = '#6e45e2';
    ctx.fillRect(miner.x + 5, miner.y + 5, miner.width - 10, miner.height - 10);
    
    // Check for active effects and show visual indicator
    const hasSpeedBoost = effects.some(effect => effect.type === 'speedBoost');
    if (hasSpeedBoost) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(miner.x - 3, miner.y - 3, miner.width + 6, miner.height + 6);
    }
  }
  
  function drawTokens() {
    tokens.forEach(token => {
      ctx.beginPath();
      ctx.arc(token.x, token.y, token.radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color;
      ctx.fill();
      ctx.closePath();
      
      // Draw blockchain symbol
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(token.x - token.radius/2, token.y);
      ctx.lineTo(token.x + token.radius/2, token.y);
      ctx.stroke();
      ctx.closePath();
      
      ctx.beginPath();
      ctx.moveTo(token.x, token.y - token.radius/2);
      ctx.lineTo(token.x, token.y + token.radius/2);
      ctx.stroke();
      ctx.closePath();
    });
  }
  
  function drawObstacles() {
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Draw error symbol
      if (obstacle.type === 'error') {
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obstacle.x + 10, obstacle.y + 2);
        ctx.lineTo(obstacle.x + obstacle.width - 10, obstacle.y + obstacle.height - 2);
        ctx.stroke();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width - 10, obstacle.y + 2);
        ctx.lineTo(obstacle.x + 10, obstacle.y + obstacle.height - 2);
        ctx.stroke();
        ctx.closePath();
      } else {
        // Security breach symbol
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                obstacle.width/4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
      }
    });
  }
  
  function drawPowerups() {
    powerups.forEach(powerup => {
      ctx.beginPath();
      ctx.arc(powerup.x, powerup.y, powerup.radius, 0, Math.PI * 2);
      ctx.fillStyle = powerup.color;
      ctx.fill();
      ctx.closePath();
      
      // Draw powerup symbol
      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerup.symbol, powerup.x, powerup.y);
    });
  }
  
  function drawEffects() {
    // Draw floating score/damage text
    effects.forEach(effect => {
      if (effect.type === 'score' || effect.type === 'damage') {
        const opacity = effect.time / effect.initialTime;
        ctx.fillStyle = effect.type === 'score' 
          ? `rgba(0, 255, 0, ${opacity})` 
          : `rgba(255, 0, 0, ${opacity})`;
        
        ctx.font = `${effect.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(effect.text, effect.x, effect.y - (1 - opacity) * 30);
      }
    });
  }
  
  function drawBlockProgress() {
    // Draw block progress bar
    const barWidth = canvas.width - 40;
    const barHeight = 10;
    const x = 20;
    const y = 20;
    
    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Progress
    const progress = (10 - tokensToNextBlock) / 10;
    ctx.fillStyle = '#6e45e2';
    ctx.fillRect(x, y, barWidth * progress, barHeight);
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Mining block: ${Math.round(progress * 100)}%`, canvas.width / 2, y + barHeight + 15);
  }
  
  // Game object spawning
  function spawnToken() {
    if (!gameRunning || gamePaused) return;
    
    // Determine token type based on probability
    let type;
    const rand = Math.random();
    
    if (rand < 0.1) {
      type = 'rare';
    } else if (rand < 0.3) {
      type = 'premium';
    } else {
      type = 'standard';
    }
    
    const tokenType = tokenTypes[type];
    
    tokens.push({
      x: Math.random() * (canvas.width - tokenType.radius * 2) + tokenType.radius,
      y: -tokenType.radius,
      radius: tokenType.radius,
      speed: tokenType.speed * (1 + level * 0.1),
      color: tokenType.color,
      value: tokenType.value
    });
  }
  
  function spawnObstacle() {
    if (!gameRunning || gamePaused || level < 2) return;
    
    // Determine obstacle type based on probability
    const type = Math.random() < 0.7 ? 'error' : 'security';
    const obstacleType = obstacleTypes[type];
    
    obstacles.push({
      x: Math.random() * (canvas.width - obstacleType.width),
      y: -obstacleType.height,
      width: obstacleType.width,
      height: obstacleType.height,
      speed: obstacleType.speed * (1 + level * 0.05),
      color: obstacleType.color,
      damage: obstacleType.damage,
      type: type
    });
  }
  
  function spawnPowerup() {
    if (!gameRunning || gamePaused || level < 3) return;
    
    // Powerup types
    const powerupTypes = [
      {
        type: 'speedBoost',
        color: '#FFD700',
        radius: 15,
        speed: 2,
        symbol: 'S',
        duration: 5000
      },
      {
        type: 'tokenMultiplier',
        color: '#9370DB',
        radius: 15,
        speed: 2,
        symbol: 'M',
        duration: 8000
      },
      {
        type: 'blockProgress',
        color: '#32CD32',
        radius: 15,
        speed: 2,
        symbol: 'B',
        duration: 0
      }
    ];
    
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    
    powerups.push({
      x: Math.random() * (canvas.width - randomType.radius * 2) + randomType.radius,
      y: -randomType.radius,
      radius: randomType.radius,
      speed: randomType.speed,
      color: randomType.color,
      symbol: randomType.symbol,
      type: randomType.type,
      duration: randomType.duration
    });
  }
  
  // Game mechanics
  function addScore(value) {
    // Check for token multiplier effect
    const hasMultiplier = effects.some(effect => effect.type === 'tokenMultiplier');
    const multiplier = hasMultiplier ? 2 : 1;
    
    score += value * multiplier;
    if (score < 0) score = 0;
    
    scoreElement.textContent = score;
    
    // Check if score is positive and token adds to block progress
    if (value > 0) {
      tokensToNextBlock--;
      if (tokensToNextBlock <= 0) {
        completeBlock();
      }
    }
  }
  
  function completeBlock() {
    blocks++;
    blocksElement.textContent = blocks;
    
    // Reset tokens needed for next block, increasing with level
    tokensToNextBlock = 10 + (level * 2);
    
    // Add bonus score for completing a block
    const blockBonus = 50 * level;
    addScore(blockBonus);
    
    // Display block completion message
    addBlockCompletionEffect(blockBonus);
    
    // Check for level up every 3 blocks
    if (blocks % 3 === 0) {
      levelUp();
    }
  }
  
  function levelUp() {
    level++;
    levelElement.textContent = level;
    
    // Display level up message
    const levelUpOverlay = document.createElement('div');
    levelUpOverlay.className = 'level-up-overlay';
    levelUpOverlay.innerHTML = `<h2>Level ${level}</h2><p>Difficulty increased!</p>`;
    document.querySelector('.game-container').appendChild(levelUpOverlay);
    
    // Remove overlay after animation
    setTimeout(() => {
      levelUpOverlay.remove();
    }, 2000);
    
    // Increase token spawn rate at higher levels
    if (level >= 3) {
      clearInterval(window.tokenInterval);
      window.tokenInterval = setInterval(spawnToken, 1000 - (level * 50));
    }
    
    // Increase obstacle spawn rate at higher levels
    if (level >= 4) {
      clearInterval(window.obstacleInterval);
      window.obstacleInterval = setInterval(spawnObstacle, 2000 - (level * 100));
    }
  }
  
  function increaseDifficulty() {
    if (!gameRunning || gamePaused) return;
    
    // Spawn more obstacles at once
    if (level >= 3) {
      for (let i = 0; i < Math.floor(level / 2); i++) {
        spawnObstacle();
      }
    }
    
    // Spawn more tokens at once to balance difficulty
    for (let i = 0; i < Math.min(level, 5); i++) {
      spawnToken();
    }
  }
  
  function applyPowerup(type) {
    switch (type) {
      case 'speedBoost':
        miner.speedBoost = 1.5;
        effects.push({
          type: 'speedBoost',
          time: 5000,
          initialTime: 5000
        });
        break;
        
      case 'tokenMultiplier':
        effects.push({
          type: 'tokenMultiplier',
          time: 8000,
          initialTime: 8000
        });
        break;
        
      case 'blockProgress':
        // Advance block progress by 30%
        tokensToNextBlock = Math.max(1, tokensToNextBlock - 3);
        break;
    }
  }
  
  // Visual effects
  function addScoreEffect(x, y, value) {
    effects.push({
      type: 'score',
      x: x,
      y: y,
      text: `+${value}`,
      size: value > 1 ? 16 : 14,
      time: 1000,
      initialTime: 1000
    });
  }
  
  function addDamageEffect(x, y, value) {
    effects.push({
      type: 'damage',
      x: x,
      y: y,
      text: `-${value}`,
      size: 16,
      time: 1000,
      initialTime: 1000
    });
  }
  
  function addBlockCompletionEffect(bonus) {
    // Flash the blocks counter
    blocksElement.parentElement.style.animation = 'pulse-highlight 1s';
    setTimeout(() => {
      blocksElement.parentElement.style.animation = '';
    }, 1000);
    
    // Show bonus message
    effects.push({
      type: 'score',
      x: canvas.width / 2,
      y: canvas.height / 2,
      text: `BLOCK MINED: +${bonus}`,
      size: 24,
      time: 2000,
      initialTime: 2000
    });
  }
  
  function gameOver() {
    gameRunning = false;
    stopSpawning();
    cancelAnimationFrame(animationFrame);
    
    finalScoreElement.textContent = score;
    overlayTitle.textContent = 'Game Over';
    overlayMessage.innerHTML = `You collected <span id="final-score">${score}</span> STREAM tokens!`;
    
    pauseButton.classList.add('hidden');
    gameOverlay.classList.remove('hidden');
    
    // Check if score is high enough for leaderboard
    updateLeaderboard(score);
  }
  
  // Leaderboard functions
  function updateLeaderboard(newScore) {
    // This would normally connect to a backend
    // For demo purposes, we'll use localStorage
    
    const leaderboard = getLeaderboard();
    
    // If score is high enough, ask for name
    if (newScore > 0 && (leaderboard.length < 10 || newScore > leaderboard[leaderboard.length - 1].score)) {
      const playerName = getRandomName();
      
      leaderboard.push({
        name: playerName,
        score: newScore
      });
      
      // Sort and limit to top 10
      leaderboard.sort((a, b) => b.score - a.score);
      if (leaderboard.length > 10) {
        leaderboard.pop();
      }
      
      // Save to localStorage
      localStorage.setItem('blockchain_game_leaderboard', JSON.stringify(leaderboard));
      
      // Display updated leaderboard
      displayLeaderboard();
    }
  }
  
  function getLeaderboard() {
    const saved = localStorage.getItem('blockchain_game_leaderboard');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default leaderboard
    return [
      { name: "CryptoMaster", score: 25420 },
      { name: "BlockchainWizard", score: 19876 },
      { name: "TokenCollector", score: 15230 },
      { name: "HashMiner", score: 12105 },
      { name: "SatoshiFan", score: 9870 }
    ];
  }
  
  function getRandomName() {
    const prefixes = ["Crypto", "Token", "Block", "Hash", "Node", "Miner", "Chain", "Ether", "Web3", "Degen"];
    const suffixes = ["Master", "Hunter", "Wizard", "King", "Queen", "Ninja", "Guru", "Pro", "Whale", "Collector"];
    
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${randomPrefix}${randomSuffix}`;
  }
  
  function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardEl = document.getElementById('leaderboard');
    
    // Clear existing entries
    leaderboardEl.innerHTML = '';
    
    // Add leaderboard entries
    leaderboard.forEach((entry, index) => {
      const leaderboardEntry = document.createElement('div');
      leaderboardEntry.className = 'leaderboard-entry';
      leaderboardEntry.innerHTML = `
        <span class="position">${index + 1}</span>
        <span class="name">${entry.name}</span>
        <span class="score">${entry.score.toLocaleString()}</span>
      `;
      leaderboardEl.appendChild(leaderboardEntry);
    });
  }
  
  // Input handling
  document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        miner.moving.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        miner.moving.right = true;
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        miner.moving.up = true;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        miner.moving.down = true;
        break;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        miner.moving.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        miner.moving.right = false;
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        miner.moving.up = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        miner.moving.down = false;
        break;
      case 'p':
      case 'P':
        togglePause();
        break;
    }
  });
  
  // Touch controls for mobile
  let touchStartX = 0;
  let touchStartY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning || gamePaused) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, false);
  
  canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    // Move miner directly to touch position, but keep within bounds
    miner.x = Math.max(0, Math.min(canvas.width - miner.width, touchX - canvas.getBoundingClientRect().left - miner.width / 2));
    miner.y = Math.max(0, Math.min(canvas.height - miner.height, touchY - canvas.getBoundingClientRect().top - miner.height / 2));
  }, { passive: false });
  
  // Game control functions
  function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
      pauseButton.textContent = 'Resume';
      cancelAnimationFrame(animationFrame);
      overlayTitle.textContent = 'Game Paused';
      overlayMessage.textContent = 'Press Resume to continue mining';
      gameOverlay.classList.remove('hidden');
    } else {
      pauseButton.textContent = 'Pause';
      lastFrameTime = performance.now();
      gameOverlay.classList.add('hidden');
      gameLoop(lastFrameTime);
    }
  }
  
  // Button Event Listeners
  startButton.addEventListener('click', init);
  pauseButton.addEventListener('click', togglePause);
  playAgainButton.addEventListener('click', init);
  
  // Initialize leaderboard on load
  displayLeaderboard();
});
