/**
 * SxS CLI Natural Language Processor
 * Adds natural language understanding capabilities to the SxS CLI
 * Created: April 26, 2025
 */

const natural = require('natural');
const nlp = require('compromise');
const dates = require('compromise-dates');
const { IntentClassifier } = require('intent-classifier');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const TaskRunner = require('./task-runner');
const WorkflowManager = require('./workflow-manager');
const ConversationManager = require('./conversation-manager');
const NetworkVisualizer = require('./network-visualizer');

// Register plugins
nlp.extend(dates);

/**
 * Natural language processor for the SxS CLI
 * Allows users to interact with the CLI using natural language
 */
class NLPHandler {
  constructor(cliHandler) {
    this.cliHandler = cliHandler;
    this.classifier = new IntentClassifier();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;

    // Load config file
    this.configPath = path.join(__dirname, 'nlp-config.json');
    this.config = this.loadConfig();

    // Initialize task runner
    this.taskRunner = new TaskRunner();

    // Initialize workflow manager
    this.workflowManager = new WorkflowManager(this.taskRunner);

    // Initialize conversation manager
    this.conversationManager = new ConversationManager();

    // Initialize network visualizer
    this.networkVisualizer = new NetworkVisualizer();

    // Initialize memory if enabled
    this.memory = {
      lastCommands: [],
      currentContext: 'development',
      environmentType: null
    };

    // Initialize the intent classifier
    this.initializeIntents();

    // Command mappings - maps intents to actual commands
    this.commandMappings = {
      build_web: { command: 'web', options: {} },
      build_native: { command: 'native', options: {} },
      start_server: { command: 'server', options: {} },
      help: { command: 'help', options: {} },
      show_version: { command: 'version', options: {} },
      list_plugins: { command: 'plugins', options: {} },
      deploy_project: { command: 'deploy', options: {} },
      clean_project: { command: 'clean', options: {} },
      setup_environment: { command: 'setup_emsdk', options: {} },
      environment_info: { command: 'env_info', options: {} },
      node_status: { command: 'status', options: {} },
      generate_docs: { command: 'docs', options: {} },
      branch_info: { command: 'branch_info', options: {} },
      switch_to_main: { command: 'switch_main', options: {} },
      switch_to_docs: { command: 'switch_docs', options: {} },
      sync_branches: { command: 'sync_branches', options: {} },
      bypass_native_build: { command: 'bypass_native', options: {} },
      show_network: { command: 'show_network_status', options: {} },
      show_network_visualization: { command: 'visualize_network', options: {} }
    };

    // Register new special intents for conversation handling
    this.registerSpecialIntents();

    // Detect environment (like PowerShell vs CMD vs Browser)
    this.detectEnvironment();

    // Try to recover any active workflow
    this.recoverWorkflow();
  }

  /**
   * Load NLP configuration from file
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error(chalk.red(`Error loading NLP config: ${error.message}`));
    }

    // Return default config if loading fails
    return {
      version: '1.0.0',
      intents: {},
      parameters: {},
      synonyms: {},
      contexts: {
        development: {
          priority_intents: ['build_web', 'build_native', 'start_server']
        }
      },
      responses: {
        not_understood: ["I didn't understand that command."]
      }
    };
  }

  /**
   * Detect the environment we're running in
   */
  detectEnvironment() {
    // Check for PowerShell environment
    if (process.env.PSModulePath || process.env.POWERSHELL_DISTRIBUTION_CHANNEL) {
      this.memory.environmentType = 'powershell';
      return;
    }

    // Check for browser/WASM environment
    if (typeof window !== 'undefined') {
      this.memory.environmentType = 'browser';
      return;
    }

    // Check for Windows CMD
    if (process.platform === 'win32' && !process.env.PSModulePath) {
      this.memory.environmentType = 'cmd';
      return;
    }

    // Default to generic shell
    this.memory.environmentType = 'shell';
  }

