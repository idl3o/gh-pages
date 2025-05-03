require('dotenv').config();
const { EC2Client, DescribeInstancesCommand, GetPasswordDataCommand } = require('@aws-sdk/client-ec2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { NodeSSH } = require('ssh2');
const { v4: uuidv4 } = require('uuid');
const rdp = require('node-rdp');
const { exec } = require('child_process');
const os = require('os');
const KeyCompressor = require('./utils/key-compressor');

// Windows connector class
class WindowsInstanceConnector {
  constructor(config = {}) {
    this.config = {
      region: config.region || process.env.AWS_REGION || 'us-west-2',
      accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      instanceId: config.instanceId || process.env.WINDOWS_INSTANCE_ID,
      username: config.username || process.env.WINDOWS_USERNAME || 'Administrator',
      privateKeyPath: config.privateKeyPath || process.env.WINDOWS_PRIVATE_KEY_PATH,
      compressedKeyPath: config.compressedKeyPath || process.env.WINDOWS_COMPRESSED_KEY_PATH,
      keyPassword: config.keyPassword || process.env.WINDOWS_KEY_PASSWORD,
      connectionType: config.connectionType || 'rdp', // 'rdp' or 'ssh'
      port: config.port || (config.connectionType === 'ssh' ? 22 : 3389)
    };

    // Initialize EC2 client
    this.ec2Client = new EC2Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      }
    });

    this.instanceDetails = null;
    this.sessionId = uuidv4();
    this.logFilePath = path.join(os.tmpdir(), `win-connector-${this.sessionId}.log`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    fs.appendFileSync(this.logFilePath, logEntry);
  }

  async getInstanceDetails() {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [this.config.instanceId]
      });
      
      const response = await this.ec2Client.send(command);
      
      if (response.Reservations && 
          response.Reservations.length > 0 && 
          response.Reservations[0].Instances && 
          response.Reservations[0].Instances.length > 0) {
        
        this.instanceDetails = response.Reservations[0].Instances[0];
        this.log(`Found instance: ${this.instanceDetails.InstanceId} (${this.instanceDetails.State.Name})`);
        return this.instanceDetails;
      } else {
        throw new Error(`Instance ${this.config.instanceId} not found`);
      }
    } catch (error) {
      this.log(`Error getting instance details: ${error.message}`);
      throw error;
    }
  }

  async getWindowsPassword() {
    try {
      let privateKey;
      
      // Check if we have a compressed key path and password
      if (this.config.compressedKeyPath && fs.existsSync(this.config.compressedKeyPath)) {
        this.log('Using compressed private key');
        const compressedData = fs.readFileSync(this.config.compressedKeyPath);
        try {
          const decompressed = await KeyCompressor.decompress(
            compressedData, 
            this.config.keyPassword
          );
          privateKey = decompressed.toString('utf8');
        } catch (error) {
          this.log(`Error decompressing key: ${error.message}`);
          throw new Error('Failed to decompress private key');
        }
      } else if (this.config.privateKeyPath && fs.existsSync(this.config.privateKeyPath)) {
        this.log('Using standard private key file');
        privateKey = fs.readFileSync(this.config.privateKeyPath, 'utf8');
      } else {
        throw new Error('No private key available (neither standard nor compressed)');
      }
      
      const command = new GetPasswordDataCommand({
        InstanceId: this.config.instanceId
      });
      
      const response = await this.ec2Client.send(command);
      
      if (!response.PasswordData) {
        throw new Error('Password data not available yet. The instance might still be initializing.');
      }

      // Decrypt the password using the private key
      const decryptedPassword = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(response.PasswordData, 'base64')
      ).toString('utf8');
      
      this.log('Successfully retrieved Windows password');
      return decryptedPassword;
    } catch (error) {
      this.log(`Error getting Windows password: ${error.message}`);
      throw error;
    }
  }

  async connectRDP() {
    try {
      if (!this.instanceDetails) {
        await this.getInstanceDetails();
      }
      
      const publicIp = this.instanceDetails.PublicIpAddress;
      if (!publicIp) {
        throw new Error('Instance does not have a public IP address');
      }
      
      let password;
      try {
        password = await this.getWindowsPassword();
      } catch (error) {
        this.log(`Warning: Could not automatically retrieve Windows password: ${error.message}`);
        password = process.env.WINDOWS_PASSWORD || '';
      }
      
      const rdpOptions = {
        address: publicIp,
        username: this.config.username,
        password: password,
        port: this.config.port,
        // Additional RDP options
        width: 1024,
        height: 768,
        colors: 32
      };

      this.log(`Initiating RDP connection to ${publicIp}:${this.config.port} as ${this.config.username}`);
      
      // Generate RDP file
      const rdpFilePath = path.join(os.tmpdir(), `${this.sessionId}.rdp`);
      let rdpFileContent = [
        `full address:s:${rdpOptions.address}:${rdpOptions.port}`,
        `username:s:${rdpOptions.username}`,
        `screen mode id:i:1`,
        `desktopwidth:i:${rdpOptions.width}`,
        `desktopheight:i:${rdpOptions.height}`,
        `session bpp:i:${rdpOptions.colors}`,
        `use multimon:i:0`,
        `authentication level:i:2`,
        `prompt for credentials:i:1`,
        `negotiate security layer:i:1`,
        `alternate shell:s:`,
        `shell working directory:s:`,
        `disable wallpaper:i:0`,
        `disable full window drag:i:0`,
      ].join('\n');
      
      fs.writeFileSync(rdpFilePath, rdpFileContent);
      
      this.log(`RDP file created at: ${rdpFilePath}`);
      this.log('Please use this file with your RDP client to connect.');
      
      // Try to open the RDP file with the default program
      if (process.platform === 'win32') {
        exec(`start ${rdpFilePath}`);
        this.log('Launching RDP client...');
      } else if (process.platform === 'darwin') {
        exec(`open ${rdpFilePath}`);
        this.log('Launching RDP client...');
      } else if (process.platform === 'linux') {
        exec(`xdg-open ${rdpFilePath}`);
        this.log('Launching RDP client...');
      } else {
        this.log(`Please open the RDP file manually: ${rdpFilePath}`);
      }
      
      return {
        success: true,
        message: 'RDP connection initiated',
        rdpFilePath: rdpFilePath
      };
    } catch (error) {
      this.log(`Error connecting via RDP: ${error.message}`);
      throw error;
    }
  }

  async connectSSH() {
    try {
      if (!this.instanceDetails) {
        await this.getInstanceDetails();
      }
      
      const publicIp = this.instanceDetails.PublicIpAddress;
      if (!publicIp) {
        throw new Error('Instance does not have a public IP address');
      }
      
      let password;
      try {
        password = await this.getWindowsPassword();
      } catch (error) {
        this.log(`Warning: Could not automatically retrieve Windows password: ${error.message}`);
        password = process.env.WINDOWS_PASSWORD || '';
      }
      
      let sshKey;
      
      // Check if we have a compressed key path
      if (this.config.compressedKeyPath && fs.existsSync(this.config.compressedKeyPath)) {
        this.log('Using compressed private key for SSH');
        const compressedData = fs.readFileSync(this.config.compressedKeyPath);
        try {
          sshKey = await KeyCompressor.decompress(
            compressedData, 
            this.config.keyPassword
          );
        } catch (error) {
          this.log(`Error decompressing key for SSH: ${error.message}`);
          throw new Error('Failed to decompress private key for SSH connection');
        }
      } else if (this.config.privateKeyPath && fs.existsSync(this.config.privateKeyPath)) {
        sshKey = fs.readFileSync(this.config.privateKeyPath);
      }
      
      const ssh = new NodeSSH();
      
      this.log(`Initiating SSH connection to ${publicIp}:${this.config.port} as ${this.config.username}`);
      
      const sshOptions = {
        host: publicIp,
        port: this.config.port,
        username: this.config.username,
        password: password
      };
      
      // If we have a key, use it instead of password
      if (sshKey) {
        sshOptions.privateKey = sshKey;
        delete sshOptions.password;
      }
      
      await ssh.connect(sshOptions);
      this.log('SSH connection established');
      
      return {
        success: true,
        message: 'SSH connection established',
        ssh: ssh
      };
    } catch (error) {
      this.log(`Error connecting via SSH: ${error.message}`);
      throw error;
    }
  }

  async connect() {
    if (this.config.connectionType === 'rdp') {
      return await this.connectRDP();
    } else if (this.config.connectionType === 'ssh') {
      return await this.connectSSH();
    } else {
      throw new Error(`Unsupported connection type: ${this.config.connectionType}`);
    }
  }

  /**
   * Compress the currently configured private key
   * @param {string} outputPath - Where to save the compressed key
   * @param {string} password - Password to encrypt the key
   * @returns {Promise<string>} Path to the compressed key file
   */
  async compressPrivateKey(outputPath, password) {
    if (!this.config.privateKeyPath || !fs.existsSync(this.config.privateKeyPath)) {
      throw new Error('No private key available to compress');
    }
    
    this.log(`Compressing private key to ${outputPath}`);
    return await KeyCompressor.compressFile(this.config.privateKeyPath, outputPath, password);
  }
}

// If this file is run directly
if (require.main === module) {
  (async () => {
    try {
      if (!process.env.WINDOWS_INSTANCE_ID) {
        console.error('Error: WINDOWS_INSTANCE_ID environment variable is required');
        console.log('Please set it in your .env file or pass it as a parameter');
        process.exit(1);
      }

      const connector = new WindowsInstanceConnector();
      await connector.connect();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}

// Export the connector for use in other modules
module.exports = WindowsInstanceConnector;
