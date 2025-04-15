---
layout: default
title: POEBC Emergency Simulator
description: Training environment for Protocol for On-chain Emergency Blockchain Control
permalink: /docs/poebc-simulator/
---

# Emergency Response Simulator

This training simulator helps team members practice responding to blockchain emergencies using the Protocol for On-chain Emergency Blockchain Control (POEBC).

<div class="simulator-container">
  <div class="simulator-header">
    <h2>POEBC Training Simulator</h2>
    <div class="status-indicator" id="systemStatus">STANDBY</div>
  </div>

  <div class="simulator-scenario">
    <h3>Current Scenario</h3>
    <select id="scenarioSelect" class="scenario-select">
      <option value="contract-vulnerability">Smart Contract Vulnerability</option>
      <option value="network-congestion">Network Congestion Event</option>
      <option value="price-oracle-failure">Price Oracle Failure</option>
      <option value="governance-attack">Governance Attack Attempt</option>
      <option value="staking-exploit">Staking Contract Exploit</option>
    </select>
    <button id="loadScenario" class="button primary">Load Scenario</button>
  </div>

  <div class="simulator-timeline">
    <h3>Event Timeline</h3>
    <div class="timeline-display" id="timelineDisplay">
      <p>Select a scenario to begin.</p>
    </div>
  </div>

  <div class="simulator-controls">
    <h3>Emergency Response</h3>
    <div class="auth-section">
      <label for="authLevel">Authorization Level:</label>
      <select id="authLevel">
        <option value="1">L1: Operator</option>
        <option value="3">L3: Technical Lead</option>
        <option value="5">L5: Incident Commander</option>
      </select>
    </div>

    <div class="emergency-actions">
      <h4>Available Actions</h4>
      <div id="actionsList" class="actions-list">
        <p>No actions available. Activate the emergency protocol first.</p>
      </div>
    </div>

    <div class="activation-controls">
      <button id="activateProtocol" class="button danger">Activate Emergency Protocol</button>
      <button id="deactivateProtocol" class="button secondary" disabled>Deactivate Protocol</button>
    </div>
  </div>

  <div class="simulator-output">
    <h3>System Output</h3>
    <div class="console-output" id="consoleOutput">
      > POEBC Simulator initialized
      > System in STANDBY mode
      > Select a scenario and activate the protocol to begin
    </div>
  </div>
</div>

<div class="training-resources">
  <h2>Training Resources</h2>
  <ul>
    <li><a href="{{ '/docs/emergency-protocol' | relative_url }}">Emergency Protocol Documentation</a></li>
    <li><a href="{{ '/docs/contract-security' | relative_url }}">Smart Contract Security Guidelines</a></li>
    <li><a href="{{ '/docs/emergency-contacts' | relative_url }}">Emergency Contact Directory</a></li>
  </ul>
</div>

<script src="{{ '/assets/js/poebc-controller.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/poebc-simulator.js' | relative_url }}" defer></script>

<style>
  .simulator-container {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: var(--border-radius);
    padding: 2rem;
    margin: 2rem 0;
  }
  
  .simulator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 1rem;
  }
  
  .status-indicator {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-family: monospace;
    font-weight: bold;
  }
  
  .status-indicator.standby {
    background-color: #2d3748;
    color: #a0aec0;
  }
  
  .status-indicator.active {
    background-color: #c53030;
    color: white;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  
  .simulator-scenario,
  .simulator-timeline,
  .simulator-controls,
  .simulator-output {
    margin-bottom: 2rem;
    background-color: rgba(0, 0, 0, 0.15);
    border-radius: var(--border-radius);
    padding: 1rem;
  }
  
  .scenario-select {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--light-color);
    border-radius: 4px;
  }
  
  .timeline-display {
    height: 150px;
    overflow-y: auto;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
  }
  
  .auth-section {
    margin-bottom: 1rem;
  }
  
  .auth-section select {
    padding: 0.5rem;
    background-color: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--light-color);
    border-radius: 4px;
  }
  
  .actions-list {
    margin-bottom: 1.5rem;
  }
  
  .action-item {
    background-color: rgba(0, 0, 0, 0.2);
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .action-item .button {
    font-size: 0.9rem;
    padding: 0.25rem 0.75rem;
  }
  
  .button.danger {
    background-color: #c53030;
    color: white;
  }
  
  .button.danger:hover {
    background-color: #9b2c2c;
  }
  
  .console-output {
    height: 200px;
    overflow-y: auto;
    background-color: rgba(0, 0, 0, 0.4);
    padding: 1rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9rem;
    color: #a0aec0;
  }
  
  .training-resources {
    margin-top: 3rem;
  }
</style>