  /**
   * Initialize the intent classifier with training data
   */
  initializeIntents() {
    // Add intent training data from config
    if (this.config && this.config.intents) {
      for (const [intentName, intentData] of Object.entries(this.config.intents)) {
        if (intentData.patterns && Array.isArray(intentData.patterns)) {
          for (const pattern of intentData.patterns) {
            this.classifier.addDocument(pattern, intentName);

            // Generate additional patterns with synonyms
            this.addSynonymPatterns(pattern, intentName);
          }
        }
      }
    }

    // Add built-in patterns if config is missing or incomplete
    this.addBuiltInPatterns();

    // Train the classifier
    this.classifier.train();
  }

  /**
   * Register special intents for conversation handling and visualizations
   */
  registerSpecialIntents() {
    // Add conversation intents
    this.classifier.addDocument('cancel', 'cancel_operation');
    this.classifier.addDocument('cancel current operation', 'cancel_operation');
    this.classifier.addDocument('stop this', 'cancel_operation');
    this.classifier.addDocument('nevermind', 'cancel_operation');

    // Add network visualization intents
    this.classifier.addDocument('show network status', 'show_network');
    this.classifier.addDocument('display network', 'show_network');
    this.classifier.addDocument('check network health', 'show_network');
    this.classifier.addDocument('show node status', 'show_network');
    this.classifier.addDocument('network health', 'show_network');

    this.classifier.addDocument('visualize network', 'show_network_visualization');
    this.classifier.addDocument('show network visualization', 'show_network_visualization');
    this.classifier.addDocument('show network diagram', 'show_network_visualization');
    this.classifier.addDocument('network diagram', 'show_network_visualization');
    this.classifier.addDocument('network graph', 'show_network_visualization');
    this.classifier.addDocument('display network topology', 'show_network_visualization');
    this.classifier.addDocument('show topology', 'show_network_visualization');

    // Add layout switching intents
    this.classifier.addDocument('use radial layout', 'switch_layout_radial');
    this.classifier.addDocument('show radial diagram', 'switch_layout_radial');
    this.classifier.addDocument('switch to radial view', 'switch_layout_radial');

    this.classifier.addDocument('use hierarchical layout', 'switch_layout_hierarchical');
    this.classifier.addDocument('show hierarchical diagram', 'switch_layout_hierarchical');
    this.classifier.addDocument('switch to hierarchical view', 'switch_layout_hierarchical');

    this.classifier.addDocument('use matrix layout', 'switch_layout_matrix');
    this.classifier.addDocument('show matrix diagram', 'switch_layout_matrix');
    this.classifier.addDocument('switch to matrix view', 'switch_layout_matrix');

    // Retrain the classifier with the new intents
    this.classifier.train();
  }

