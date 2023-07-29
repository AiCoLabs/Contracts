/* Imports: Internal */
import { DeployFunction } from 'hardhat-deploy/dist/types'
import {
  getContractFromArtifact,
  isHardhatNode,
} from '../src/deploy-utils'

const deployFn: DeployFunction = async (hre) => {

  const {governance, treasury} = await hre.getNamedAccounts()

  const FreeDerivedRule = await getContractFromArtifact(
    hre,
    "FreeDerivedRule"
  )

  const FeeDerivedRule = await getContractFromArtifact(
    hre,
    "FeeDerivedRule"
  )

  const AiCooHubProxy = await getContractFromArtifact(
    hre,
    "AiCooHubProxy",
    {
      iface: 'AiCooHub',
      signerOrProvider: governance,
    }
  )

  await AiCooHubProxy.whitelistDerviedModule(FreeDerivedRule.address, true);
  await AiCooHubProxy.whitelistDerviedModule(FeeDerivedRule.address, true);

  const MAX_ROYALTY = 1000;
  const ROYALTY_PERCENTAGE = 1000;
  await AiCooHubProxy.setMaxRoyalty(MAX_ROYALTY);
  await AiCooHubProxy.setAiCooHubRoyalty(treasury, ROYALTY_PERCENTAGE);
  await AiCooHubProxy.setState(0);

  const ModuleGlobals = await getContractFromArtifact(
    hre,
    "ModuleGlobals",
    {
      signerOrProvider: governance,
    }
  )
  const ETH_ADDRESS = '0x0000000000000000000000000000000000000001';
  await ModuleGlobals.whitelistCurrency(ETH_ADDRESS,true);
  if((await isHardhatNode(hre))){
    const Currency = await getContractFromArtifact(
      hre,
      "Currency"
    )
    await ModuleGlobals.whitelistCurrency(Currency.address,true);
  }else{
    await ModuleGlobals.whitelistCurrency("0x6175a8471C2122f778445e7E07A164250a19E661",true);
  }
}

// This is kept during an upgrade. So no upgrade tag.
deployFn.tags = ['SetWhiteList']

export default deployFn
