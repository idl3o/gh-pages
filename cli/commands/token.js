/**
 * Token Commands
 *
 * Commands for token management, generation and deployment
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const { Spinner } = require('../utils/ui-helpers');

/**
 * Register token commands
 * @param {object} program Commander program instance
 */
function registerTokenCommands(program) {
  const token = program.command('token').description('Token management commands');

  token
    .command('create')
    .description('Create a new token contract')
    .option('--erc20', 'Create ERC-20 token', false)
    .option('--erc721', 'Create ERC-721 NFT token', false)
    .option('--erc1155', 'Create ERC-1155 multi-token', false)
    .action(async options => {
      console.log(chalk.cyan('🪙 Token Generator'));

      // Check if blockchain project exists
      const blockchainDir = path.join(process.cwd(), 'blockchain');
      if (!fs.existsSync(blockchainDir)) {
        console.log(chalk.red('❌ Blockchain project not found.'));
        console.log(
          chalk.yellow('Run `sxs blockchain init` first to create a blockchain project.')
        );
        return;
      }

      // Detect framework
      let framework = '';
      if (fs.existsSync(path.join(blockchainDir, 'hardhat.config.js'))) {
        framework = 'hardhat';
      } else if (fs.existsSync(path.join(blockchainDir, 'truffle-config.js'))) {
        framework = 'truffle';
      } else if (fs.existsSync(path.join(blockchainDir, 'foundry.toml'))) {
        framework = 'foundry';
      }

      if (!framework) {
        console.log(chalk.red('❌ Could not determine blockchain framework.'));
        console.log(chalk.yellow('Make sure you have initialized the project correctly.'));
        return;
      }

      // Determine token type, ask if not specified
      let tokenType = '';

      if (options.erc20) tokenType = 'erc20';
      else if (options.erc721) tokenType = 'erc721';
      else if (options.erc1155) tokenType = 'erc1155';
      else {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'tokenType',
            message: 'Select token type:',
            choices: [
              { name: 'ERC-20 Fungible Token', value: 'erc20' },
              { name: 'ERC-721 NFT (Non-Fungible Token)', value: 'erc721' },
              { name: 'ERC-1155 Multi-Token', value: 'erc1155' }
            ],
            default: 'erc20'
          }
        ]);

        tokenType = answers.tokenType;
      }

      // Get token details
      const questions = [
        {
          type: 'input',
          name: 'name',
          message: 'Token name:',
          default: 'StreamChain Token'
        },
        {
          type: 'input',
          name: 'symbol',
          message: 'Token symbol:',
          default: 'STRM'
        }
      ];

      // Add specific questions based on token type
      if (tokenType === 'erc20') {
        questions.push({
          type: 'input',
          name: 'totalSupply',
          message: 'Total supply (tokens):',
          default: '100000000',
          validate: input => {
            if (isNaN(input) || parseInt(input) <= 0) {
              return 'Please enter a valid number';
            }
            return true;
          },
          filter: input => input.trim()
        });

        questions.push({
          type: 'input',
          name: 'decimals',
          message: 'Decimals:',
          default: '18',
          validate: input => {
            if (isNaN(input) || parseInt(input) < 0 || parseInt(input) > 18) {
              return 'Please enter a valid number between 0 and 18';
            }
            return true;
          }
        });

        questions.push({
          type: 'confirm',
          name: 'mintable',
          message: 'Make token mintable?',
          default: true
        });

        questions.push({
          type: 'confirm',
          name: 'burnable',
          message: 'Make token burnable?',
          default: true
        });

        questions.push({
          type: 'confirm',
          name: 'pausable',
          message: 'Make token pausable?',
          default: false
        });
      } else if (tokenType === 'erc721') {
        questions.push({
          type: 'input',
          name: 'baseUri',
          message: 'Base URI for token metadata:',
          default: 'https://streamchain-metadata.example.com/'
        });

        questions.push({
          type: 'confirm',
          name: 'enumerable',
          message: 'Make NFTs enumerable?',
          default: true
        });

        questions.push({
          type: 'confirm',
          name: 'autoIncrement',
          message: 'Auto-increment token IDs?',
          default: true
        });

        questions.push({
          type: 'confirm',
          name: 'burnable',
          message: 'Make NFTs burnable?',
          default: false
        });
      } else if (tokenType === 'erc1155') {
        questions.push({
          type: 'input',
          name: 'baseUri',
          message: 'Base URI for token metadata:',
          default: 'https://streamchain-metadata.example.com/{id}'
        });

        questions.push({
          type: 'confirm',
          name: 'burnable',
          message: 'Make tokens burnable?',
          default: true
        });
      }

      // Ask additional common questions
      questions.push({
        type: 'confirm',
        name: 'accessControl',
        message: 'Add role-based access control?',
        default: true
      });

      const tokenDetails = await inquirer.prompt(questions);

      const spinner = new Spinner('Generating token contract...').start();

      try {
        // Ensure @openzeppelin/contracts is installed
        spinner.setText('Checking dependencies...');

        try {
          fs.accessSync(path.join(blockchainDir, 'node_modules', '@openzeppelin'));
        } catch (error) {
          spinner.setText('Installing OpenZeppelin contracts...');
          process.chdir(blockchainDir);
          execSync('npm install --save-dev @openzeppelin/contracts', { stdio: 'ignore' });
        }

        // Determine where to place the contract file
        let contractsDir;
        if (framework === 'hardhat' || framework === 'truffle') {
          contractsDir = path.join(blockchainDir, 'contracts');
        } else {
          // foundry
          contractsDir = path.join(blockchainDir, 'src');
        }

        if (!fs.existsSync(contractsDir)) {
          fs.mkdirSync(contractsDir, { recursive: true });
        }

        // Generate contract based on token type
        const contractName = tokenDetails.name.replace(/\s+/g, '');
        const contractFileName = `${contractName}.sol`;
        const contractPath = path.join(contractsDir, contractFileName);

        // Generate contract content based on token type and options
        let contractContent = '';

        if (tokenType === 'erc20') {
          contractContent = generateERC20Contract(contractName, tokenDetails);
        } else if (tokenType === 'erc721') {
          contractContent = generateERC721Contract(contractName, tokenDetails);
        } else if (tokenType === 'erc1155') {
          contractContent = generateERC1155Contract(contractName, tokenDetails);
        }

        // Write contract file
        fs.writeFileSync(contractPath, contractContent);

        spinner.succeed(`Token contract created at ${contractPath}`);

        // Create deploy script
        spinner.start('Creating deployment script...');

        const scriptsDir = path.join(blockchainDir, framework === 'foundry' ? 'script' : 'scripts');
        if (!fs.existsSync(scriptsDir)) {
          fs.mkdirSync(scriptsDir, { recursive: true });
        }

        const deployScriptPath = path.join(
          scriptsDir,
          `deploy${contractName}.${framework === 'foundry' ? 'sol' : 'js'}`
        );

        let deployScript = '';

        if (framework === 'hardhat') {
          deployScript = `
const hre = require("hardhat");

async function main() {
  console.log("Deploying ${contractName} token...");

  const ${contractName}Factory = await hre.ethers.getContractFactory("${contractName}");
  const ${contractName.toLowerCase()} = await ${contractName}Factory.deploy();

  await ${contractName.toLowerCase()}.deployed();

  console.log("${contractName} token deployed to:", ${contractName.toLowerCase()}.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
        } else if (framework === 'truffle') {
          deployScript = `
const ${contractName} = artifacts.require("${contractName}");

module.exports = function(deployer) {
  deployer.deploy(${contractName});
};
`;
        } else if (framework === 'foundry') {
          // Foundry uses Solidity for deploy scripts
          deployScript = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/${contractName}.sol";

contract Deploy${contractName}Script is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ${contractName} token = new ${contractName}();

        vm.stopBroadcast();

        console.log("${contractName} deployed at:", address(token));
    }
}
`;
        }

        fs.writeFileSync(deployScriptPath, deployScript.trim());

        spinner.succeed('Deployment script created');

        console.log(chalk.green('\n✅ Token contract created successfully!'));
        console.log(chalk.cyan('\nNext steps:'));
        console.log(chalk.white('1. Review and customize your token contract if needed'));

        if (framework === 'hardhat') {
          console.log(
            chalk.white(`2. Deploy with: sxs blockchain deploy --contract ${contractName}`)
          );
        } else if (framework === 'truffle') {
          console.log(
            chalk.white(`2. Deploy with: npx truffle migrate --f deploy${contractName}.js`)
          );
        } else if (framework === 'foundry') {
          console.log(
            chalk.white(
              `2. Deploy with: forge script script/deploy${contractName}.sol:Deploy${contractName}Script --broadcast`
            )
          );
        }
      } catch (error) {
        spinner.fail(`Failed to create token contract: ${error.message}`);
      }
    });

  token
    .command('info')
    .description('Get token contract information')
    .argument('<address>', 'Token contract address')
    .option('-n, --network <network>', 'Network', 'sepolia')
    .action(async (address, options) => {
      const spinner = new Spinner(`Fetching information for token at ${address}...`).start();

      try {
        // Check if address is valid
        if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
          spinner.fail('Invalid contract address');
          return;
        }

        // Create temporary script to get token info using ethers.js
        const scriptDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(scriptDir)) {
          fs.mkdirSync(scriptDir, { recursive: true });
        }

        const scriptPath = path.join(scriptDir, 'get-token-info.js');

        // Get network RPC URL
        let rpcUrl;
        if (options.network === 'mainnet') {
          rpcUrl = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'; // Public Infura key
        } else if (options.network === 'sepolia') {
          rpcUrl = 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
        } else if (options.network === 'goerli') {
          rpcUrl = 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
        } else if (options.network === 'polygon') {
          rpcUrl = 'https://polygon-rpc.com';
        } else if (options.network === 'mumbai') {
          rpcUrl = 'https://rpc-mumbai.maticvigil.com';
        } else {
          rpcUrl = 'http://localhost:8545';
        }

        const scriptContent = `
const { ethers } = require('ethers');

// ABI fragments for common token interfaces
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
  'function tokenURI(uint256) view returns (string)',
  'function ownerOf(uint256) view returns (address)'
];

const ERC1155_ABI = [
  'function uri(uint256) view returns (string)',
  'function balanceOf(address, uint256) view returns (uint256)',
  'function balanceOfBatch(address[], uint256[]) view returns (uint256[])'
];

async function getTokenInfo() {
  try {
    const provider = new ethers.JsonRpcProvider('${rpcUrl}');
    const address = '${address}';
    let tokenInfo = {
      address,
      type: 'unknown',
      network: '${options.network}'
    };

    // Try as ERC20
    try {
      const erc20 = new ethers.Contract(address, ERC20_ABI, provider);
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        erc20.name(),
        erc20.symbol(),
        erc20.decimals(),
        erc20.totalSupply()
      ]);

      tokenInfo = {
        ...tokenInfo,
        type: 'ERC20',
        name,
        symbol,
        decimals: decimals.toString(),
        totalSupply: ethers.formatUnits(totalSupply, decimals)
      };

      console.log(JSON.stringify(tokenInfo, null, 2));
      return;
    } catch (e) {
      // Not ERC20 or error occurred
    }

    // Try as ERC721
    try {
      const erc721 = new ethers.Contract(address, ERC721_ABI, provider);
      const [name, symbol] = await Promise.all([
        erc721.name(),
        erc721.symbol()
      ]);

      tokenInfo = {
        ...tokenInfo,
        type: 'ERC721',
        name,
        symbol
      };

      // Try to get a token URI if possible
      try {
        const tokenURI = await erc721.tokenURI(1);
        tokenInfo.sampleTokenURI = tokenURI;
      } catch (e) {
        // Cannot get token URI
      }

      console.log(JSON.stringify(tokenInfo, null, 2));
      return;
    } catch (e) {
      // Not ERC721 or error occurred
    }

    // Try as ERC1155
    try {
      const erc1155 = new ethers.Contract(address, ERC1155_ABI, provider);

      // Try to get URI for token ID 0
      try {
        const uri = await erc1155.uri(0);
        tokenInfo = {
          ...tokenInfo,
          type: 'ERC1155',
          uri
        };
      } catch (e) {
        // Cannot get URI
        tokenInfo = {
          ...tokenInfo,
          type: 'ERC1155'
        };
      }

      console.log(JSON.stringify(tokenInfo, null, 2));
      return;
    } catch (e) {
      // Not ERC1155 or error occurred
    }

    // If we get here, we couldn't identify the token type
    console.log(JSON.stringify(tokenInfo, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

getTokenInfo();
`;

        fs.writeFileSync(scriptPath, scriptContent);

        // Make sure ethers is installed
        process.chdir(scriptDir);
        try {
          require.resolve('ethers');
        } catch (e) {
          spinner.setText('Installing required dependencies...');
          execSync('npm install ethers@5.7.2', { stdio: 'ignore' });
        }

        // Run the script
        spinner.setText(`Querying token at ${address} on ${options.network}...`);
        const result = execSync('node get-token-info.js', { encoding: 'utf8' });

        // Clean up
        fs.unlinkSync(scriptPath);

        try {
          const tokenInfo = JSON.parse(result);

          if (tokenInfo.error) {
            spinner.fail(`Error: ${tokenInfo.error}`);
            return;
          }

          spinner.succeed(`Token information retrieved`);

          console.log('\n' + chalk.cyan('Token Information:'));

          if (tokenInfo.type === 'ERC20') {
            console.log(`${chalk.gray('Type:')} ${chalk.white('ERC20 Token')}`);
            console.log(`${chalk.gray('Name:')} ${chalk.white(tokenInfo.name)}`);
            console.log(`${chalk.gray('Symbol:')} ${chalk.white(tokenInfo.symbol)}`);
            console.log(`${chalk.gray('Decimals:')} ${chalk.white(tokenInfo.decimals)}`);
            console.log(`${chalk.gray('Total Supply:')} ${chalk.white(tokenInfo.totalSupply)}`);
          } else if (tokenInfo.type === 'ERC721') {
            console.log(`${chalk.gray('Type:')} ${chalk.white('ERC721 NFT Collection')}`);
            console.log(`${chalk.gray('Name:')} ${chalk.white(tokenInfo.name)}`);
            console.log(`${chalk.gray('Symbol:')} ${chalk.white(tokenInfo.symbol)}`);

            if (tokenInfo.sampleTokenURI) {
              console.log(
                `${chalk.gray('Sample Token URI:')} ${chalk.white(tokenInfo.sampleTokenURI)}`
              );
            }
          } else if (tokenInfo.type === 'ERC1155') {
            console.log(`${chalk.gray('Type:')} ${chalk.white('ERC1155 Multi-Token')}`);

            if (tokenInfo.uri) {
              console.log(`${chalk.gray('URI Format:')} ${chalk.white(tokenInfo.uri)}`);
            }
          } else {
            console.log(
              `${chalk.gray('Type:')} ${chalk.yellow('Unknown or not a token contract')}`
            );
          }

          console.log(`${chalk.gray('Address:')} ${chalk.white(tokenInfo.address)}`);
          console.log(`${chalk.gray('Network:')} ${chalk.white(tokenInfo.network)}`);

          // Show block explorer link
          let explorerUrl = '';
          if (tokenInfo.network === 'mainnet') {
            explorerUrl = `https://etherscan.io/token/${tokenInfo.address}`;
          } else if (tokenInfo.network === 'goerli') {
            explorerUrl = `https://goerli.etherscan.io/token/${tokenInfo.address}`;
          } else if (tokenInfo.network === 'sepolia') {
            explorerUrl = `https://sepolia.etherscan.io/token/${tokenInfo.address}`;
          } else if (tokenInfo.network === 'polygon') {
            explorerUrl = `https://polygonscan.com/token/${tokenInfo.address}`;
          } else if (tokenInfo.network === 'mumbai') {
            explorerUrl = `https://mumbai.polygonscan.com/token/${tokenInfo.address}`;
          }

          if (explorerUrl) {
            console.log(`${chalk.gray('Explorer:')} ${chalk.white(explorerUrl)}`);
          }
        } catch (error) {
          spinner.fail(`Failed to parse token info: ${error.message}`);
        }
      } catch (error) {
        spinner.fail(`Failed to get token info: ${error.message}`);
      }
    });

  // Helper function to generate ERC20 token contract
  function generateERC20Contract(contractName, details) {
    const pragmaVersion = '0.8.20';

    let imports = ['@openzeppelin/contracts/token/ERC20/ERC20.sol'];

    if (details.mintable || details.burnable || details.pausable || details.accessControl) {
      if (details.accessControl) {
        imports.push('@openzeppelin/contracts/access/AccessControl.sol');
      } else {
        imports.push('@openzeppelin/contracts/access/Ownable.sol');
      }
    }

    if (details.burnable) {
      imports.push('@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol');
    }

    if (details.pausable) {
      imports.push('@openzeppelin/contracts/security/Pausable.sol');
    }

    let inheritance = ['ERC20'];
    if (details.accessControl) inheritance.push('AccessControl');
    else if (details.mintable || details.burnable || details.pausable) inheritance.push('Ownable');
    if (details.burnable) inheritance.push('ERC20Burnable');
    if (details.pausable) inheritance.push('Pausable');

    let contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^${pragmaVersion};

`;

    // Imports
    imports.forEach(imp => {
      contractCode += `import "${imp}";\n`;
    });

    // Contract definition
    contractCode += `\n/**
 * @title ${details.name}
 * @dev ERC20 Token for StreamChain platform
 */
contract ${contractName} is ${inheritance.join(', ')} {
`;

    // Role definitions for AccessControl
    if (details.accessControl) {
      contractCode += `    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

`;
    }

    // Constructor
    contractCode += `    constructor() ERC20("${details.name}", "${details.symbol}") `;
    if (details.accessControl) {
      contractCode += `{
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        ${details.pausable ? '_grantRole(PAUSER_ROLE, msg.sender);' : ''}

        // Initial supply
        _mint(msg.sender, ${details.totalSupply} * 10**${details.decimals});
    }`;
    } else if (details.mintable || details.burnable || details.pausable) {
      contractCode += `Ownable() {
        // Initial supply
        _mint(msg.sender, ${details.totalSupply} * 10**${details.decimals});
    }`;
    } else {
      contractCode += `{
        // Initial supply
        _mint(msg.sender, ${details.totalSupply} * 10**${details.decimals});
    }`;
    }

    // Decimal override
    if (details.decimals !== '18') {
      contractCode += `\n
    /**
     * @dev Override decimals
     */
    function decimals() public pure override returns (uint8) {
        return ${details.decimals};
    }`;
    }

    // Mint function
    if (details.mintable) {
      contractCode += `\n
    /**
     * @dev Creates amount new tokens for recipient.
     *
     * Requirements:
     * - the caller must have the appropriate role
     */
    function mint(address to, uint256 amount) public `;

      if (details.accessControl) {
        contractCode += `onlyRole(MINTER_ROLE) `;
      } else {
        contractCode += `onlyOwner `;
      }

      contractCode += `{
        _mint(to, amount);
    }`;
    }

    // Pause/unpause functions
    if (details.pausable) {
      contractCode += `\n
    /**
     * @dev Pauses all token transfers.
     *
     * Requirements:
     * - the caller must have the appropriate role
     */
    function pause() public `;

      if (details.accessControl) {
        contractCode += `onlyRole(PAUSER_ROLE) `;
      } else {
        contractCode += `onlyOwner `;
      }

      contractCode += `{
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     *
     * Requirements:
     * - the caller must have the appropriate role
     */
    function unpause() public `;

      if (details.accessControl) {
        contractCode += `onlyRole(PAUSER_ROLE) `;
      } else {
        contractCode += `onlyOwner `;
      }

      contractCode += `{
        _unpause();
    }`;

      // Override _beforeTokenTransfer for pause functionality
      contractCode += `\n
    /**
     * @dev Hook that is called before any transfer of tokens.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
    }`;
    }

    // Support for AccessControl
    if (details.accessControl) {
      contractCode += `\n
    // Override required functions for AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC20, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }`;
    }

    contractCode += `\n}`;

    return contractCode;
  }

  // Helper function to generate ERC721 token contract
  function generateERC721Contract(contractName, details) {
    const pragmaVersion = '0.8.20';

    let imports = ['@openzeppelin/contracts/token/ERC721/ERC721.sol'];

    if (details.enumerable) {
      imports.push('@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol');
    }

    if (details.burnable) {
      imports.push('@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol');
    }

    if (details.accessControl) {
      imports.push('@openzeppelin/contracts/access/AccessControl.sol');
    } else {
      imports.push('@openzeppelin/contracts/access/Ownable.sol');
    }

    imports.push('@openzeppelin/contracts/utils/Counters.sol');

    let inheritance = ['ERC721'];
    if (details.enumerable) inheritance.push('ERC721Enumerable');
    if (details.burnable) inheritance.push('ERC721Burnable');
    if (details.accessControl) inheritance.push('AccessControl');
    else inheritance.push('Ownable');

    let contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^${pragmaVersion};

`;

    // Imports
    imports.forEach(imp => {
      contractCode += `import "${imp}";\n`;
    });

    // Contract definition
    contractCode += `\n/**
 * @title ${details.name}
 * @dev ERC721 NFT Token for StreamChain platform
 */
contract ${contractName} is ${inheritance.join(', ')} {
    using Counters for Counters.Counter;

`;

    // Counter if auto-increment
    if (details.autoIncrement) {
      contractCode += `    Counters.Counter private _tokenIdCounter;\n\n`;
    }

    // Role definitions for AccessControl
    if (details.accessControl) {
      contractCode += `    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

`;
    }

    // Base URI storage
    contractCode += `    string private _baseTokenURI;\n\n`;

    // Constructor
    contractCode += `    constructor() ERC721("${details.name}", "${details.symbol}") `;
    if (details.accessControl) {
      contractCode += `{
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        _baseTokenURI = "${details.baseUri}";
    }`;
    } else {
      contractCode += `Ownable() {
        _baseTokenURI = "${details.baseUri}";
    }`;
    }

    // Mint function
    contractCode += `\n
    /**
     * @dev Creates a new token for recipient.
     *
     * Requirements:
     * - the caller must have the appropriate role
     */
    function safeMint(address to`;

    if (!details.autoIncrement) {
      contractCode += `, uint256 tokenId`;
    }

    contractCode += `) public `;

    if (details.accessControl) {
      contractCode += `onlyRole(MINTER_ROLE) `;
    } else {
      contractCode += `onlyOwner `;
    }

    contractCode += `{`;

    if (details.autoIncrement) {
      contractCode += `
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();`;
    }

    contractCode += `
        _safeMint(to, tokenId);
    }`;

    // Set base URI function
    contractCode += `\n
    /**
     * @dev Sets the base URI for all token IDs
     */
    function setBaseURI(string memory baseURI) public `;

    if (details.accessControl) {
      contractCode += `onlyRole(URI_SETTER_ROLE) `;
    } else {
      contractCode += `onlyOwner `;
    }

    contractCode += `{
        _baseTokenURI = baseURI;
    }`;

    // Base URI function
    contractCode += `\n
    /**
     * @dev Base URI for computing {tokenURI}.
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }`;

    // Support for AccessControl and ERC721Enumerable
    if (details.accessControl && details.enumerable) {
      contractCode += `\n
    // Override required functions for AccessControl and ERC721Enumerable
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }`;
    } else if (details.enumerable) {
      contractCode += `\n
    // Override required functions for ERC721Enumerable
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }`;
    } else if (details.accessControl) {
      contractCode += `\n
    // Override required functions for AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }`;
    }

    contractCode += `\n}`;

    return contractCode;
  }

  // Helper function to generate ERC1155 token contract
  function generateERC1155Contract(contractName, details) {
    const pragmaVersion = '0.8.20';

    let imports = ['@openzeppelin/contracts/token/ERC1155/ERC1155.sol'];

    if (details.burnable) {
      imports.push('@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol');
    }

    if (details.accessControl) {
      imports.push('@openzeppelin/contracts/access/AccessControl.sol');
    } else {
      imports.push('@openzeppelin/contracts/access/Ownable.sol');
    }

    let inheritance = ['ERC1155'];
    if (details.burnable) inheritance.push('ERC1155Burnable');
    if (details.accessControl) inheritance.push('AccessControl');
    else inheritance.push('Ownable');

    let contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^${pragmaVersion};

`;

    // Imports
    imports.forEach(imp => {
      contractCode += `import "${imp}";\n`;
    });

    // Contract definition
    contractCode += `\n/**
 * @title ${details.name}
 * @dev ERC1155 Multi-Token for StreamChain platform
 */
contract ${contractName} is ${inheritance.join(', ')} {
`;

    // Role definitions for AccessControl
    if (details.accessControl) {
      contractCode += `    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

`;
    }

    // Name and symbol storage
    contractCode += `    string public name;
    string public symbol;

`;

    // Constructor
    contractCode += `    constructor() ERC1155("${details.baseUri}") `;
    if (details.accessControl) {
      contractCode += `{
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        name = "${details.name}";
        symbol = "${details.symbol}";
    }`;
    } else {
      contractCode += `Ownable() {
        name = "${details.name}";
        symbol = "${details.symbol}";
    }`;
    }

    // Mint function
    contractCode += `\n
    /**
     * @dev Creates tokens of token type id, and assigns them to recipient.
     *
     * Requirements:
     * - the caller must have the appropriate role
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public `;

    if (details.accessControl) {
      contractCode += `onlyRole(MINTER_ROLE) `;
    } else {
      contractCode += `onlyOwner `;
    }

    contractCode += `{
        _mint(to, id, amount, data);
    }`;

    // Batch mint function
    contractCode += `\n
    /**
     * @dev Batch mints multiple token types.
     *
     * Requirements:
     * - the caller must have the appropriate role
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public `;

    if (details.accessControl) {
      contractCode += `onlyRole(MINTER_ROLE) `;
    } else {
      contractCode += `onlyOwner `;
    }

    contractCode += `{
        _mintBatch(to, ids, amounts, data);
    }`;

    // Set URI function
    contractCode += `\n
    /**
     * @dev Sets the URI for all token types
     */
    function setURI(string memory newuri) public `;

    if (details.accessControl) {
      contractCode += `onlyRole(URI_SETTER_ROLE) `;
    } else {
      contractCode += `onlyOwner `;
    }

    contractCode += `{
        _setURI(newuri);
    }`;

    // Support for AccessControl
    if (details.accessControl) {
      contractCode += `\n
    // Override required functions for AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }`;
    }

    contractCode += `\n}`;

    return contractCode;
  }

  return token;
}

module.exports = registerTokenCommands;
