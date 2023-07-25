/* Imports: Internal */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployAndVerifyAndThen,
  getContractFromArtifact,
  isHardhatNode,
} from '../src/deploy-utils'
import { hexlify, keccak256, RLP } from 'ethers/lib/utils';

const deployFn: DeployFunction = async (hre) => {

  const AiCooHubProxy = await getContractFromArtifact(
    hre,
    "AiCooHubProxy"
  )

  await deployAndVerifyAndThen({
      hre,
      name: "FreeDerivedRule",
      contract: 'FreeDerivedRule',
      args: [AiCooHubProxy.address],
    })
}

// This is kept during an upgrade. So no upgrade tag.
deployFn.tags = ['FreeDerivedRule']

export default deployFn
