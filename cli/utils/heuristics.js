/**
 * Mathematical Heuristics and Optimization Algorithms
 *
 * Advanced algorithms for optimization problems commonly found in blockchain systems:
 * - Gas optimization
 * - Transaction batching
 * - Token distribution strategies
 * - Consensus efficiency
 */

/**
 * Simulated Annealing for optimization problems
 *
 * @param {Function} objectiveFunction - Function to minimize
 * @param {Function} neighborFunction - Function to generate neighbor solution
 * @param {any} initialSolution - Starting point
 * @param {object} options - Algorithm parameters
 * @returns {object} Best solution found
 */
function simulatedAnnealing(objectiveFunction, neighborFunction, initialSolution, options = {}) {
  // Set default parameters
  const {
    initialTemperature = 1000,
    coolingRate = 0.95,
    minTemperature = 1e-10,
    iterationsPerTemp = 100
  } = options;

  let currentSolution = initialSolution;
  let currentEnergy = objectiveFunction(currentSolution);

  let bestSolution = currentSolution;
  let bestEnergy = currentEnergy;

  let temperature = initialTemperature;
  let iteration = 0;

  // Store history for analysis
  const history = [
    {
      iteration: 0,
      temperature,
      energy: currentEnergy,
      solution: JSON.parse(JSON.stringify(currentSolution))
    }
  ];

  // Main simulated annealing loop
  while (temperature > minTemperature) {
    for (let i = 0; i < iterationsPerTemp; i++) {
      iteration++;

      // Generate neighboring solution
      const newSolution = neighborFunction(currentSolution);
      const newEnergy = objectiveFunction(newSolution);

      // Decide whether to accept the new solution
      const acceptanceProbability =
        newEnergy < currentEnergy ? 1 : Math.exp((currentEnergy - newEnergy) / temperature);

      if (Math.random() < acceptanceProbability) {
        currentSolution = newSolution;
        currentEnergy = newEnergy;

        // Update best solution if we found a better one
        if (currentEnergy < bestEnergy) {
          bestSolution = currentSolution;
          bestEnergy = currentEnergy;
        }
      }

      // Record history at intervals
      if (iteration % 100 === 0) {
        history.push({
          iteration,
          temperature,
          energy: currentEnergy,
          solution: JSON.parse(JSON.stringify(currentSolution))
        });
      }
    }

    // Cool down
    temperature *= coolingRate;
  }

  return {
    solution: bestSolution,
    energy: bestEnergy,
    history,
    iterations: iteration
  };
}

/**
 * Genetic Algorithm for optimization problems
 *
 * @param {Function} fitnessFunction - Function to maximize
 * @param {Function} generateIndividual - Function to create random individual
 * @param {Function} crossover - Function to create child from parents
 * @param {Function} mutate - Function to introduce random changes
 * @param {object} options - Algorithm parameters
 * @returns {object} Best individual found
 */
