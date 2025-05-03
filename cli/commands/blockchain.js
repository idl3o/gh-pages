/**
 * Blockchain Commands
 *
 * Commands for managing blockchain deployment and interaction
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const { Spinner, ProgressBar } = require('../utils/ui-helpers');

/**
 * Register blockchain commands
 * @param {object} program Commander program instance
 */
function registerBlockchainCommands(program) {
  const blockchain = program.command('blockchain').description('Blockchain management commands');

  blockchain
    .command('init')
    .description('Initialize a new blockchain project')
    .option('--hardhat', 'Use Hardhat framework', false)
    .option('--truffle', 'Use Truffle framework', false)
    .option('--foundry', 'Use Foundry framework', false)
    .action(async options => {
      console.log(chalk.cyan('🔗 Initializing blockchain project'));

      // Determine which framework to use, ask if not specified
      let framework = 'hardhat'; // default

      if (options.hardhat) framework = 'hardhat';
      else if (options.truffle) framework = 'truffle';
      else if (options.foundry) framework = 'foundry';
      else {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'framework',
            message: 'Select blockchain framework:',
            choices: [
              { name: 'Hardhat (Recommended)', value: 'hardhat' },
              { name: 'Truffle', value: 'truffle' },
              { name: 'Foundry', value: 'foundry' }
            ],
            default: 'hardhat'
          }
        ]);

        framework = answers.framework;
      }

      // Get project configurations
      const configAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          default: 'streamchain-blockchain'
        },
        {
          type: 'list',
          name: 'network',
          message: 'Target network:',
          choices: [
            { name: 'Ethereum Mainnet', value: 'mainnet' },
            { name: 'Ethereum Goerli Testnet', value: 'goerli' },
            { name: 'Ethereum Sepolia Testnet', value: 'sepolia' },
            { name: 'Polygon', value: 'polygon' },
            { name: 'Polygon Mumbai Testnet', value: 'mumbai' },
            { name: 'Local Development', value: 'local' }
          ],
          default: 'sepolia'
        }
      ]);

      const spinner = new Spinner(`Initializing ${framework} project...`).start();

      try {
        // Create project directory if it doesn't exist
        const projectDir = path.join(process.cwd(), 'blockchain');
        if (!fs.existsSync(projectDir)) {
          fs.mkdirSync(projectDir, { recursive: true });
        }

        process.chdir(projectDir);

        // Initialize based on selected framework
        if (framework === 'hardhat') {
          try {
            execSync('npx hardhat --version', { stdio: 'ignore' });
          } catch (e) {
            spinner.setText('Installing Hardhat (this might take a minute)...');
            execSync('npm install --save-dev hardhat', { stdio: 'ignore' });
          }

          // Create temporary answers file for Hardhat setup
          fs.writeFileSync(
            path.join(projectDir, '.hardhat-init-tmp'),
            'y\n\n\n\n', // Answers to prompts: create JS project, no gitignore, no prettier
            'utf8'
          );

          spinner.setText('Creating Hardhat project...');
          execSync('npx hardhat init < .hardhat-init-tmp', { stdio: 'ignore' });

          // Clean up temp file
          fs.unlinkSync(path.join(projectDir, '.hardhat-init-tmp'));
        } else if (framework === 'truffle') {
          try {
            execSync('npx truffle --version', { stdio: 'ignore' });
          } catch (e) {
            spinner.setText('Installing Truffle (this might take a minute)...');
            execSync('npm install --save-dev truffle', { stdio: 'ignore' });
          }

          spinner.setText('Creating Truffle project...');
          execSync('npx truffle init', { stdio: 'ignore' });
        } else if (framework === 'foundry') {
          spinner.setText('Checking if Foundry is installed...');

          try {
            execSync('forge --version', { stdio: 'ignore' });
          } catch (e) {
            spinner.warn('Foundry not found. Please install Foundry:');
            console.log(chalk.yellow('\nInstall Foundry with:'));
            if (process.platform === 'win32') {
              console.log(chalk.gray('curl -L https://foundry.paradigm.xyz | bash'));
            } else {
              console.log(chalk.gray('curl -L https://foundry.paradigm.xyz | bash'));
            }
            console.log(chalk.yellow('Then run this command again.\n'));
            return;
          }

          spinner.setText('Creating Foundry project...');
          execSync(`forge init ${configAnswers.projectName}`, { stdio: 'ignore' });
        }

        // Create .env file with placeholder for private key
        const envContent = `
# Network configuration
NETWORK=${configAnswers.network}

# Deployment keys - KEEP THESE PRIVATE!
PRIVATE_KEY=
INFURA_API_KEY=
ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=

# Contract settings
CONTRACT_NAME="${configAnswers.projectName}"
`;

        fs.writeFileSync(path.join(projectDir, '.env'), envContent.trim(), 'utf8');

        spinner.succeed(`${framework} project initialized successfully`);

        console.log(chalk.green('\n✅ Project created at:'), chalk.white(`${projectDir}`));
        console.log(chalk.cyan('\nNext steps:'));
        console.log(chalk.white('1. Add your private key to the .env file'));
        console.log(chalk.white(`2. Write your smart contracts in the appropriate directory`));
        if (framework === 'hardhat') {
          console.log(
            chalk.white('3. Deploy with: sxs blockchain deploy --network ' + configAnswers.network)
          );
        } else if (framework === 'truffle') {
          console.log(
            chalk.white('3. Deploy with: npx truffle migrate --network ' + configAnswers.network)
          );
        } else {
          console.log(
            chalk.white('3. Deploy with: forge create --network ' + configAnswers.network)
          );
        }
      } catch (error) {
        spinner.fail(`Failed to initialize blockchain project: ${error.message}`);
      }
    });

  blockchain
    .command('deploy')
    .description('Deploy smart contracts')
    .option('-n, --network <network>', 'Target network', 'sepolia')
    .option('-c, --contract <contract>', 'Contract name to deploy')
    .option('-v, --verify', 'Verify contract on block explorer')
    .action(async options => {
      // Check if blockchain project exists
      const blockchainDir = path.join(process.cwd(), 'blockchain');
      if (!fs.existsSync(blockchainDir)) {
        console.log(chalk.red('❌ Blockchain project not found.'));
        console.log(
          chalk.yellow('Run `sxs blockchain init` first to create a blockchain project.')
        );
        return;
      }

      process.chdir(blockchainDir);

      // Detect which framework is being used
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

      console.log(chalk.cyan(`🚀 Deploying smart contracts using ${framework}...`));

      const spinner = new Spinner('Compiling contracts...').start();

      try {
        // Compile first
        if (framework === 'hardhat') {
          execSync('npx hardhat compile', { stdio: 'ignore' });
        } else if (framework === 'truffle') {
          execSync('npx truffle compile', { stdio: 'ignore' });
        } else if (framework === 'foundry') {
          execSync('forge build', { stdio: 'ignore' });
        }

        spinner.succeed('Contracts compiled successfully');
        spinner.start(`Deploying to ${options.network}...`);

        // Deploy based on framework
        let deployCommand = '';

        if (framework === 'hardhat') {
          deployCommand = `npx hardhat run scripts/deploy.js --network ${options.network}`;
          if (options.contract) {
            deployCommand += ` --contract ${options.contract}`;
          }
        } else if (framework === 'truffle') {
          deployCommand = `npx truffle migrate --network ${options.network}`;
          if (options.contract) {
            deployCommand += ` --f ${options.contract}`;
          }
        } else if (framework === 'foundry') {
          // Foundry deploy needs more setup, simplified here
          const contractPath = options.contract || 'src/Contract.sol:Contract';
          deployCommand = `forge create --network ${options.network} ${contractPath}`;
        }

        const deployResult = execSync(deployCommand, { encoding: 'utf8' });
        spinner.succeed('Contracts deployed successfully');

        console.log('\n' + chalk.gray(deployResult));

        // Extract contract address from output - this would need refinement for production
        let contractAddress = '';
        const addressMatch = deployResult.match(/([0x][a-fA-F0-9]{40})/);
        if (addressMatch) {
          contractAddress = addressMatch[0];
        }

        // Verify contract if requested
        if (options.verify && contractAddress) {
          spinner.start(`Verifying contract on block explorer...`);

          try {
            if (framework === 'hardhat') {
              execSync(`npx hardhat verify --network ${options.network} ${contractAddress}`, {
                stdio: 'pipe',
                encoding: 'utf8'
              });
            } else if (framework === 'truffle') {
              execSync(
                `npx truffle run verify ${options.contract || ''} --network ${options.network}`,
                {
                  stdio: 'pipe',
                  encoding: 'utf8'
                }
              );
            }
            spinner.succeed('Contract verified on block explorer');
          } catch (error) {
            spinner.warn(`Contract verification failed: ${error.message}`);
          }
        }

        // Save deployment details
        if (contractAddress) {
          const deploymentsDir = path.join(blockchainDir, 'deployments');
          if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
          }

          const deploymentInfo = {
            network: options.network,
            contract: options.contract || 'Unknown',
            address: contractAddress,
            timestamp: new Date().toISOString(),
            framework: framework
          };

          fs.writeFileSync(
            path.join(deploymentsDir, `${options.network}-${Date.now()}.json`),
            JSON.stringify(deploymentInfo, null, 2)
          );

          console.log(chalk.green('\n✅ Contract deployed at:'), chalk.white(contractAddress));

          // Show block explorer link
          let explorerUrl = '';
          if (options.network === 'mainnet') {
            explorerUrl = `https://etherscan.io/address/${contractAddress}`;
          } else if (options.network === 'goerli') {
            explorerUrl = `https://goerli.etherscan.io/address/${contractAddress}`;
          } else if (options.network === 'sepolia') {
            explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;
          } else if (options.network === 'polygon') {
            explorerUrl = `https://polygonscan.com/address/${contractAddress}`;
          } else if (options.network === 'mumbai') {
            explorerUrl = `https://mumbai.polygonscan.com/address/${contractAddress}`;
          }

          if (explorerUrl) {
            console.log(chalk.cyan('Block Explorer:'), chalk.white(explorerUrl));
          }
        }
      } catch (error) {
        spinner.fail(`Deployment failed: ${error.message}`);
        console.log(chalk.red(error.stdout || error.stderr || ''));
      }
    });

  blockchain
    .command('list')
    .description('List deployed contracts')
    .option('-n, --network <network>', 'Filter by network')
    .action(options => {
      const deploymentsDir = path.join(process.cwd(), 'blockchain', 'deployments');

      if (!fs.existsSync(deploymentsDir)) {
        console.log(chalk.yellow('No deployments found.'));
        console.log(chalk.gray('Deploy contracts first with `sxs blockchain deploy`'));
        return;
      }

      console.log(chalk.cyan('📋 Deployed Contracts:'));

      const deploymentFiles = fs.readdirSync(deploymentsDir).filter(f => f.endsWith('.json'));

      if (deploymentFiles.length === 0) {
        console.log(chalk.yellow('No deployment records found.'));
        return;
      }

      const deployments = [];

      deploymentFiles.forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(deploymentsDir, file), 'utf8'));

          // Apply network filter if specified
          if (!options.network || data.network === options.network) {
            deployments.push(data);
          }
        } catch (error) {
          console.log(chalk.red(`Error reading ${file}: ${error.message}`));
        }
      });

      if (deployments.length === 0) {
        console.log(
          chalk.yellow(
            `No deployments found${options.network ? ` for network '${options.network}'` : ''}.`
          )
        );
        return;
      }

      // Sort by timestamp, newest first
      deployments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const Table = require('cli-table3');
      const table = new Table({
        head: ['Contract', 'Network', 'Address', 'Deployed At'],
        style: { head: ['cyan'] }
      });

      deployments.forEach(deployment => {
        table.push([
          deployment.contract || 'Unknown',
          deployment.network,
          deployment.address,
          new Date(deployment.timestamp).toLocaleString()
        ]);
      });

      console.log(table.toString());
    });

  return blockchain;
}

module.exports = registerBlockchainCommands;
