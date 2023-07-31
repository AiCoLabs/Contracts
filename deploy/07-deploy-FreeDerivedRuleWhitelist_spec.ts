/* Imports: Internal */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployAndVerifyAndThen,
  getContractFromArtifact,
} from '../src/deploy-utils'

const deployFn: DeployFunction = async (hre) => {

  const AiCooHubProxy = await getContractFromArtifact(
    hre,
    "AiCooHubProxy"
  )

  const ModuleGlobals = await getContractFromArtifact(
    hre,
    "ModuleGlobals"
  )

  await deployAndVerifyAndThen({
      hre,
      name: "WhitelistFreeDerivedRule",
      contract: 'WhitelistFreeDerivedRule',
      args: [AiCooHubProxy.address],
    })
}

// This is kept during an upgrade. So no upgrade tag.
deployFn.tags = ['WhitelistFreeDerivedRule']

export default deployFn
