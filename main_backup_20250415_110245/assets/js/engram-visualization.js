/**
 * Distributed Engram Visualization
 * A visual representation of the distributed engram content architecture
 * that showcases neural network-like connections between content nodes.
 */

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('engramVisualization');
  if (!container) return;
  
  const engramContainer = container.querySelector('.engram-container');
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  
  // Configuration
  const nodeCount = 24;
  const connectionLimit = 5;  // Max connections per node
  const nodesArray = [];
  const connections = [];
  
  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    const node = document.createElement('div');
    node.className = 'engram-node';
    
    // Position nodes in a natural distribution pattern
    let x, y;
    if (i < nodeCount * 0.25) {
      // Core cluster
      x = 30 + Math.random() * 20;
      y = 30 + Math.random() * 20;
    } else if (i < nodeCount * 0.5) {
      // Secondary cluster
      x = 60 + Math.random() * 25;
      y = 60 + Math.random() * 25;
    } else {
      // Peripheral nodes
      x = 15 + Math.random() * 70;
      y = 15 + Math.random() * 70;
    }
    
    // Convert percentage to pixels
    const xPos = (x / 100) * containerWidth;
    const yPos = (y / 100) * containerHeight;
    
    node.style.left = `${xPos}px`;
    node.style.top = `${yPos}px`;
    
    // Size variation
    const size = 8 + Math.random() * 8;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    
    // Color variation - different hues for different content types
    const hue = (i % 5) * 60; // 0, 60, 120, 180, 240 (red, yellow, green, cyan, blue)
    node.style.backgroundColor = `hsla(${hue}, 80%, 60%, 0.8)`;
    
    engramContainer.appendChild(node);
    nodesArray.push({
      element: node,
      x: xPos,
      y: yPos,
      connections: 0,
      active: false
    });
  }
  
  // Create connections between nodes
  for (let i = 0; i < nodesArray.length; i++) {
    const sourceNode = nodesArray[i];
    
    // Sort other nodes by distance
    const otherNodes = [...nodesArray];
    otherNodes.splice(i, 1);
    
    otherNodes.sort((a, b) => {
      const distA = Math.hypot(a.x - sourceNode.x, a.y - sourceNode.y);
      const distB = Math.hypot(b.x - sourceNode.x, b.y - sourceNode.y);
      return distA - distB;
    });
    
    // Connect to closest nodes if connection limit not reached
    for (let j = 0; j < Math.min(connectionLimit, otherNodes.length); j++) {
      if (sourceNode.connections >= connectionLimit) break;
      
      const targetNode = otherNodes[j];
      if (targetNode.connections >= connectionLimit) continue;
      
      // Create connection line
      const connection = document.createElement('div');
      connection.className = 'engram-connection';
      
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      connection.style.width = `${length}px`;
      connection.style.left = `${sourceNode.x}px`;
      connection.style.top = `${sourceNode.y}px`;
      connection.style.transform = `rotate(${angle}deg)`;
      
      engramContainer.appendChild(connection);
      
      connections.push({
        element: connection,
        source: sourceNode,
        target: targetNode
      });
      
      sourceNode.connections++;
      targetNode.connections++;
    }
  }
  
  // Animate engram nodes
  function activateRandomConnections() {
    // Reset all connections
    connections.forEach(conn => {
      conn.element.classList.remove('active');
    });
    
    // Activate random node
    const activeIndex = Math.floor(Math.random() * nodesArray.length);
    const activeNode = nodesArray[activeIndex];
    
    // Find and activate its connections
    connections.forEach(conn => {
      if (conn.source === activeNode || conn.target === activeNode) {
        conn.element.classList.add('active');
      }
    });
    
    // Schedule next activation
    setTimeout(activateRandomConnections, 2000);
  }
  
  // Start animation
  setTimeout(activateRandomConnections, 1000);
  
  // Make nodes interactive
  nodesArray.forEach(node => {
    node.element.addEventListener('mouseover', () => {
      connections.forEach(conn => {
        if (conn.source === node || conn.target === node) {
          conn.element.classList.add('active');
        }
      });
    });
    
    node.element.addEventListener('mouseout', () => {
      connections.forEach(conn => {
        if (conn.source === node || conn.target === node && !conn.element.classList.contains('permanent-active')) {
          conn.element.classList.remove('active');
        }
      });
    });
  });
});
