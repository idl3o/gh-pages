/**
 * Gas Optimization Analysis Tool
 *
 * This script analyzes Solidity contracts for gas optimization opportunities
 * Run with: node analyze-gas-usage.js [path-to-solidity-file]
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Gas optimization patterns to look for
const optimizationPatterns = [
  {
    name: 'Large uint when smaller would suffice',
    pattern: /uint256(?!\s+constant)/g,
    suggestion: 'Consider using uint128, uint64, or smaller if the values will fit.',
    severity: 'medium',
    gasSavings: '~2,000 per transaction'
  },
  {
    name: 'String error messages in require statements',
    pattern: /require\([^,]+,\s*["'][^"']+["']\s*\)/g,
    suggestion: 'Replace with custom errors using "error ErrorName();" and "revert ErrorName();"',
    severity: 'medium',
    gasSavings: '~200 per validation'
  },
  {
    name: 'Unindexed event parameters',
    pattern: /event\s+(\w+)\s*\(([^)]*)\)/g,
    customCheck: match => {
      const eventParams = match[2].split(',');
      const indexedCount = (match[2].match(/indexed/g) || []).length;
      return indexedCount < Math.min(3, eventParams.length) && eventParams.length > 0;
    },
    suggestion:
      'Index up to 3 event parameters (especially IDs and addresses) for efficient off-chain filtering.',
    severity: 'low',
    gasSavings: 'Improves dApp UX'
  },
  {
    name: 'Multiple storage reads of the same variable',
    pattern: /(\w+)\[(\w+)\][^\w\n]+(?:.|[\r\n]){1,50}?\1\[\2\]/g,
    suggestion: 'Cache storage values in memory when reading multiple times.',
    severity: 'high',
    gasSavings: '~2,100 per avoided storage read'
  },
  {
    name: 'Unchecked counter increments',
    pattern: /(for\s*\([^;]+;\s*[^;]+;\s*)(\w+\+\+|\+\+\w+|\w+\s*\+=\s*1)/g,
    suggestion: 'Use unchecked { i++ } for loop counters to save gas.',
    severity: 'medium',
    gasSavings: '~30-60 per operation'
  },
  {
    name: 'Use of address.transfer or address.send',
    pattern: /(\w+)\.(?:transfer|send)\(/g,
    suggestion: 'Use low-level address.call{value: amount}("") with a check on the return value.',
    severity: 'medium',
    gasSavings: 'Prevents contract blocking and is more gas efficient'
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Analyzes a Solidity file for gas optimization opportunities
 */
async function analyzeFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    console.log(`\n${colors.bright}${colors.blue}Analyzing file: ${filePath}${colors.reset}\n`);

    let findings = [];

    // Process each optimization pattern
    optimizationPatterns.forEach(pattern => {
      let matches;
      let matchLines = [];

      if (pattern.customCheck) {
        // For patterns that need custom validation logic
        matches = [...content.matchAll(pattern.pattern)];
        matches = matches.filter(match => pattern.customCheck(match));
      } else {
        // For simple regex patterns
        matches = [...content.matchAll(pattern.pattern)];
      }

      // Find line numbers for each match
      matches.forEach(match => {
        const index = match.index;
        const lineNumber = content.substring(0, index).split('\n').length;

        // Get the actual code snippet
        const lines = content.split('\n');
        const startLine = Math.max(0, lineNumber - 1);
        const endLine = Math.min(lines.length, lineNumber + 1);
        const codeSnippet = lines.slice(startLine, endLine).join('\n');

        matchLines.push({
          lineNumber,
          codeSnippet
        });
      });

      if (matchLines.length > 0) {
        findings.push({
          pattern: pattern.name,
          suggestion: pattern.suggestion,
          matches: matchLines,
          severity: pattern.severity,
          gasSavings: pattern.gasSavings
        });
      }
    });

    // Sort findings by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Print findings
    if (findings.length > 0) {
      console.log(
        `${colors.bright}Found ${findings.length} optimization opportunities:${colors.reset}\n`
      );

      findings.forEach((finding, i) => {
        const severityColor =
          finding.severity === 'high'
            ? colors.red
            : finding.severity === 'medium'
              ? colors.yellow
              : colors.green;

        console.log(`${colors.bright}${i + 1}. ${finding.pattern}${colors.reset}`);
        console.log(`   Severity: ${severityColor}${finding.severity}${colors.reset}`);
        console.log(`   Gas Savings: ${colors.green}${finding.gasSavings}${colors.reset}`);
        console.log(`   Suggestion: ${finding.suggestion}`);
        console.log(`   Occurrences: ${finding.matches.length}`);

        // Print first 2 occurrences as examples
        const examplesToShow = Math.min(2, finding.matches.length);
        for (let j = 0; j < examplesToShow; j++) {
          const match = finding.matches[j];
          console.log(
            `   Line ${match.lineNumber}: ${colors.magenta}${match.codeSnippet.trim()}${colors.reset}`
          );
        }
        console.log();
      });

      // Generate report summary
      const highSeverity = findings.filter(f => f.severity === 'high').length;
      const mediumSeverity = findings.filter(f => f.severity === 'medium').length;
      const lowSeverity = findings.filter(f => f.severity === 'low').length;

      console.log(`${colors.bright}Summary:${colors.reset}`);
      console.log(`${colors.red}High Severity: ${highSeverity}${colors.reset}`);
      console.log(`${colors.yellow}Medium Severity: ${mediumSeverity}${colors.reset}`);
      console.log(`${colors.green}Low Severity: ${lowSeverity}${colors.reset}`);

      // Save findings to a report file
      await generateReport(filePath, findings);
    } else {
      console.log(`${colors.green}✓ No gas optimization issues found.${colors.reset}`);
    }
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }
}

