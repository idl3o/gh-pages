# Contributing to Web3 Crypto Streaming Service

Thank you for your interest in contributing to our project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in our [Issues](https://github.com/yourusername/gh-pages/issues)
- Use the bug report template when opening a new issue
- Include detailed steps to reproduce the bug
- Include screenshots if applicable
- Describe the expected behavior and what actually happened

### Suggesting Features

- Check if the feature has already been suggested in our [Issues](https://github.com/yourusername/gh-pages/issues)
- Use the feature request template when opening a new issue
- Explain why this feature would be useful to most users
- Be as specific as possible in your description

## Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure URL validation passes (`npm run test && node scripts/url-checker.js`)
5. Run linting (`npm run lint`)
6. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/) format
   ```
   feat: add new token integration feature
   ```
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request against our main branch

## Pull Request Guidelines

- Fill out the PR template completely
- Link to any relevant issues
- Include screenshots for UI changes
- Update documentation as needed
- Add appropriate tests
- Ensure all checks pass
- Keep PRs focused on a single issue or feature

## Coding Standards

- Use consistent indentation (2 spaces)
- Follow our ESLint configuration
- Comment complex code sections
- Write tests for new features and bug fixes
- Use semantic HTML elements
- Make components accessible

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc)
- `refactor:` - Code changes that neither fix bugs nor add features
- `test:` - Adding or updating tests
- `chore:` - Changes to build process or auxiliary tools

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gh-pages.git
cd gh-pages

# Install dependencies
npm install

# Run development server
npm start
```

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

## Questions?

Join our [Discord](https://discord.gg/web3streaming) or open an issue.
