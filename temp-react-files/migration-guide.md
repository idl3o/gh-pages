# Migration Guide: GitHub Pages to Standalone React Application

## Overview
This document outlines the process for migrating components, styles, and functionality from the GitHub Pages project to the new standalone React application. Following this guide will ensure a smooth transition while preserving existing functionality.

## 1. Component Migration Strategy

### Step 1: Identify Key Components
Based on the GitHub Pages repository, these are the key components to migrate:

- **Navigation Component** (`components/Navigation.tsx`)
- **Layout Structure** (Header, Footer, Sidebar)
- **User Authentication** (found in context files)
- **Chain Selector Component** (`red_x/js/components/chain-selector.js`)
- **Theme Controller** (`assets/js/theme-controller.js`) 

### Step 2: Convert to React Components
For each component:
1. Create a corresponding file in the React app under `src/components/`
2. Convert HTML/vanilla JS to React component syntax
3. Ensure all props and state management are handled properly
4. Update event handlers to use React patterns

## 2. Styling Migration

### Step 1: Extract Core Styles
The primary styles to migrate are from:
- `assets/css/main.css` (core styling)
- `assets/css/theme.css` (theming)
- `assets/css/animations.css` (animations and transitions)

### Step 2: Convert to Component Styling
Options:
- **CSS Modules**: Rename files to `ComponentName.module.css` and import in components
- **Styled Components**: Convert CSS to styled-component syntax
- **Tailwind CSS**: If desired, gradually refactor to use Tailwind classes

### Step 3: Theme Implementation
Use React Context to implement the theme switching functionality from `theme-controller.js`

## 3. Functionality Migration

### SDK Integration
1. Import the TypeScript SDK into the React app:
   ```bash
   npm install ../ts
   ```
   Or add as path dependency in package.json:
   ```json
   "dependencies": {
     "prx-sdk": "file:../ts"
   }
   ```

### Smart Contract Interaction 
1. Migrate the chain selector component to React
2. Implement wallet connection using libraries mentioned in the roadmap

### Authentication
1. Review authentication context from backup files
2. Implement auth provider and context in new React app

## 4. Page Structure Migration

Based on the GitHub Pages site, create the following page components:
- Home/Landing Page
- Documentation Pages
- Developer Dashboard
- Creator Dashboard (if relevant)

## 5. API Integration

1. Review the serverless function integration in the original project
2. Create API service files for each endpoint category
3. Implement API hooks using React Query or similar library

## 6. Step-by-Step Migration Workflow

1. Set up basic app structure and routing ✅
2. Migrate core components one by one
3. Implement theming and styling
4. Add authentication and protected routes
5. Integrate SDK and smart contract functionality
6. Implement remaining features from GitHub Pages project

## 7. Testing the Migration

For each migrated component:
1. Create unit tests to verify functionality
2. Compare visual appearance with original
3. Verify all interactions work as expected

## References
- Original GitHub Pages repository: `gh-pages`
- TypeScript SDK: `ts` directory
- Smart Contracts: `contracts` directory
- RED X Backend: `red_x` directory
- Serverless Functions: `netlify/functions` directory