function geneticAlgorithm(fitnessFunction, generateIndividual, crossover, mutate, options = {}) {
  const {
    populationSize = 100,
    generations = 100,
    elitismCount = 5,
    tournamentSize = 3,
    mutationRate = 0.01,
    crossoverRate = 0.9
  } = options;

  // Initialize population
  let population = Array(populationSize)
    .fill()
    .map(() => generateIndividual());

  // Evaluate initial population
  let fitnessScores = population.map(fitnessFunction);

  // Find initial best
  let bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
  let bestIndividual = population[bestIndex];
  let bestFitness = fitnessScores[bestIndex];

  const history = [
    {
      generation: 0,
      averageFitness: fitnessScores.reduce((a, b) => a + b, 0) / populationSize,
      bestFitness,
      diversity: calculateDiversity(population)
    }
  ];

  // Evolution process
  for (let generation = 1; generation <= generations; generation++) {
    // Selection and reproduction
    const newPopulation = [];

    // Elitism - keep the best individuals
    if (elitismCount > 0) {
      // Sort by fitness (descending)
      const sortedIndices = fitnessScores
        .map((score, i) => ({ score, index: i }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.index);

      // Add the best individuals to the new population
      for (let i = 0; i < elitismCount && i < populationSize; i++) {
        newPopulation.push(JSON.parse(JSON.stringify(population[sortedIndices[i]])));
      }
    }

    // Fill the rest of the population with new individuals
    while (newPopulation.length < populationSize) {
      // Tournament selection
      const parent1 = tournamentSelect(population, fitnessScores, tournamentSize);
      const parent2 = tournamentSelect(population, fitnessScores, tournamentSize);

      let child;

      // Crossover with probability
      if (Math.random() < crossoverRate) {
        child = crossover(parent1, parent2);
      } else {
        // No crossover, just copy one parent
        child = JSON.parse(JSON.stringify(Math.random() < 0.5 ? parent1 : parent2));
      }

      // Mutation with probability
      if (Math.random() < mutationRate) {
        child = mutate(child);
      }

      newPopulation.push(child);
    }

    // Update population
    population = newPopulation;

    // Evaluate new population
    fitnessScores = population.map(fitnessFunction);

    // Find new best
    bestIndex = fitnessScores.indexOf(Math.max(...fitnessScores));
    const generationBest = population[bestIndex];
    const generationBestFitness = fitnessScores[bestIndex];

    // Update overall best if needed
    if (generationBestFitness > bestFitness) {
      bestIndividual = generationBest;
      bestFitness = generationBestFitness;
    }

    // Record history
    history.push({
      generation,
      averageFitness: fitnessScores.reduce((a, b) => a + b, 0) / populationSize,
      bestFitness: generationBestFitness,
      diversity: calculateDiversity(population)
    });
  }

  return {
    individual: bestIndividual,
    fitness: bestFitness,
    history,
    finalPopulation: population
  };

  // Helper function for tournament selection
  function tournamentSelect(population, fitnessScores, tournamentSize) {
    // Select random individuals for the tournament
    const tournamentIndices = Array(tournamentSize)
      .fill()
      .map(() => Math.floor(Math.random() * population.length));

    // Find the best one in the tournament
    let bestIdx = tournamentIndices[0];
    let bestScore = fitnessScores[bestIdx];

    for (let i = 1; i < tournamentIndices.length; i++) {
      const idx = tournamentIndices[i];
      if (fitnessScores[idx] > bestScore) {
        bestIdx = idx;
        bestScore = fitnessScores[idx];
      }
    }

    return population[bestIdx];
  }

  // Measure population diversity (basic implementation)
  function calculateDiversity(population) {
    // This is a simplistic measure and would need to be customized
    // for specific problem representations
    if (population.length <= 1) return 0;

    // Simple approach: measure standard deviation of fitness
    const avg = fitnessScores.reduce((a, b) => a + b, 0) / population.length;
    const variance =
      fitnessScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / population.length;

    return Math.sqrt(variance);
  }
}

/**
 * Particle Swarm Optimization (PSO)
 *
 * @param {Function} objectiveFunction - Function to minimize
 * @param {number} dimensions - Number of problem dimensions
 * @param {Array<Array<number>>} bounds - Min/max bounds for each dimension
 * @param {object} options - Algorithm parameters
 * @returns {object} Best solution found
 */
function particleSwarmOptimization(objectiveFunction, dimensions, bounds, options = {}) {
  const {
    swarmSize = 30,
    iterations = 100,
    inertia = 0.7,
    cognitiveCoeff = 1.4,
    socialCoeff = 1.4
  } = options;

  // Initialize swarm particles
  const particles = [];
  for (let i = 0; i < swarmSize; i++) {
    // Random position within bounds
    const position = Array(dimensions)
      .fill()
      .map((_, dim) => {
        const [min, max] = bounds[dim];
        return min + Math.random() * (max - min);
      });

    // Random velocity
    const velocity = Array(dimensions)
      .fill()
      .map((_, dim) => {
        const [min, max] = bounds[dim];
        return (Math.random() - 0.5) * (max - min) * 0.1;
      });

    const fitness = objectiveFunction(position);

    particles.push({
      position,
      velocity,
      fitness,
      personalBest: {
        position: [...position],
        fitness
      }
    });
  }

  // Initialize global best
  let globalBest = particles.reduce(
    (best, particle) =>
      particle.fitness < best.fitness
        ? { position: [...particle.position], fitness: particle.fitness }
        : best,
    { position: [...particles[0].position], fitness: particles[0].fitness }
  );

  // History for analysis
  const history = [
    {
      iteration: 0,
      bestFitness: globalBest.fitness,
      averageFitness: particles.reduce((sum, p) => sum + p.fitness, 0) / swarmSize
    }
  ];

  // Main PSO loop
  for (let iter = 1; iter <= iterations; iter++) {
    // Update each particle
    for (const particle of particles) {
      // Update velocity and position
      for (let dim = 0; dim < dimensions; dim++) {
        // Cognitive component (personal best)
        const cognitiveVelocity =
          cognitiveCoeff *
          Math.random() *
          (particle.personalBest.position[dim] - particle.position[dim]);

        // Social component (global best)
        const socialVelocity =
          socialCoeff * Math.random() * (globalBest.position[dim] - particle.position[dim]);

        // Update velocity with inertia
        particle.velocity[dim] =
          inertia * particle.velocity[dim] + cognitiveVelocity + socialVelocity;

        // Update position
        particle.position[dim] += particle.velocity[dim];

        // Enforce bounds
        const [min, max] = bounds[dim];
        if (particle.position[dim] < min) {
          particle.position[dim] = min;
          particle.velocity[dim] *= -0.5; // Bounce off boundary
        } else if (particle.position[dim] > max) {
          particle.position[dim] = max;
          particle.velocity[dim] *= -0.5; // Bounce off boundary
        }
      }

      // Evaluate new position
      particle.fitness = objectiveFunction(particle.position);

      // Update personal best
      if (particle.fitness < particle.personalBest.fitness) {
        particle.personalBest = {
          position: [...particle.position],
          fitness: particle.fitness
        };

        // Update global best if needed
        if (particle.fitness < globalBest.fitness) {
          globalBest = {
            position: [...particle.position],
            fitness: particle.fitness
          };
        }
      }
    }

    // Record history
    history.push({
      iteration: iter,
      bestFitness: globalBest.fitness,
      averageFitness: particles.reduce((sum, p) => sum + p.fitness, 0) / swarmSize
    });
  }

  return {
    solution: globalBest.position,
    fitness: globalBest.fitness,
    history
  };
}

/**
 * Monte Carlo Tree Search (MCTS) for decision making under uncertainty
 *
 * @param {object} rootState - Initial state
 * @param {Function} getActions - Function returning legal actions from a state
 * @param {Function} applyAction - Function returning new state after applying action
 * @param {Function} simulate - Function simulating rollout from a state to terminal state
 * @param {object} options - Algorithm parameters
 * @returns {object} Best action found
 */
function monteCarloTreeSearch(rootState, getActions, applyAction, simulate, options = {}) {
  const {
    simulations = 1000,
    explorationConstant = 1.41,
    rolloutDepth = 50,
    timeLimit = 1000 // ms
  } = options;

  // Define Node class for the search tree
  class MCTSNode {
    constructor(state, parent = null, action = null) {
      this.state = state;
      this.parent = parent;
      this.action = action; // Action that led to this node
      this.children = [];
      this.visits = 0;
      this.value = 0;
      this.untriedActions = getActions(state);
    }

    // UCB1 selection formula
    ucbValue(explorationConstant) {
      if (this.visits === 0) return Infinity;
      return (
        this.value / this.visits +
        explorationConstant * Math.sqrt((2 * Math.log(this.parent.visits)) / this.visits)
      );
    }

    // Is this a fully expanded node?
    isFullyExpanded() {
      return this.untriedActions.length === 0;
    }

    // Is this a terminal node?
    isTerminal() {
      return getActions(this.state).length === 0;
    }

    // Select best child according to UCB
    bestChild(explorationConstant) {
      return this.children.reduce((bestChild, child) => {
        const ucbValue = child.ucbValue(explorationConstant);
        return ucbValue > bestChild.ucbValue(explorationConstant) ? child : bestChild;
      }, this.children[0]);
    }

    // Expand by trying an untried action
    expand() {
      const actionIndex = Math.floor(Math.random() * this.untriedActions.length);
      const action = this.untriedActions[actionIndex];
      this.untriedActions.splice(actionIndex, 1);

      const nextState = applyAction(this.state, action);
      const childNode = new MCTSNode(nextState, this, action);
      this.children.push(childNode);
      return childNode;
    }

    // Update statistics after a simulation
    update(reward) {
      this.visits++;
      this.value += reward;
    }
  }

  // Create root node
  const rootNode = new MCTSNode(rootState);

  // Run MCTS for specified simulations or time limit
  const startTime = Date.now();
  let simulationCount = 0;

  while (simulationCount < simulations && Date.now() - startTime < timeLimit) {
    // Phase 1: Selection
    let node = rootNode;
    while (!node.isTerminal() && node.isFullyExpanded()) {
      node = node.bestChild(explorationConstant);
    }

    // Phase 2: Expansion
    if (!node.isTerminal() && !node.isFullyExpanded()) {
      node = node.expand();
    }

    // Phase 3: Simulation (rollout)
    let reward = simulate(node.state, rolloutDepth);

    // Phase 4: Backpropagation
    while (node !== null) {
      node.update(reward);
      node = node.parent;
    }

    simulationCount++;
  }

  // Select best action from the root based on most visits
  const bestChild = rootNode.children.reduce((best, child) => {
    return child.visits > best.visits ? child : best;
  }, rootNode.children[0]);

  return {
    action: bestChild.action,
    visits: bestChild.visits,
    value: bestChild.value,
    simulations: simulationCount,
    timeUsed: Date.now() - startTime,
    visitDistribution: rootNode.children.map(child => ({
      action: child.action,
      visits: child.visits,
      value: child.value / (child.visits || 1)
    }))
  };
}

/**
 * A* Search Algorithm for pathfinding and graph traversal
 *
 * @param {any} start - Starting node
 * @param {Function} goalTest - Function to test if a node is the goal
 * @param {Function} getNeighbors - Function returning neighbors of a node
 * @param {Function} heuristic - Function estimating cost to goal
 * @param {Function} cost - Function returning cost between two nodes
 * @returns {object} Path from start to goal
 */
function aStarSearch(start, goalTest, getNeighbors, heuristic, cost) {
  // Priority queue for open set (nodes to explore)
  const openSet = new PriorityQueue();
  openSet.enqueue(start, heuristic(start));

  // Tracking data structures
  const cameFrom = new Map(); // Path reconstruction
  const gScore = new Map(); // Best known cost from start
  const fScore = new Map(); // Estimated total cost through node

  // Initialize start node scores
  gScore.set(nodeToKey(start), 0);
  fScore.set(nodeToKey(start), heuristic(start));

  // Track all nodes we've seen for visualization
  const explored = new Set();

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();
    const currentKey = nodeToKey(current);

    // Add to explored set
    explored.add(currentKey);

    // Check if we've reached the goal
    if (goalTest(current)) {
      // Reconstruct the path
      const path = [current];
      let currentNode = current;

      while (cameFrom.has(nodeToKey(currentNode))) {
        currentNode = cameFrom.get(nodeToKey(currentNode));
        path.unshift(currentNode);
      }

      return {
        path,
        cost: gScore.get(nodeToKey(current)),
        explored: Array.from(explored),
        expandedNodes: explored.size
      };
    }

    // Explore neighbors
    const neighbors = getNeighbors(current);
    for (const neighbor of neighbors) {
      const neighborKey = nodeToKey(neighbor);

      // Calculate tentative gScore
      const tentativeGScore = gScore.get(currentKey) + cost(current, neighbor);

      if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
        // This path is better, record it
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor));

        // Add to open set if not already there
        if (!openSet.contains(neighbor)) {
          openSet.enqueue(neighbor, fScore.get(neighborKey));
        }
      }
    }
  }

  // If we get here, there's no path
  return {
    path: null,
    cost: Infinity,
    explored: Array.from(explored),
    expandedNodes: explored.size
  };

  // Helper function to convert node to string key for Maps
  function nodeToKey(node) {
    return typeof node === 'object' ? JSON.stringify(node) : String(node);
  }
}

