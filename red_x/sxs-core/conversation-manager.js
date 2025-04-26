/**
 * Conversation Manager for SxS CLI
 * Handles multi-turn conversations and follow-up questions
 * Created: April 26, 2025
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Handles conversational context and follow-up questions
 */
class ConversationManager {
  constructor() {
    this.conversationHistory = [];
    this.currentContext = null;
    this.waitingForResponse = false;
    this.pendingQuestion = null;
    this.pendingAction = null;
    this.conversationId = Date.now().toString();

    // Define conversation follow-up patterns
    this.followUpPatterns = {
      build_web: {
        question: 'Would you like to start the server to preview the build?',
        responses: {
          yes: { intent: 'start_server', confidence: 0.9 },
          no: {
            intent: null,
            message: 'Web build is ready. Use "start server" to preview it when needed.'
          }
        }
      },
      start_server: {
        question: 'Server started. Would you like to open it in a browser?',
        responses: {
          yes: { action: 'openBrowser', args: { url: 'http://localhost:8080' } },
          no: { intent: null }
        }
      },
      clean_project: {
        question: 'Would you like to rebuild the project now?',
        responses: {
          yes: { intent: 'build_web', confidence: 0.9 },
          no: { intent: null, message: 'Project cleaned. You can rebuild later with "build web".' }
        }
      },
      deploy_project: {
        question: 'Deployment completed. Would you like to verify the deployed site?',
        responses: {
          yes: { action: 'openBrowser', args: { url: 'https://USERNAME.github.io/gh-pages/' } },
          no: { intent: null, message: 'Deployment completed successfully.' }
        }
      }
    };

    // Define disambiguation patterns
    this.disambiguationPatterns = {
      switch_branch: {
        question: 'Which branch would you like to switch to?',
        options: [
          { label: 'Main branch', intent: 'switch_to_main', confidence: 0.9 },
          { label: 'Documentation branch', intent: 'switch_to_docs', confidence: 0.9 },
          { label: 'Cancel', intent: null }
        ]
      },
      build: {
        question: 'Which version would you like to build?',
        options: [
          { label: 'Web version (WebAssembly)', intent: 'build_web', confidence: 0.9 },
          { label: 'Native version', intent: 'build_native', confidence: 0.9 },
          { label: 'Cancel', intent: null }
        ]
      }
    };
  }

