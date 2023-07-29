import { HardhatUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv'
import 'hardhat-deploy'

// Hardhat tasks
//import './tasks'

dotenv.config()

import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import "@openzeppelin/hardhat-upgrades";
import '@typechain/hardhat';

const ownerKey = process.env.MUMBAI_OWNER_PRIVATE_KEY || '0x' + '11'.repeat(32)
const goveKey = process.env.MUMBAI_GOVE_PRIVATE_KEY || '0x' + '11'.repeat(32)
const treasuryKey = process.env.TREASURY_PRIVATE_KEY || '0x' + '11'.repeat(32)
const optreeUser = process.env.OPTREE_USER_KEY|| '0x' + '11'.repeat(32)

const TRACK_GAS = process.env.TRACK_GAS === 'true';
const BLOCK_EXPLORER_KEY = process.env.BLOCK_EXPLORER_KEY || '';

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              yul: true,
            },
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      gas: 16000000,
    },
    mumbai: {
      chainId: 80001,
      url: process.env.MUMBAI_RPC_URL || '',
      accounts: [ownerKey, goveKey, treasuryKey, optreeUser],
      gas: 16000000,
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.CONTRACTS_RPC_URL || '',
      accounts: [ownerKey, goveKey, treasuryKey],
    },
    polygonMain: {
      chainId: 137,
      url: process.env.POLYGON_MAINNET_RPC_URL || '',
      accounts: [ownerKey, goveKey, treasuryKey],
    },
    ethMain: {
      chainId: 1,
      url: process.env.CONTRACTS_RPC_URL || '',
      accounts: [ownerKey, goveKey, treasuryKey],
    },
  },
  gasReporter: {
    enabled: TRACK_GAS,
  },
  etherscan: {
    apiKey: BLOCK_EXPLORER_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    governance: {
      default: 1,
    }
  },
};

export default config;