  /**
   * Add patterns with synonyms for better matching
   */
  addSynonymPatterns(pattern, intentName) {
    if (!this.config.synonyms) return;

    // For each word in the pattern, check if we have synonyms
    const words = pattern.split(' ');

    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();

      // Check if this word has synonyms
      for (const [baseWord, synonyms] of Object.entries(this.config.synonyms)) {
        if (word === baseWord || synonyms.includes(word)) {
          // Generate variations with each synonym
          for (const synonym of synonyms) {
            if (synonym !== word) {
              const newPattern = [...words];
              newPattern[i] = synonym;
              this.classifier.addDocument(newPattern.join(' '), intentName);
            }
          }
        }
      }
    }
  }

  /**
   * Add built-in patterns as fallback
   */
  addBuiltInPatterns() {
    // Some essential patterns in case config is missing
    const basicPatterns = {
      build_web: ['build web', 'compile web', 'make web', 'build for web'],
      build_native: ['build native', 'compile native', 'make native app'],
      start_server: ['start server', 'run server', 'launch server'],
      help: ['help', 'help me', 'show help'],
      deploy_project: ['deploy', 'deploy project', 'publish'],
      clean_project: ['clean', 'clean project', 'clean build'],
      setup_environment: ['setup env', 'install tools', 'setup emsdk']
    };

    for (const [intent, patterns] of Object.entries(basicPatterns)) {
      for (const pattern of patterns) {
        // Only add if we don't have this intent from config
        if (!this.config.intents || !this.config.intents[intent]) {
          this.classifier.addDocument(pattern, intent);
        }
      }
    }
  }

  /**
   * Process a natural language command
   */
  async processNaturalLanguage(text) {
    try {
      // First, check if this is part of a conversation
      const conversationResult = this.conversationManager.processConversationalInput(text, this);
      if (conversationResult.handled) {
        if (conversationResult.message) {
          console.log(chalk.cyan(`💬 ${conversationResult.message}`));
        }
        return true;
      }

      // Check for active workflow continuation
      if (this.workflowManager.isWorkflowActive()) {
        console.log(chalk.cyan(`🔄 Continuing active workflow...`));
        return await this.workflowManager.continueWorkflow(this);
      }

      // Remember this command if memory is enabled
      if (this.config.plugins?.memory?.enabled) {
        this.rememberCommand(text);
      }

      // Preprocess the text
      const normalizedText = text.trim().toLowerCase();

      // Check if this is a multi-step workflow
      const workflowName = this.workflowManager.identifyWorkflow(normalizedText);
      if (workflowName) {
        console.log(chalk.cyan(`🔄 Detected workflow pattern: ${workflowName}`));
        const options = this.extractParameters(normalizedText);
        return await this.workflowManager.startWorkflow(workflowName, this, options);
      }

      // Classify the intent
      const classifications = this.classifier.getClassifications(normalizedText);
      const topIntent = classifications.length > 0 ? classifications[0] : null;

      // Check if we have a matching intent with reasonable confidence
      if (topIntent && topIntent.value > 0.7) {
        console.log(
          `🧠 ${chalk.cyan(`Detected intent: ${topIntent.label} (${Math.round(topIntent.value * 100)}% confidence)`)}`
        );

        // Handle special intents first
        if (await this.handleSpecialIntents(topIntent.label, normalizedText)) {
          return true;
        }

        // Extract parameters
        const options = this.extractParameters(normalizedText);

        // First check if this intent has a VS Code task mapping
        const taskMappings = this.taskRunner.getTaskMappings();
        const taskName = taskMappings[topIntent.label];

        if (taskName) {
          console.log(`🔄 ${chalk.green(`Executing VS Code task: ${taskName}`)}`);
          const result = await this.taskRunner.runTask(taskName, options);

          // Check if we should ask a follow-up question
          if (result && this.conversationManager.shouldAskFollowUp(topIntent.label)) {
            const followUpQuestion = this.conversationManager.createFollowUp(topIntent.label);
            if (followUpQuestion) {
              console.log(chalk.cyan(`💬 ${followUpQuestion}`));
            }
          }

          return result;
        }

        // If not a task, check command mappings
        const commandInfo = this.commandMappings[topIntent.label];

        if (commandInfo) {
          // Merge extracted options with command defaults
          const mergedOptions = { ...commandInfo.options, ...options };

          console.log(`🔄 ${chalk.green(`Executing command: ${commandInfo.command}`)}`);
          if (Object.keys(mergedOptions).length > 0) {
            console.log(`   ${chalk.yellow(`With options: ${JSON.stringify(mergedOptions)}`)}`);
          }

          // Special handling for environment info command
          if (topIntent.label === 'environment_info') {
            return await this.handleEnvironmentInfo();
          }

          // Execute the command
          const result = this.cliHandler.processCommand([
            commandInfo.command,
            ...this.optionsToArgs(mergedOptions)
          ]);

          // Check if we should ask a follow-up question
          if (result && this.conversationManager.shouldAskFollowUp(topIntent.label)) {
            const followUpQuestion = this.conversationManager.createFollowUp(topIntent.label);
            if (followUpQuestion) {
              console.log(chalk.cyan(`💬 ${followUpQuestion}`));
            }
          }

          return result;
        } else {
          console.error(chalk.red(`❌ No command mapping for intent: ${topIntent.label}`));
          return false;
        }
      } else {
        // Handle ambiguous build/switch commands
        if (
          /\b(build|make|compile)\b/i.test(normalizedText) &&
          !/(web|native|windows)\b/i.test(normalizedText)
        ) {
          const disambiguationQuestion = this.conversationManager.createDisambiguation('build');
          if (disambiguationQuestion) {
            console.log(chalk.cyan(`💬 ${disambiguationQuestion}`));
            return true;
          }
        }

        if (
          /\b(switch|change|checkout)\b/i.test(normalizedText) &&
          !/(main|docs|documentation|temp-check-actions)\b/i.test(normalizedText)
        ) {
          const disambiguationQuestion =
            this.conversationManager.createDisambiguation('switch_branch');
          if (disambiguationQuestion) {
            console.log(chalk.cyan(`💬 ${disambiguationQuestion}`));
            return true;
          }
        }

        // Try to find a similar command
        const similarCommand = this.findSimilarCommand(normalizedText);

        if (similarCommand) {
          const response = this.getRandomNotUnderstoodResponse();
          console.log(chalk.yellow(`❓ ${response}`));
          console.log(chalk.cyan(`💡 Did you mean: "${similarCommand.suggested}"?`));
        } else {
          const response = this.getRandomNotUnderstoodResponse();
          console.log(chalk.yellow(`❓ ${response}`));
        }

        return false;
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error processing natural language command: ${error.message}`));
      return false;
    }
  }

  /**
   * Handle special visualization intents and conversation commands
   */
  async handleSpecialIntents(intent, text) {
    switch (intent) {
      case 'cancel_operation':
        if (this.conversationManager.isWaitingForResponse()) {
          console.log(chalk.yellow(`⚠️ Cancelling current operation...`));
          this.conversationManager.waitingForResponse = false;
          this.conversationManager.pendingQuestion = null;
          return true;
        }
        if (this.workflowManager.isWorkflowActive()) {
          console.log(chalk.yellow(`⚠️ Cancelling active workflow...`));
          this.workflowManager.clearWorkflowState();
          this.workflowManager.activeWorkflow = null;
          console.log(chalk.green(`✅ Workflow cancelled`));
          return true;
        }
        return false;

      case 'show_network':
        console.log(chalk.cyan(`📊 Network Status:`));
        console.log(this.networkVisualizer.getMiniStatusView());
        return true;

      case 'show_network_visualization':
        console.log(chalk.cyan(`📊 Launching network visualization...`));
        this.networkVisualizer.drawNetworkDiagram();
        console.log(
          chalk.cyan(
            `\n💡 Use commands like "switch to radial layout", "use matrix layout", or "use hierarchical layout" to change the view type.`
          )
        );
        return true;

      case 'switch_layout_radial':
        this.networkVisualizer.switchLayout('radial');
        this.networkVisualizer.drawNetworkDiagram();
        return true;

      case 'switch_layout_hierarchical':
        this.networkVisualizer.switchLayout('hierarchical');
        this.networkVisualizer.drawNetworkDiagram();
        return true;

      case 'switch_layout_matrix':
        this.networkVisualizer.switchLayout('matrix');
        this.networkVisualizer.drawNetworkDiagram();
        return true;
    }

    return false;
  }

  /**
   * Try to recover an active workflow if one exists
   */
  async recoverWorkflow() {
    if (this.workflowManager.loadWorkflowState()) {
      console.log(
        chalk.yellow(
          `⚠️ Recovered an active workflow. Type 'continue' to resume or 'cancel workflow' to abort.`
        )
      );
      return true;
    }
    return false;
  }

  /**
   * Extract parameters from natural language input
   */
  extractParameters(text) {
    const options = {};
    const doc = nlp(text);

    // Extract port numbers
    const portMatch = text.match(/\b(?:port|on port|using port)\s+(\d+)\b/i);
    if (portMatch) {
      options.port = parseInt(portMatch[1], 10);
    }

    // Extract mode
    const modeMatch = text.match(/\b(?:in|using|with)\s+(\w+)\s+mode\b/i);
    if (modeMatch) {
      options.mode = modeMatch[1].toLowerCase();
    }

    // Extract verbose flag
    if (/\b(?:verbose|detailed|in detail|with details)\b/i.test(text)) {
      options.verbose = true;
    }

    // Extract no-window flag
    if (/\b(?:no window|without window|no new window|background)\b/i.test(text)) {
      options['no-window'] = true;
    }

    // Extract environment variables
    const envMatch = text.match(/\bset\s+(\w+)\s+to\s+([^\s,]+)\b/i);
    if (envMatch) {
      if (!options.env) options.env = {};
      options.env[envMatch[1]] = envMatch[2];
    }

    // Extract date information for scheduling
    const dates = doc.dates().json();
    if (dates.length > 0) {
      options.date = dates[0].text;
    }

    // Extract debug flag
    if (/\b(?:debug|debugging|debug mode)\b/i.test(text)) {
      options.debug = true;
    }

    // Extract branch name
    const branchMatch = text.match(/\b(?:branch|to branch|on branch)\s+([a-zA-Z0-9_\-./]+)\b/i);
    if (branchMatch) {
      options.branch = branchMatch[1].toLowerCase();
    }

    return options;
  }

  /**
   * Find the most similar command when no direct match is found
   */
  findSimilarCommand(input) {
    const allCommands = [];

    // Add all the training phrases
    for (const intent in this.classifier.docs) {
      for (const doc of this.classifier.docs[intent]) {
        allCommands.push({ text: doc, intent });
      }
    }

    // Find the best match
    const matches = stringSimilarity.findBestMatch(
      input,
      allCommands.map(cmd => cmd.text)
    );

    if (matches.bestMatch.rating > 0.5) {
      const bestMatch = allCommands[matches.bestMatchIndex];
      return {
        original: input,
        suggested: bestMatch.text,
        intent: bestMatch.intent,
        confidence: matches.bestMatch.rating
      };
    }

    return null;
  }

  /**
   * Get a random "not understood" response from config
   */
  getRandomNotUnderstoodResponse() {
    if (this.config?.responses?.not_understood?.length > 0) {
      const responses = this.config.responses.not_understood;
      return responses[Math.floor(Math.random() * responses.length)];
    }
    return "I didn't understand that command. Try 'help' for assistance.";
  }

  /**
   * Convert options object to command-line arguments
   */
  optionsToArgs(options) {
    const args = [];

    for (const [key, value] of Object.entries(options)) {
      if (key === '_raw') continue; // Skip raw arguments storage

      if (value === true) {
        args.push(`--${key}`);
      } else {
        args.push(`--${key}`, value.toString());
      }
    }

    return args;
  }

  /**
   * Check if text appears to be a natural language command rather than a direct CLI command
   */
  isNaturalLanguage(text) {
    // First check for special commands
    if (text.trim().toLowerCase() === 'continue') {
      return this.workflowManager.isWorkflowActive();
    }

    if (text.trim().toLowerCase() === 'cancel workflow') {
      if (this.workflowManager.isWorkflowActive()) {
        console.log(chalk.yellow(`⚠️ Cancelling active workflow...`));
        this.workflowManager.clearWorkflowState();
        this.workflowManager.activeWorkflow = null;
        console.log(chalk.green(`✅ Workflow cancelled`));
      } else {
        console.log(chalk.yellow(`⚠️ No active workflow to cancel`));
      }
      return true;
    }

    // Also check for direct responses to conversational prompts
    if (this.conversationManager.mightBeDirectResponse(text)) {
      return true;
    }

    // If it's a single word, it's probably a direct command
    if (!text.includes(' ')) return false;

    // If it starts with '--' or '-', it's probably a direct command with flags
    if (text.startsWith('--') || text.startsWith('-')) return false;

    // Check if it contains natural language indicators
    const naturalLanguageIndicators = [
      'please',
      'can you',
      'would',
      'could',
      'need to',
      'want to',
      'how to',
      'i want',
      'i need',
      'help me',
      'show me'
    ];

    for (const indicator of naturalLanguageIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        return true;
      }
    }

    // Check if it's a workflow pattern
    if (this.workflowManager.identifyWorkflow(text)) {
      return true;
    }

    // If the text has more than 3 words, it's more likely to be natural language
    const wordCount = text.split(' ').length;
    return wordCount > 3;
  }

  /**
   * Remember a command for context awareness
   */
  rememberCommand(command) {
    if (!this.config.plugins?.memory?.enabled) return;

    const maxHistory = this.config.plugins.memory.remember_last_commands || 5;

    this.memory.lastCommands.unshift(command);

    // Keep only the specified number of commands
    if (this.memory.lastCommands.length > maxHistory) {
      this.memory.lastCommands.pop();
    }
  }

  /**
   * Handle environment info command (special case)
   */
  async handleEnvironmentInfo() {
    console.log(chalk.cyan('='.repeat(50)));
    console.log(chalk.cyan('RED X ENVIRONMENT INFORMATION'));
    console.log(chalk.cyan('='.repeat(50)));

    // Show detected environment
    console.log(`\nDetected environment: ${chalk.green(this.memory.environmentType)}`);
    console.log(`Node.js version: ${chalk.green(process.version)}`);
    console.log(`Platform: ${chalk.green(process.platform)}`);

    // Show PowerShell specific info if in PowerShell
    if (this.memory.environmentType === 'powershell') {
      console.log(`\n${chalk.cyan('PowerShell Environment Details:')}`);

      try {
        // Execute PowerShell commands through Node's child_process
        const { execSync } = require('child_process');

        // Get PowerShell version
        const psVersionCommand = '$PSVersionTable.PSVersion | ConvertTo-Json';
        const psVersionResult = execSync(`powershell -Command "${psVersionCommand}"`, {
          encoding: 'utf8'
        });

        try {
          const psVersion = JSON.parse(psVersionResult);
          console.log(
            `PowerShell Version: ${chalk.green(`${psVersion.Major}.${psVersion.Minor}.${psVersion.Patch}`)}`
          );
        } catch (e) {
          console.log(`PowerShell Version: ${chalk.green(psVersionResult.trim())}`);
        }

        // Show execution policy
        const policyCommand = 'Get-ExecutionPolicy';
        const policyResult = execSync(`powershell -Command "${policyCommand}"`, {
          encoding: 'utf8'
        });
        console.log(`Execution Policy: ${chalk.green(policyResult.trim())}`);
      } catch (error) {
        console.log(
          chalk.yellow(`Could not retrieve detailed PowerShell information: ${error.message}`)
        );
      }
    }

    // Show some key environment variables
    console.log(`\n${chalk.cyan('Key Environment Variables:')}`);
    const keyVars = [
      'PATH',
      'TEMP',
      'HOME',
      'NODE_ENV',
      'COMPUTERNAME',
      'USERNAME',
      'USERPROFILE',
      'PSModulePath'
    ];

    for (const varName of keyVars) {
      if (process.env[varName]) {
        // Truncate very long values (like PATH)
        let value = process.env[varName];
        if (value.length > 50) {
          value = value.substring(0, 47) + '...';
        }
        console.log(`${varName}: ${chalk.gray(value)}`);
      }
    }

    console.log(chalk.cyan('\n='.repeat(50)));
    return true;
  }
}

module.exports = NLPHandler;
