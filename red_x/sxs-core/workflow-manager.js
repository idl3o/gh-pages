/**
 * Workflow Manager for SxS CLI
 * Handles multi-step operations and task workflows
 * Created: April 26, 2025
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Manages workflows and multi-step operations
 */
class WorkflowManager {
  constructor(taskRunner) {
    this.taskRunner = taskRunner;
    this.activeWorkflow = null;
    this.workflowHistory = [];
    this.workflowStates = {};

    // Define common workflows
    this.workflows = {
      build_and_serve: {
        name: 'Build and serve web version',
        steps: [
          { intent: 'build_web', required: true },
          { intent: 'start_server', required: true }
        ]
      },
      full_deploy: {
        name: 'Build and deploy to GitHub Pages',
        steps: [
          { intent: 'build_web', required: true },
          { intent: 'deploy_project', required: true }
        ]
      },
      switch_and_document: {
        name: 'Switch to docs branch and generate documentation',
        steps: [
          { intent: 'switch_to_docs', required: true },
          { intent: 'generate_docs', required: true }
        ]
      },
      clean_and_rebuild: {
        name: 'Clean and rebuild the project',
        steps: [
          { intent: 'clean_project', required: true },
          { intent: 'build_web', required: true }
        ]
      },
      setup_and_build: {
        name: 'Setup environment and build project',
        steps: [
          { intent: 'setup_environment', required: true },
          { intent: 'build_web', required: false }
        ]
      }
    };
  }

  /**
   * Identify if a command contains a multi-step workflow intent
   */
  identifyWorkflow(text) {
    // Look for conjunction patterns that indicate a sequence
    const sequencePatterns = [
      /\b(and then|and|then|after that|followed by)\b/i,
      /\bfirst\b.*\bthen\b/i,
      /\bbefore\b.*\bafter\b/i
    ];

    // Check for explicit workflow patterns
    const workflowPatterns = {
      build_and_serve: [
        /\b(build|make|compile).*\b(and|then).*\b(start|launch|run).*\b(server|preview)/i,
        /\b(start|launch|run).*\b(server|preview).*\b(after|once|when).*\b(build|compile)/i
      ],
      full_deploy: [
        /\b(build|make|compile).*\b(and|then).*\b(deploy|publish)/i,
        /\b(deploy|publish).*\b(after|once|when).*\b(build|compile)/i
      ],
      switch_and_document: [
        /\b(switch|checkout|change).*\b(docs|documentation).*\b(and|then).*\b(generate|create)/i
      ],
      clean_and_rebuild: [
        /\b(clean|clear).*\b(and|then).*\b(build|rebuild|make)/i,
        /\b(rebuild|build).*\b(after|once|when).*\b(clean|clear)/i
      ],
      setup_and_build: [
        /\b(setup|install|configure).*\b(and|then).*\b(build|make)/i,
        /\b(build|make).*\b(after|once|when).*\b(setup|install|configure)/i
      ]
    };

    // First check specific workflow patterns
    for (const [workflow, patterns] of Object.entries(workflowPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return workflow;
        }
      }
    }

    // If no specific workflow matched, check for generic sequence patterns
    for (const pattern of sequencePatterns) {
      if (pattern.test(text)) {
        // This might be a custom workflow, extract the sequence
        return this.extractCustomWorkflow(text);
      }
    }

