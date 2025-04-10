idl3o.com/gh-pages
https://idl3o.github.io/gh-pages/
<header>

<!--
  <<< Author notes: Course header >>>
  Include a 1280×640 image, course title in sentence case, and a concise description in emphasis.
  In your repository settings: enable template repository, add your 1280×640 social image, auto delete head branches.
  Add your open source license, GitHub uses MIT license.
-->

# Web3 Crypto Streaming Service

This repository contains the website for the Web3 Crypto Streaming Service, a decentralized platform for content streaming built on blockchain technology.

## Overview

The Web3 Crypto Streaming Service leverages blockchain technology to create a more equitable, transparent, and efficient content streaming ecosystem. Our platform enables direct creator-to-viewer relationships, fair revenue distribution, and community governance.

## Repository Information

This repository is a combination of our original work and contributions from [idl3o/gh-pages](https://github.com/idl3o/gh-pages), merged to provide an enhanced user experience and additional functionality.

## Key Features

- Decentralized content storage and delivery
- Tokenized economy with the STREAM token
- Smart contract integration for transparent transactions
- User-friendly interfaces for creators and viewers

## Documentation

- [Whitepaper](whitepaper/web3-streaming-service-whitepaper.md)
- [Announcement Post](_posts/2025-03-25-first.md)
- [Repository Merge Guide](REPOSITORY_MERGE_GUIDE.md)

## Development

### Prerequisites

- Git
- Ruby (for Jekyll, if applicable)
- Node.js (if applicable)

### Local Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/gh-pages.git
   cd gh-pages
   ```

2. Install dependencies
   ```
   # For Jekyll sites
   bundle install

   # For Node.js sites
   npm install
   ```

3. Run locally
   ```
   # For Jekyll sites
   bundle exec jekyll serve

   # For Node.js sites
   npm start
   ```

## Contributing

We welcome contributions to improve the Web3 Crypto Streaming Service! Please see our [contribution guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

</header>

<!--
  <<< Author notes: Finish >>>
  Review what we learned, ask for feedback, provide next steps.
-->

## Finish

_Congratulations friend, you've completed this course!_

<img src=https://octodex.github.com/images/constructocat2.jpg alt=celebrate width=300 align=right>

Your blog is now live and has been deployed!

Here's a recap of all the tasks you've accomplished in your repository:

- You enabled GitHub Pages.
- You selected a theme using the config file.
- You learned about proper directory format and file naming conventions in Jekyll.
- You created your first blog post with Jekyll!

### What's next?

- Keep working on your GitHub Pages site... we love seeing what you come up with!
- We'd love to hear what you thought of this course [in our discussion board](https://github.com/orgs/skills/discussions/categories/github-pages).
- [Take another GitHub Skills course](https://github.com/skills).
- [Read the GitHub Getting Started docs](https://docs.github.com/en/get-started).
- To find projects to contribute to, check out [GitHub Explore](https://github.com/explore).

<footer>

<!--
  <<< Author notes: Footer >>>
  Add a link to get support, GitHub status page, code of conduct, license link.
-->

---

Get help: [Post in our discussion board](https://github.com/orgs/skills/discussions/categories/github-pages) &bull; [Review the GitHub status page](https://www.githubstatus.com/)

&copy; 2023 GitHub &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)

</footer>

# Project RED X with Web3 Streaming Integration

This project combines Project RED X (a WebAssembly-powered graphics demo with Claude AI integration) with Web3 Crypto Streaming Service capabilities.

## Implementation Notes

I agree with many of your observations about our codebase structure:

- The modern toolchain setup with ESLint, Prettier, and Husky has been essential for maintaining code quality.
- The VS Code configuration provides strong developer experience, though I recognize the redundancies you identified.
- The mix of technologies (JavaScript/Node.js, WebAssembly, and blockchain tools) reflects our hybrid approach.

### Addressing Your Suggestions

1. **SonarLint Configuration**: You're right about the hardcoded path. I've updated settings to use relative paths instead of absolute ones.

2. **VS Code Settings**: The redundant formatter settings have been consolidated. This was leftover from merging different developer configurations.

3. **Java Configuration**: While we're not actively using Java, we kept this configuration for optional JVM-based components that some team members are testing.

4. **Deployment Scripts**: The GitHub Actions workflow has replaced our shell-based deployment scripts for better cross-platform support.

## Development Roadmap

Moving forward, we plan to:
1. Further modularize the codebase
2. Strengthen the WebAssembly integration
3. Enhance the handshake protocol for partner services
4. Improve test coverage across all components

Thanks for the insightful code review - it's been valuable for identifying areas of improvement!

# Web3 Crypto Streaming Service Documentation

This repository contains the documentation website for the Web3 Crypto Streaming Service.

## Getting Started

To set up this project locally:

1. Clone the repository:
   ```
   git clone https://github.com/idl3o/gh-pages.git
   cd gh-pages
   ```

2. Install dependencies (if using Jekyll):
   ```
   bundle install
   ```

3. Generate placeholder images:
   ```
   node scripts/generate-placeholders.js
   ```

4. Run the site locally (if using Jekyll):
   ```
   bundle exec jekyll serve
   ```

   Or simply open the HTML files in your browser.

## Directory Structure
