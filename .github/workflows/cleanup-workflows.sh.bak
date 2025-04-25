#!/bin/bash

# This script helps manage GitHub Actions workflows by moving conflicting ones to .disabled-workflows

# Create the disabled workflows directory if it doesn't exist
mkdir -p .disabled-workflows

# Move conflicting workflow files to the disabled directory
for file in *.yml; do
  # Skip our consolidated workflow
  if [ "$file" != "github-pages.yml" ]; then
    echo "Disabling workflow: $file"
    mv "$file" .disabled-workflows/
  fi
done

echo "Workflow cleanup complete. All conflicting workflows have been moved to .disabled-workflows/"
echo "The consolidated github-pages.yml workflow remains active."
```
