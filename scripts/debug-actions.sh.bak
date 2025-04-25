#!/bin/bash
# GitHub Actions Workflow Debugging Utility for Web3 Crypto Streaming Service
# This script helps diagnose common issues with GitHub Actions workflows

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

# Path definitions
WORKFLOWS_DIR=".github/workflows"
REPORTS_DIR="action-reports"

# Print header
echo -e "${BLUE}====================================================${RESET}"
echo -e "${BLUE}   GitHub Actions Workflow Debugging Utility        ${RESET}"
echo -e "${BLUE}====================================================${RESET}"
echo ""

# Check if we're in the repo root
if [ ! -d "$WORKFLOWS_DIR" ]; then
  echo -e "${RED}Error: Cannot find .github/workflows directory.${RESET}"
  echo "Please run this script from the root of your repository."
  exit 1
fi

# Create reports directory if it doesn't exist
mkdir -p "$REPORTS_DIR"

# Function to analyze a workflow file
analyze_workflow() {
  local workflow_file="$1"
  local workflow_name=$(grep "name:" "$workflow_file" | head -n 1 | sed 's/name: //')
  local triggers=$(grep -A 5 "on:" "$workflow_file")

  echo -e "${BLUE}Analyzing: ${YELLOW}$workflow_name${RESET} ($workflow_file)"

  # Look for common issues
  local issues=0

  # Check for duplicate workflow trigger conditions
  if grep -q "push:" "$workflow_file" && grep -q "branches: \[ main \]" "$workflow_file"; then
    echo -e "  ${RED}⚠️ Workflow triggers on push to main branch (potential conflict with other workflows)${RESET}"
    ((issues++))
  fi

  # Check for incomplete permissions
  if ! grep -q "permissions:" "$workflow_file"; then
    echo -e "  ${YELLOW}⚠️ No explicit permissions defined - may cause token permission issues${RESET}"
    ((issues++))
  fi

  # Check for missing continue-on-error for non-critical steps
  if grep -q "npm " "$workflow_file" && ! grep -q "continue-on-error:" "$workflow_file"; then
    echo -e "  ${YELLOW}⚠️ NPM commands without continue-on-error may cause workflow failures${RESET}"
    ((issues++))
  fi

  # Check for missing step IDs (needed for conditional steps)
  if grep -q "steps:" "$workflow_file" && ! grep -q "id:" "$workflow_file"; then
    echo -e "  ${YELLOW}⚠️ Steps without IDs - harder to reference in conditional logic${RESET}"
    ((issues++))
  fi

  # Check for GitHub Pages deployment without proper outputs
  if grep -q "JamesIves/github-pages-deploy-action" "$workflow_file" && ! grep -q "id: deploy" "$workflow_file"; then
    echo -e "  ${YELLOW}⚠️ GitHub Pages deploy action without ID - cannot reference status later${RESET}"
    ((issues++))
  fi

  if [ $issues -eq 0 ]; then
    echo -e "  ${GREEN}✅ No common issues detected${RESET}"
  else
    echo -e "  ${RED}Found $issues potential issue(s)${RESET}"
  fi

  echo ""

  # Add to report
  echo "## $workflow_name ($workflow_file)" >> "$REPORTS_DIR/workflow-analysis.md"
  echo "**Triggers:**" >> "$REPORTS_DIR/workflow-analysis.md"
  echo '```yaml' >> "$REPORTS_DIR/workflow-analysis.md"
  echo "$triggers" >> "$REPORTS_DIR/workflow-analysis.md"
  echo '```' >> "$REPORTS_DIR/workflow-analysis.md"
  echo "**Potential Issues:** $issues" >> "$REPORTS_DIR/workflow-analysis.md"
  echo "" >> "$REPORTS_DIR/workflow-analysis.md"
}

# Check if GitHub CLI is available for advanced troubleshooting
have_gh_cli=false
if command -v gh &> /dev/null; then
  have_gh_cli=true
  echo -e "${GREEN}GitHub CLI detected - enhanced diagnostics available${RESET}"

  # Check if authenticated
  if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI not authenticated - run 'gh auth login' for enhanced diagnostics${RESET}"
    have_gh_cli=false
  fi
else
  echo -e "${YELLOW}GitHub CLI not found - install it for enhanced diagnostics${RESET}"
fi

# Initialize report
echo "# GitHub Actions Workflow Analysis" > "$REPORTS_DIR/workflow-analysis.md"
echo "Generated on: $(date)" >> "$REPORTS_DIR/workflow-analysis.md"
echo "" >> "$REPORTS_DIR/workflow-analysis.md"

# Analyze each workflow file
echo -e "${BLUE}Scanning workflow files...${RESET}"
for workflow in $WORKFLOWS_DIR/*.yml; do
  analyze_workflow "$workflow"
done

# Check for potential workflow conflicts
echo -e "${BLUE}Checking for workflow conflicts...${RESET}"
main_workflows=$(grep -l "branches: \[ main \]" $WORKFLOWS_DIR/*.yml | wc -l)
if [ $main_workflows -gt 1 ]; then
  echo -e "${RED}⚠️ Multiple workflows ($main_workflows) trigger on main branch - potential conflicts${RESET}"
  echo -e "   Consider consolidating workflows or using different trigger conditions"
else
  echo -e "${GREEN}✓ No conflict detected in main branch triggers${RESET}"
fi

# Check for GitHub Pages settings if GitHub CLI is available
if $have_gh_cli; then
  echo -e "${BLUE}Checking GitHub Pages settings...${RESET}"
  repo_name=$(basename $(git config --get remote.origin.url) .git)
  repo_owner=$(git config --get remote.origin.url | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')

  if [ -n "$repo_owner" ] && [ -n "$repo_name" ]; then
    pages_info=$(gh api repos/$repo_owner/$repo_name/pages 2>/dev/null || echo '{"source":{"branch":"unknown"}}')
    pages_branch=$(echo $pages_info | grep -o '"branch":"[^"]*"' | sed 's/"branch":"//;s/"//')

    echo -e "GitHub Pages deployment source: ${YELLOW}$pages_branch${RESET}"

    # Check if deployment workflows match the GitHub Pages settings
    if [ "$pages_branch" != "gh-pages" ] && grep -q "branch: gh-pages" $WORKFLOWS_DIR/*.yml; then
      echo -e "${RED}⚠️ Workflow deploys to 'gh-pages' but GitHub Pages is configured to use '$pages_branch'${RESET}"
    else
      echo -e "${GREEN}✓ Workflow deployment branch matches GitHub Pages settings${RESET}"
    fi
  else
    echo -e "${YELLOW}Could not determine repository information for GitHub Pages check${RESET}"
  fi
fi

echo ""
echo -e "${BLUE}====================================================${RESET}"
echo -e "${GREEN}Analysis complete!${RESET}"
echo -e "Report saved to: ${YELLOW}$REPORTS_DIR/workflow-analysis.md${RESET}"
echo -e "${BLUE}====================================================${RESET}"

exit 0
