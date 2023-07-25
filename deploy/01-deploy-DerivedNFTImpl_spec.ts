/* Imports: Internal */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import { hexlify, keccak256, RLP } from 'ethers/lib/utils'
import {
  deployAndVerifyAndThen,
  getContractFromArtifact,
} from '../src/deploy-utils'

const deployFn: DeployFunction = async (hre) => {

  const ethers = hre.ethers;
  const { deployer } = await hre.getNamedAccounts()
  let deployerNonce = await ethers.provider.getTransactionCount(deployer);
  const AiCooHubProxyNonce = hexlify(deployerNonce + 1);
  const AiCooHubProxyAddress =
        '0x' + keccak256(RLP.encode([deployer, AiCooHubProxyNonce])).substr(26);
        
  await deployAndVerifyAndThen({
      hre,
      name: "DerivedNFTImpl",
      contract: 'DerivedNFT',
      args: [AiCooHubProxyAddress],
    })
}

// This is kept during an upgrade. So no upgrade tag.
deployFn.tags = ['DerivedNFTImpl']

export default deployFn