/**
 * Simple priority queue implementation
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    const element = { item, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (priority < this.items[i].priority) {
        this.items.splice(i, 0, element);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(element);
    }
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift().item;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  contains(item) {
    const key = typeof item === 'object' ? JSON.stringify(item) : String(item);
    return this.items.some(element => {
      const elementKey =
        typeof element.item === 'object' ? JSON.stringify(element.item) : String(element.item);
      return elementKey === key;
    });
  }
}

/**
 * Blockchain-specific optimization: Gas usage optimization
 *
 * @param {Array<object>} transactions - List of transactions
 * @param {number} gasLimit - Maximum gas per block
 * @returns {object} Optimized transaction batches
 */
function optimizeGasUsage(transactions, gasLimit) {
  // Sort transactions by profitability (gas price * priority)
  const sortedTxs = [...transactions].sort(
    (a, b) => b.gasPrice * b.priority - a.gasPrice * a.priority
  );

  const batches = [];
  let currentBatch = [];
  let currentGasUsed = 0;

  // First-fit decreasing bin packing algorithm
  for (const tx of sortedTxs) {
    if (currentGasUsed + tx.gasEstimate <= gasLimit) {
      // Add to current batch
      currentBatch.push(tx);
      currentGasUsed += tx.gasEstimate;
    } else {
      // Start a new batch
      if (currentBatch.length > 0) {
        batches.push({
          transactions: currentBatch,
          gasUsed: currentGasUsed,
          efficiency: currentGasUsed / gasLimit
        });
      }

      currentBatch = [tx];
      currentGasUsed = tx.gasEstimate;
    }
  }

  // Add the last batch if not empty
  if (currentBatch.length > 0) {
    batches.push({
      transactions: currentBatch,
      gasUsed: currentGasUsed,
      efficiency: currentGasUsed / gasLimit
    });
  }

  // Calculate overall metrics
  const totalGasUsed = batches.reduce((sum, batch) => sum + batch.gasUsed, 0);
  const averageEfficiency =
    batches.length > 0
      ? batches.reduce((sum, batch) => sum + batch.efficiency, 0) / batches.length
      : 0;

  return {
    batches,
    totalBatches: batches.length,
    totalGasUsed,
    averageEfficiency,
    transactionsIncluded: batches.reduce((sum, batch) => sum + batch.transactions.length, 0)
  };
}

module.exports = {
  simulatedAnnealing,
  geneticAlgorithm,
  particleSwarmOptimization,
  monteCarloTreeSearch,
  aStarSearch,
  optimizeGasUsage
};