    return null;
  }

  /**
   * Extract a custom workflow from natural language
   */
  extractCustomWorkflow(text) {
    // Extract steps using conjunction splits
    const splitPatterns = [
      /\band then\b/i,
      /\band\b/i,
      /\bthen\b/i,
      /\bafter that\b/i,
      /\bfollowed by\b/i
    ];

    let steps = [text]; // Default is the whole text as one step

    // Try to split the text by each pattern
    for (const pattern of splitPatterns) {
      if (pattern.test(text)) {
        steps = text.split(pattern).map(step => step.trim());
        break;
      }
    }

    // If we found multiple steps, create a custom workflow
    if (steps.length > 1) {
      const workflowName = `custom_workflow_${Date.now()}`;

      this.workflows[workflowName] = {
        name: `Custom workflow: ${steps.join(' → ')}`,
        steps: steps.map(step => ({ intent: step, required: true, isRawText: true })),
        isCustom: true
      };

      return workflowName;
    }

    return null;
  }

  /**
   * Start a workflow by name
   */
  async startWorkflow(workflowName, nlpHandler, options = {}) {
    const workflow = this.workflows[workflowName];
    if (!workflow) {
      console.error(chalk.red(`❌ Workflow '${workflowName}' not found`));
      return false;
    }

    console.log(chalk.cyan(`🔄 Starting workflow: ${workflow.name}`));

    this.activeWorkflow = {
      name: workflowName,
      startTime: Date.now(),
      currentStep: 0,
      steps: workflow.steps,
      options: options,
      results: []
    };

    // Save the workflow state to disk for recovery
    this.saveWorkflowState();

    // Execute the workflow
    return await this.continueWorkflow(nlpHandler);
  }

  /**
   * Continue the active workflow
   */
  async continueWorkflow(nlpHandler) {
    if (!this.activeWorkflow) {
      return false;
    }

    const workflow = this.activeWorkflow;
    const { steps, currentStep, options } = workflow;

    // Check if we've completed all steps
    if (currentStep >= steps.length) {
      return this.completeWorkflow(true);
    }

    // Get the current step
    const step = steps[currentStep];
    console.log(chalk.cyan(`🔄 Workflow step ${currentStep + 1}/${steps.length}: ${step.intent}`));

    try {
      let success = false;

      // Handle raw text for custom workflows
      if (step.isRawText) {
        // Process this step as natural language
        success = await nlpHandler.processNaturalLanguage(step.intent);
      } else {
        // Use the task runner to execute the mapped task
        const taskMappings = this.taskRunner.getTaskMappings();
        const taskName = taskMappings[step.intent];

        if (taskName) {
          success = await this.taskRunner.runTask(taskName, options);
        } else {
          // Try to execute as an intent through the NLP handler
          success = await nlpHandler.processNaturalLanguage(step.intent);
        }
      }

      // Record the result
      workflow.results.push({
        step: currentStep,
        intent: step.intent,
        success: success,
        timestamp: Date.now()
      });

      // If the step failed and was required, stop the workflow
      if (!success && step.required) {
        console.error(chalk.red(`❌ Required workflow step failed: ${step.intent}`));
        return this.completeWorkflow(false);
      }

      // Move to the next step
      workflow.currentStep++;
      this.saveWorkflowState();

      // Continue with the next step
      return await this.continueWorkflow(nlpHandler);
    } catch (error) {
      console.error(chalk.red(`❌ Error in workflow step: ${error.message}`));

      // If the step was required, stop the workflow
      if (step.required) {
        return this.completeWorkflow(false);
      }

      // Otherwise, move to the next step
      workflow.currentStep++;
      this.saveWorkflowState();

      return await this.continueWorkflow(nlpHandler);
    }
  }

  /**
   * Complete the active workflow
   */
  completeWorkflow(success) {
    if (!this.activeWorkflow) {
      return false;
    }

    const workflow = this.activeWorkflow;
    const duration = Date.now() - workflow.startTime;

    if (success) {
      console.log(
        chalk.green(`✅ Workflow completed successfully: ${this.workflows[workflow.name].name}`)
      );
      console.log(chalk.gray(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`));
    } else {
      console.error(chalk.red(`❌ Workflow failed: ${this.workflows[workflow.name].name}`));
    }

    // Add to history
    this.workflowHistory.push({
      ...workflow,
      endTime: Date.now(),
      success: success
    });

    // Limit history size
    if (this.workflowHistory.length > 10) {
      this.workflowHistory.shift();
    }

    // Clear active workflow
    this.activeWorkflow = null;
    this.clearWorkflowState();

    return success;
  }

  /**
   * Save workflow state to disk for recovery
   */
  saveWorkflowState() {
    if (!this.activeWorkflow) return;

    try {
      const stateDir = path.join(__dirname, '../.workflow');
      if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
      }

      const stateFile = path.join(stateDir, 'active-workflow.json');
      fs.writeFileSync(stateFile, JSON.stringify(this.activeWorkflow, null, 2));
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Failed to save workflow state: ${error.message}`));
    }
  }

  /**
   * Clear workflow state from disk
   */
  clearWorkflowState() {
    try {
      const stateFile = path.join(__dirname, '../.workflow/active-workflow.json');
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Failed to clear workflow state: ${error.message}`));
    }
  }

  /**
   * Load workflow state from disk
   */
  loadWorkflowState() {
    try {
      const stateFile = path.join(__dirname, '../.workflow/active-workflow.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.activeWorkflow = state;
        return true;
      }
    } catch (error) {
      console.error(chalk.yellow(`⚠️ Failed to load workflow state: ${error.message}`));
    }
    return false;
  }

  /**
   * Get the active workflow
   */
  getActiveWorkflow() {
    return this.activeWorkflow;
  }

  /**
   * Get workflow history
   */
  getWorkflowHistory() {
    return this.workflowHistory;
  }

  /**
   * Check if a workflow is currently active
   */
  isWorkflowActive() {
    return !!this.activeWorkflow;
  }
}

module.exports = WorkflowManager;
