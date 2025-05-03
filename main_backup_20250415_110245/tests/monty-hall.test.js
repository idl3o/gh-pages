/**
 * Tests for the Monty Hall problem simulation
 */

describe('Monty Hall Problem', () => {
  // Mock game state
  let gameState;

  beforeEach(() => {
    // Setup fresh game state before each test
    gameState = {
      carPosition: null,
      selectedDoor: null,
      revealedDoor: null,
      gamePhase: 'selection',
      stats: {
        stickWins: 0,
        stickLosses: 0,
        switchWins: 0,
        switchLosses: 0
      }
    };
  });

  test('car should be placed at a valid door position', () => {
    // Mock function to place car
    const placeCar = () => {
      gameState.carPosition = Math.floor(Math.random() * 3) + 1;
      return gameState.carPosition;
    };

    const position = placeCar();
    expect(position).toBeGreaterThanOrEqual(1);
    expect(position).toBeLessThanOrEqual(3);
  });

  test('revealed door should be neither car nor selected door', () => {
    // Setup
    gameState.carPosition = 1;
    gameState.selectedDoor = 2;

    // Mock function to reveal a goat door
    const revealGoatDoor = () => {
      // Find a door that is not the selected door and doesn't have the car
      let doorToReveal;
      do {
        doorToReveal = Math.floor(Math.random() * 3) + 1;
      } while (doorToReveal === gameState.selectedDoor || doorToReveal === gameState.carPosition);

      gameState.revealedDoor = doorToReveal;
      return doorToReveal;
    };

    const revealed = revealGoatDoor();
    expect(revealed).not.toBe(gameState.carPosition); // Not the car
    expect(revealed).not.toBe(gameState.selectedDoor); // Not the selected door
    expect(revealed).toBe(3); // Only remaining door
  });

  test('switching should win when initial choice was a goat', () => {
    // Setup - car at door 1, player chose door 2
    gameState.carPosition = 1;
    gameState.selectedDoor = 2;
    gameState.revealedDoor = 3; // Host reveals door 3

    // Mock switch door function
    const switchDoor = () => {
      // Find the door that's not selected and not revealed
      let newDoor;
      for (let i = 1; i <= 3; i++) {
        if (i !== gameState.selectedDoor && i !== gameState.revealedDoor) {
          newDoor = i;
          break;
        }
      }
      return newDoor;
    };

    const newChoice = switchDoor();
    const win = newChoice === gameState.carPosition;
    expect(newChoice).toBe(1); // Should switch to door 1
    expect(win).toBe(true); // Should win by switching
  });

  test('staying should lose when initial choice was a goat', () => {
    // Setup - car at door 1, player chose door 2
    gameState.carPosition = 1;
    gameState.selectedDoor = 2;

    const win = gameState.selectedDoor === gameState.carPosition;
    expect(win).toBe(false); // Should lose by staying
  });

  test('simulation should give ~1/3 win rate for sticking strategy', () => {
    // Mock simulation function
    const runSimulation = (trials = 10000) => {
      let stickWins = 0;

      for (let i = 0; i < trials; i++) {
        const carDoor = Math.floor(Math.random() * 3) + 1;
        const selectedDoor = Math.floor(Math.random() * 3) + 1;

        if (selectedDoor === carDoor) {
          stickWins++;
        }
      }

      return stickWins / trials;
    };

    const winRate = runSimulation();
    expect(winRate).toBeGreaterThan(0.3);
    expect(winRate).toBeLessThan(0.37);
  });
});
