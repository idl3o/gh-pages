# Essential Packages for React Application

## Already Installed
- react
- react-dom
- react-router-dom (for routing)

## UI and Styling
```bash
npm install styled-components @types/styled-components
```
- styled-components: For component-based styling with CSS-in-JS

## State Management
```bash
npm install @reduxjs/toolkit react-redux
```
- Redux Toolkit: Modern Redux with simplified API
- React Redux: React bindings for Redux

## API and Data Fetching
```bash
npm install axios
```
- Axios: Promise-based HTTP client

## Form Handling
```bash
npm install react-hook-form zod @hookform/resolvers
```
- React Hook Form: Efficient, flexible form validation
- Zod: TypeScript-first schema validation
- @hookform/resolvers: To connect Zod with React Hook Form

## Testing
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```
- Vitest: Testing framework compatible with Vite
- Testing Library: For React component testing
- jsdom: DOM environment for testing

## Development Tools
```bash
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier eslint-plugin-prettier
```
- ESLint: Code linting
- Prettier: Code formatting

## Installation Command
Run this command to install all essential packages at once:

```bash
npm install styled-components @types/styled-components @reduxjs/toolkit react-redux axios react-hook-form zod @hookform/resolvers && npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom eslint eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier eslint-plugin-prettier
```