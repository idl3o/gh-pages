<<<<<<< Updated upstream
# Web3 Crypto Streaming Service

A decentralized streaming platform that returns control and revenue to creators through blockchain technology.

## About Idl3o

Idl3o is the lead developer of Team MODSIAS, specializing in blockchain integration, distributed systems, and Web3 technologies. With expertise in creating decentralized applications that bridge content creation and cryptocurrency, Idl3o focuses on building equitable platforms that empower creators.

## Project Overview

Web3 Crypto Streaming Service is a revolutionary platform that combines blockchain technology with high-quality media streaming. Our mission is to create a more equitable ecosystem for creators and viewers by:

- Providing creators with 90% of generated revenue
- Ensuring content ownership through blockchain verification
- Enabling direct creator-to-viewer relationships
- Implementing transparent governance through our DAO structure

## Key Features

- **Decentralized Storage Layer**: Content distributed across IPFS for censorship resistance
- **Smart Contract Layer**: Transparent, auditable contracts managing all platform interactions
- **STREAM Token**: Native utility token powering the ecosystem
- **GitHub Integration**: Version control and collaboration tools for content management

## Tech Stack

- Blockchain: Ethereum/Polygon smart contracts
- Storage: IPFS-based content addressing
- Frontend: React/TypeScript progressive web application
- Backend: Node.js with decentralized architecture

## Branch Management

This repository uses multiple branches for different purposes:

- `001` - Main development branch for core functionality
- `temp-check-actions` - Branch for website updates and documentation
- GitHub Pages deployment is handled through a separate remote repository

### Working with Documentation

The smart contract documentation is automatically generated using a GitHub Actions workflow. When changes are made to Solidity files, the documentation is updated and deployed.

To work with documentation:

1. Check out the `temp-check-actions` branch
2. Make your changes to the contracts or documentation
3. Commit and push to trigger the documentation build
4. The site will be available at https://idl3o.github.io/web3-core-functionality/

### Deploying to GitHub Pages

We use a custom deployment process that pushes to a separate gh-pages repository:

```bash
# On Windows
.\deploy-gh-pages.cmd

# On Linux/Mac
./deploy-gh-pages.sh
```

This script builds the static site and deploys it to the separate gh-pages repository.

## Getting Started

Visit our [GitHub Pages site](https://idl3o.github.io/gh-pages) to learn more or join our beta program.

## Contact

- GitHub: [@idl3o](https://github.com/idl3o)
- Twitter/X: [@modsias](https://x.com/modsias)

---

© 2024 Team MODSIAS | Project Demo
=======
# Project RED X

A WebAssembly-powered graphics demo with Claude AI integration, featuring Web3 cryptocurrency streaming elements.

![Project Banner](assets/images/project-banner.png)

## Overview

Project RED X serves as an integration hub between several technological domains:

- **WebAssembly Graphics Engine** - Interactive visual experiences with Claude AI
- **Web3 Cryptocurrency Framework** - Educational platform with token incentives
- **Content Distribution System** - Token-gated content access with creator monetization

## Features

- 🎮 WebAssembly graphics demonstration
- 🧠 Claude AI integration for intelligent rendering
- 📚 Educational platform with crypto token rewards
- 🖼️ Transcendental digital asset generation
- 💰 Web3 crypto streaming capabilities

## Getting Started

### Prerequisites

- Node.js 16.x
- Ruby 3.x (for Jekyll)

### Local Development

1. Clone the repository
   ```
   git clone https://github.com/MODSIAS/red_x.git
   cd red_x
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

## Static Deployment

The project can be deployed as a static site on GitHub Pages. The static version has limited functionality without the Node.js backend.

## Development

For development with automatic reloading:
```
npm run dev
```

## Documentation

- [Whitepaper](whitepaper/web3-streaming-service-whitepaper.md)
- [Announcement Post](_posts/2025-03-25-first.md)

## Contributing

We welcome contributions to improve Project RED X! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
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
>>>>>>> Stashed changes
