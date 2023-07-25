/* Imports: Internal */
import { DeployFunction } from 'hardhat-deploy/dist/types'
const { ethers } = require("hardhat");
import {
  getContractFromArtifact,
  isHardhatNode,
} from '../src/deploy-utils'

const deployFn: DeployFunction = async (hre) => {

  const {governance} = await hre.getNamedAccounts()

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
  const ROYALTY_PERCENTAGE = 10;
  await AiCooHubProxy.setMaxRoyalty(MAX_ROYALTY);
  await AiCooHubProxy.setAiCooHubRoyalty(governance, ROYALTY_PERCENTAGE);
  await AiCooHubProxy.setState(1);

  const ModuleGlobals = await getContractFromArtifact(
    hre,
    "ModuleGlobals",
    {
      signerOrProvider: governance,
    }
  )
  if((await isHardhatNode(hre))){
    const Currency = await getContractFromArtifact(
      hre,
      "Currency"
    )
    await ModuleGlobals.whitelistCurrency(Currency.address,true);
  }else{
    await ModuleGlobals.whitelistCurrency("0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",true);
  }
}

// This is kept during an upgrade. So no upgrade tag.
deployFn.tags = ['SetWhiteList']

export default deployFn