/**
 * Generate HTML report for the findings
 */
async function generateReport(filePath, findings) {
  const fileName = path.basename(filePath);
  const reportFileName = `${fileName.replace('.sol', '')}_gas_report.html`;
  const reportPath = path.join(path.dirname(filePath), reportFileName);

  // Calculate estimated gas savings
  let totalEstimatedSavings = 0;
  findings.forEach(finding => {
    const matches = finding.matches.length;
    const savingsMatch = finding.gasSavings.match(/~?(\d+(?:,\d+)*)/);
    if (savingsMatch) {
      const value = parseInt(savingsMatch[1].replace(/,/g, ''));
      if (!isNaN(value)) {
        totalEstimatedSavings += value * matches;
      }
    }
  });

  const reportContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Gas Optimization Report - ${fileName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .high { color: #d9534f; }
    .medium { color: #f0ad4e; }
    .low { color: #5cb85c; }
    .savings { color: #5cb85c; font-weight: bold; }
    .suggestion { background-color: #f8f9fa; padding: 10px; border-left: 4px solid #0066cc; }
    .code {
      font-family: 'Courier New', Courier, monospace;
      background-color: #f8f9fa;
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      background-color: #e9ecef;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .summary-item {
      text-align: center;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Gas Optimization Report</h1>
    <div>
      <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>File:</strong> ${fileName}</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <h3>High Severity</h3>
      <p class="high">${findings.filter(f => f.severity === 'high').length}</p>
    </div>
    <div class="summary-item">
      <h3>Medium Severity</h3>
      <p class="medium">${findings.filter(f => f.severity === 'medium').length}</p>
    </div>
    <div class="summary-item">
      <h3>Low Severity</h3>
      <p class="low">${findings.filter(f => f.severity === 'low').length}</p>
    </div>
    <div class="summary-item">
      <h3>Est. Gas Savings</h3>
      <p class="savings">~${totalEstimatedSavings.toLocaleString()}</p>
    </div>
  </div>

  <h2>Optimization Opportunities</h2>

  <table>
    <tr>
      <th>Issue</th>
      <th>Severity</th>
      <th>Occurrences</th>
      <th>Gas Savings</th>
    </tr>
    ${findings
      .map(
        finding => `
    <tr>
      <td>${finding.pattern}</td>
      <td class="${finding.severity}">${finding.severity.toUpperCase()}</td>
      <td>${finding.matches.length}</td>
      <td>${finding.gasSavings}</td>
    </tr>
    `
      )
      .join('')}
  </table>

  <h2>Detailed Findings</h2>

  ${findings
    .map(
      (finding, i) => `
  <div>
    <h3>${i + 1}. ${finding.pattern}</h3>
    <p><strong>Severity:</strong> <span class="${finding.severity}">${finding.severity.toUpperCase()}</span></p>
    <p><strong>Gas Savings:</strong> <span class="savings">${finding.gasSavings}</span></p>
    <p><strong>Occurrences:</strong> ${finding.matches.length}</p>

    <div class="suggestion">
      <p><strong>Suggestion:</strong> ${finding.suggestion}</p>
    </div>

    <h4>Examples:</h4>
    ${finding.matches
      .slice(0, 3)
      .map(
        match => `
      <p>Line ${match.lineNumber}:</p>
      <pre class="code">${match.codeSnippet.trim()}</pre>
    `
      )
      .join('')}
    ${finding.matches.length > 3 ? `<p>...and ${finding.matches.length - 3} more occurrences</p>` : ''}
  </div>
  `
    )
    .join('')}

</body>
</html>
  `;

  await writeFile(reportPath, reportContent);
  console.log(`\n${colors.green}Report generated: ${reportPath}${colors.reset}`);
}

/**
 * Scans a directory for Solidity files
 */
async function scanDirectory(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);
    const solFiles = files.filter(file => file.endsWith('.sol'));

    if (solFiles.length === 0) {
      console.log(`${colors.yellow}No Solidity files found in ${directoryPath}${colors.reset}`);
      return;
    }

    console.log(
      `${colors.bright}Found ${solFiles.length} Solidity files in ${directoryPath}${colors.reset}`
    );

    for (const file of solFiles) {
      const filePath = path.join(directoryPath, file);
      await analyzeFile(filePath);
    }
  } catch (error) {
    console.error(`Error scanning directory ${directoryPath}:`, error);
  }
}

// Main execution
(async () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default to current directory if no path is provided
    console.log(
      `${colors.yellow}No path specified, analyzing Solidity files in current directory.${colors.reset}`
    );
    await scanDirectory(process.cwd());
  } else {
    const targetPath = args[0];

    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);

      if (stats.isDirectory()) {
        await scanDirectory(targetPath);
      } else if (targetPath.endsWith('.sol')) {
        await analyzeFile(targetPath);
      } else {
        console.log(`${colors.red}${targetPath} is not a Solidity file.${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}Path does not exist: ${targetPath}${colors.reset}`);
    }
  }

  console.log(`\n${colors.blue}${colors.bright}Gas optimization analysis complete.${colors.reset}`);
})();
