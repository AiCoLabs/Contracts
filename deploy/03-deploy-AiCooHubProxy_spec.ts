/* Imports: Internal */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  deployAndVerifyAndThen,
  getContractFromArtifact,
} from '../src/deploy-utils'

const deployFn: DeployFunction = async (hre) => {
  const AiCooHubImpl = await getContractFromArtifact(
    hre,
    "AiCooHubImpl"
  )
  const { deployer,  governance} = await hre.getNamedAccounts()

  let data = AiCooHubImpl.interface.encodeFunctionData('initialize', [
    governance
  ]);

  await deployAndVerifyAndThen({
    hre,
    name: "AiCooHubProxy",
    contract: 'TransparentUpgradeableProxy',
    args: [AiCooHubImpl.address, deployer, data],
  })
}

// This is kept during an upgrade. So no upgrade tag.
deployFn.tags = ['AiCooHubProxy']

export default deployFn
