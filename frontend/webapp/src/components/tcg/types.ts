/**
 * Agentic Interpolating TCG - Type Definitions
 * 
 * This file contains the core type definitions for the
 * Agentic Interpolating Trading Card Game
 */

/**
 * Represents an interpolation function between two stat values
 * based on a time or condition parameter
 */
export type InterpolationFunction = (
  startValue: number, 
  endValue: number, 
  parameter: number
) => number;

/**
 * Defines the interpolation methods available for card stats
 */
export enum InterpolationMethod {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  SINUSOIDAL = 'sinusoidal',
  STEPPED = 'stepped',
  CUSTOM = 'custom'
}

/**
 * Defines a range of values that can be interpolated
 */
export interface InterpolatableRange {
  min: number;
  max: number;
  currentValue: number;
  method: InterpolationMethod;
  customFn?: InterpolationFunction;
}

/**
 * Represents card rarity levels
 */
export enum CardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

/**
 * Represents card elemental types
 */
export enum CardElement {
  FIRE = 'fire',
  WATER = 'water',
  EARTH = 'earth',
  AIR = 'air',
  LIGHT = 'light',
  DARK = 'dark',
  NEUTRAL = 'neutral'
}

/**
 * Represents a card ability that can have different
 * effects based on game state
 */
export interface CardAbility {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  currentCooldown: number;
  effect: (gameState: GameState, cardId: string) => GameState;
}

/**
 * Represents the decision-making capability of a card
 */
export interface AgenticBehavior {
  id: string;
  name: string;
  description: string;
  decisionFn: (gameState: GameState, cardId: string) => GameAction;
  confidenceThreshold: number;
  learningRate: number;
  memory: Record<string, any>;
}

/**
 * Core card data structure
 */
export interface Card {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tokenId?: number; // Optional blockchain token ID
  rarity: CardRarity;
  element: CardElement;
  
  // Stats that can interpolate between values
  attack: InterpolatableRange;
  defense: InterpolatableRange;
  energy: InterpolatableRange;
  
  // Card abilities
  abilities: CardAbility[];
  
  // Agentic behavior (card AI)
  agenticBehavior?: AgenticBehavior;
  
  // Metadata
  creator: string;
  creationDate: string;
  metadata: Record<string, any>;
}

/**
 * Player state in the game
 */
export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  deck: Card[];
  hand: Card[];
  field: Card[];
  graveyard: Card[];
  energy: number;
  health: number;
}

/**
 * Represents a game action that can be taken
 */
export interface GameAction {
  type: string;
  payload: Record<string, any>;
  timestamp: number;
  playerId: string;
  cardId?: string;
}

/**
 * Game state containing all information about the current game
 */
export interface GameState {
  id: string;
  players: Player[];
  currentPlayer: number;
  turn: number;
  phase: string;
  actions: GameAction[];
  environment: {
    time: number;
    condition: string;
    modifiers: Record<string, any>;
  };
  status: 'waiting' | 'active' | 'paused' | 'finished';
  winner?: string;
}