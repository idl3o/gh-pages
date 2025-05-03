/**
 * Contract addresses for different networks
 * Keys represent network IDs (1: Ethereum Mainnet, 5: Goerli, 137: Polygon, etc.)
 */
interface ContractAddresses {
  streamAccess: string;
  proofOfExistence: string;
  streamingToken: string;
  streamPayment: string;
  treasury?: string;
  governance?: string;
}

interface ContractAddressMapping {
  [networkId: number]: ContractAddresses;
}

const contractAddresses: ContractAddressMapping = {
  // Ethereum Mainnet
  1: {
    streamAccess: "0x1234567890123456789012345678901234567890",
    proofOfExistence: "0x2345678901234567890123456789012345678901",
    streamingToken: "0x3456789012345678901234567890123456789012",
    streamPayment: "0x4567890123456789012345678901234567890123",
    treasury: "0x6789012345678901234567890123456789012345",
    governance: "0x7890123456789012345678901234567890123456"
  },
  
  // Ethereum Goerli (Testnet)
  5: {
    streamAccess: "0x9876543210987654321098765432109876543210",
    proofOfExistence: "0x8765432109876543210987654321098765432109",
    streamingToken: "0x7654321098765432109876543210987654321098",
    streamPayment: "0x6543210987654321098765432109876543210987"
  },
  
  // Polygon Mainnet
  137: {
    streamAccess: "0xabcdef0123456789abcdef0123456789abcdef01",
    proofOfExistence: "0xbcdef0123456789abcdef0123456789abcdef012",
    streamingToken: "0xcdef0123456789abcdef0123456789abcdef0123",
    streamPayment: "0xdef0123456789abcdef0123456789abcdef01234"
  },
  
  // Mumbai Testnet
  80001: {
    streamAccess: "0xfedcba9876543210fedcba9876543210fedcba98",
    proofOfExistence: "0xedcba9876543210fedcba9876543210fedcba987",
    streamingToken: "0xdcba9876543210fedcba9876543210fedcba9876",
    streamPayment: "0xcba9876543210fedcba9876543210fedcba98765"
  },
  
  // Hardhat local development network
  31337: {
    streamAccess: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    proofOfExistence: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    streamingToken: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    streamPayment: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  }
};

export default contractAddresses;