  /**
   * Add an interaction to the conversation history
   */
  addToHistory(role, content, metadata = {}) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
      ...metadata
    });

    // Keep history to a reasonable size
    if (this.conversationHistory.length > 50) {
      this.conversationHistory.shift();
    }

    this.saveHistory();
  }

  /**
   * Initialize a context for the current conversation
   */
  setContext(contextName, data = {}) {
    this.currentContext = {
      name: contextName,
      data: data,
      startTime: Date.now()
    };
    return this.currentContext;
  }

  /**
   * Clear the current conversation context
   */
  clearContext() {
    const previousContext = this.currentContext;
    this.currentContext = null;
    return previousContext;
  }

  /**
   * Check if we should ask a follow-up question after an intent
   */
  shouldAskFollowUp(intent) {
    return this.followUpPatterns[intent] !== undefined;
  }

  /**
   * Create a follow-up question for the given intent
   */
  createFollowUp(intent) {
    const pattern = this.followUpPatterns[intent];
    if (!pattern) return null;

    this.waitingForResponse = true;
    this.pendingQuestion = {
      type: 'followUp',
      intent: intent,
      pattern: pattern
    };

    return pattern.question;
  }

  /**
   * Process a user response to a follow-up question
   */
  processFollowUpResponse(response, nlpHandler) {
    if (!this.waitingForResponse || !this.pendingQuestion) {
      return { handled: false, message: null };
    }

    const normalizedResponse = response.toLowerCase().trim();
    const isAffirmative = ['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', 'true'].includes(
      normalizedResponse
    );
    const isNegative = ['no', 'n', 'nope', 'nah', 'false'].includes(normalizedResponse);

    const pattern = this.pendingQuestion.pattern;
    let result = null;

    if (isAffirmative) {
      result = pattern.responses.yes;
      this.addToHistory('user', 'Yes', { followUpTo: this.pendingQuestion.intent });
    } else if (isNegative) {
      result = pattern.responses.no;
      this.addToHistory('user', 'No', { followUpTo: this.pendingQuestion.intent });
    } else {
      // If response is not clearly yes/no, return not handled
      return { handled: false, message: null };
    }

    this.waitingForResponse = false;
    const pendingQuestion = this.pendingQuestion;
    this.pendingQuestion = null;

    // Handle different response types
    if (result.intent) {
      // Add this as system message
      this.addToHistory(
        'system',
        `Following up on ${pendingQuestion.intent} with ${result.intent}`,
        {
          followUpAction: 'intent',
          originalIntent: pendingQuestion.intent,
          newIntent: result.intent
        }
      );

      // Execute the follow-up intent
      setTimeout(() => {
        nlpHandler.processNaturalLanguage(result.intent);
      }, 100);

      return {
        handled: true,
        message: result.message || `Executing ${result.intent} as follow-up...`
      };
    } else if (result.action) {
      // Add this as system message
      this.addToHistory('system', `Following up with action: ${result.action}`, {
        followUpAction: 'custom',
        action: result.action,
        args: result.args
      });

      // Execute custom action
      this.executeAction(result.action, result.args);

      return {
        handled: true,
        message: result.message || `Executing ${result.action}...`
      };
    } else {
      // Just a message, no action
      return {
        handled: true,
        message: result.message || 'Got it.'
      };
    }
  }

  /**
   * Execute a custom action
   */
  executeAction(actionName, args = {}) {
    switch (actionName) {
      case 'openBrowser':
        this.openInBrowser(args.url);
        break;

      // Add more custom actions as needed

      default:
        console.log(chalk.yellow(`⚠️ Unknown action: ${actionName}`));
    }
  }

  /**
   * Open a URL in the default browser
   */
  openInBrowser(url) {
    try {
      const { exec } = require('child_process');
      const command =
        process.platform === 'win32'
          ? `start "${url}"`
          : process.platform === 'darwin'
            ? `open "${url}"`
            : `xdg-open "${url}"`;

      exec(command);
      console.log(chalk.green(`🌐 Opening ${url} in your default browser`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to open browser: ${error.message}`));
    }
  }

  /**
   * Create a disambiguation question when intent is unclear
   */
  createDisambiguation(type) {
    const pattern = this.disambiguationPatterns[type];
    if (!pattern) return null;

    this.waitingForResponse = true;
    this.pendingQuestion = {
      type: 'disambiguation',
      disambiguationType: type,
      pattern: pattern
    };

    // Format the question with numbered options
    let message = pattern.question + '\n';
    pattern.options.forEach((option, index) => {
      message += `${index + 1}. ${option.label}\n`;
    });

    return message;
  }

  /**
   * Process a user response to a disambiguation question
   */
  processDisambiguationResponse(response, nlpHandler) {
    if (
      !this.waitingForResponse ||
      !this.pendingQuestion ||
      this.pendingQuestion.type !== 'disambiguation'
    ) {
      return { handled: false, message: null };
    }

    const pattern = this.pendingQuestion.pattern;
    const normalizedResponse = response.toLowerCase().trim();

    // Try to parse as a number
    const numChoice = parseInt(normalizedResponse);
    if (!isNaN(numChoice) && numChoice > 0 && numChoice <= pattern.options.length) {
      // User selected an option by number
      const selectedOption = pattern.options[numChoice - 1];

      this.waitingForResponse = false;
      this.pendingQuestion = null;

      this.addToHistory('user', `Selected option ${numChoice}: ${selectedOption.label}`, {
        disambiguationType: this.pendingQuestion.disambiguationType,
        selectedOption: numChoice - 1
      });

      if (selectedOption.intent) {
        // Execute the selected intent
        setTimeout(() => {
          nlpHandler.processNaturalLanguage(selectedOption.intent);
        }, 100);

        return {
          handled: true,
          message: `You selected: ${selectedOption.label}`
        };
      } else {
        // User selected cancel
        return {
          handled: true,
          message: 'Operation cancelled.'
        };
      }
    }

    // Try to match by option name
    for (let i = 0; i < pattern.options.length; i++) {
      const option = pattern.options[i];
      if (normalizedResponse.includes(option.label.toLowerCase())) {
        this.waitingForResponse = false;
        this.pendingQuestion = null;

        this.addToHistory('user', `Selected option: ${option.label}`, {
          disambiguationType: this.pendingQuestion.disambiguationType,
          selectedOption: i
        });

        if (option.intent) {
          // Execute the selected intent
          setTimeout(() => {
            nlpHandler.processNaturalLanguage(option.intent);
          }, 100);

          return {
            handled: true,
            message: `You selected: ${option.label}`
          };
        } else {
          // User selected cancel
          return {
            handled: true,
            message: 'Operation cancelled.'
          };
        }
      }
    }

    // If we get here, the response didn't match any option
    return {
      handled: false,
      message: 'Please select one of the options by number or name.'
    };
  }

  /**
   * Process a user input in the context of an ongoing conversation
   */
  processConversationalInput(input, nlpHandler) {
    // First check if we're waiting for a response to a question
    if (this.waitingForResponse && this.pendingQuestion) {
      if (this.pendingQuestion.type === 'followUp') {
        const result = this.processFollowUpResponse(input, nlpHandler);
        if (result.handled) {
          return result;
        }
      } else if (this.pendingQuestion.type === 'disambiguation') {
        const result = this.processDisambiguationResponse(input, nlpHandler);
        if (result.handled) {
          return result;
        }
      }
    }

    // Check for conversational shortcuts
    if (input.toLowerCase().trim() === 'cancel') {
      if (this.waitingForResponse) {
        this.waitingForResponse = false;
        this.pendingQuestion = null;
        this.addToHistory('user', 'Cancel', { action: 'cancel_question' });
        return { handled: true, message: 'Cancelled the current operation.' };
      }
    }

    // Not a direct response to a pending question
    this.addToHistory('user', input);
    return { handled: false, message: null };
  }

  /**
   * Save conversation history to disk
   */
  saveHistory() {
    try {
      const historyDir = path.join(__dirname, '../.conversation');
      if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
      }

      const historyFile = path.join(historyDir, `history-${this.conversationId}.json`);
      fs.writeFileSync(
        historyFile,
        JSON.stringify(
          {
            id: this.conversationId,
            history: this.conversationHistory,
            currentContext: this.currentContext
          },
          null,
          2
        )
      );
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Failed to save conversation history: ${error.message}`));
    }
  }

  /**
   * Load conversation history from disk
   */
  loadHistory(conversationId) {
    try {
      const historyFile = path.join(
        __dirname,
        '../.conversation',
        `history-${conversationId}.json`
      );
      if (fs.existsSync(historyFile)) {
        const data = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        this.conversationId = data.id;
        this.conversationHistory = data.history || [];
        this.currentContext = data.currentContext;
        return true;
      }
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Failed to load conversation history: ${error.message}`));
    }
    return false;
  }

  /**
   * Get the most recent user intent
   */
  getLastIntent() {
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const entry = this.conversationHistory[i];
      if (entry.intent) {
        return entry.intent;
      }
    }
    return null;
  }

  /**
   * Check if we're waiting for a response
   */
  isWaitingForResponse() {
    return this.waitingForResponse;
  }

  /**
   * Check if this input might be a direct response rather than a new command
   */
  mightBeDirectResponse(input) {
    if (!this.waitingForResponse) return false;

    const normalizedInput = input.toLowerCase().trim();

    // Check for yes/no responses
    const yesResponses = ['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', 'true'];
    const noResponses = ['no', 'n', 'nope', 'nah', 'false'];

    if (yesResponses.includes(normalizedInput) || noResponses.includes(normalizedInput)) {
      return true;
    }

    // Check for numeric responses which might be selecting from a list
    if (/^\d+$/.test(normalizedInput)) {
      return true;
    }

    return false;
  }
}

module.exports = ConversationManager;
