import '@nomiclabs/hardhat-ethers';
import { hexlify, keccak256, RLP } from 'ethers/lib/utils';
import fs from 'fs';
import { task } from 'hardhat/config';
import {
  DerivedNFT__factory,
  AiCooHub__factory,
  FreeDerivedRule__factory,
  TransparentUpgradeableProxy__factory,
  ModuleGlobals__factory,
  FeeDerivedRule__factory,
} from '../typechain-types';
import { waitForTx, deployWithVerify } from './helpers/utils';

const MAX_ROYALTY = 1000;
const WMATIC_Test_Address = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";
const WETH_Test_Address = "0x3C68CE8504087f89c640D02d133646d98e64ddd9";
const USDC_Test_Address = "0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e";

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

task('testnet-full-deploy-verify', 'deploys the AiCooHub Protocol to testnet and verify...').setAction(async ({}, hre) => {
  // Note that the use of these signers is a placeholder and is not meant to be used in
  // production.
  const ethers = hre.ethers;
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const governance = accounts[1];
  const treasury = accounts[2];
  const proxyAdminAddress = deployer.address;

  console.log('\n\t-- Deploying ModuleGlobal Proxy --');
  let moduleGlobal = await deployWithVerify(
    new ModuleGlobals__factory(deployer).deploy(
      governance.address,
      treasury.address,
      1000
    ),
    [governance.address, treasury.address, 1000],
    'contracts/core/derivedrule/base/ModuleGlobals.sol:ModuleGlobals'
  );
  await sleep(1000);
  console.log('ModuleGlobal addr: ', moduleGlobal.address);

  // Nonce management in case of deployment issues
  let deployerNonce = await ethers.provider.getTransactionCount(deployer.address);

  // Here, we pre-compute the nonces and addresses used to deploy the contracts.
  // const nonce = await deployer.getTransactionCount();
  const derivedNFTNonce = hexlify(deployerNonce + 1);
  const aiCooHubProxyNonce = hexlify(deployerNonce + 2);

  const derivedNFTImplAddress =
    '0x' + keccak256(RLP.encode([deployer.address, derivedNFTNonce])).substr(26);
  const aiCooHubProxyAddress =
    '0x' + keccak256(RLP.encode([deployer.address, aiCooHubProxyNonce])).substr(26);

  // Next, we deploy first the hub implementation, then the followNFT implementation, the collectNFT, and finally the
  // hub proxy with initialization.
  console.log('\n\t-- Onwer address:  --', deployer.address, ' Gov address: ', governance.address);

  console.log('\n\t-- Deploying aiCooHub Implementation --');

  const aiCooHubImpl = await deployWithVerify(
    new AiCooHub__factory(deployer).deploy(derivedNFTImplAddress, moduleGlobal.address),
    [derivedNFTImplAddress, moduleGlobal.address],
    'contracts/core/AiCooHub.sol:AiCooHub'
  );
  await sleep(1000);
  console.log('aiCooHubImpl addr: ', aiCooHubImpl.address);

  console.log('\n\t-- Deploying derived NFT Implementations --');
  await deployWithVerify(
    new DerivedNFT__factory(deployer).deploy(aiCooHubProxyAddress),
    [aiCooHubProxyAddress],
    "contracts/core/DerivedNFT.sol:DerivedNFT"
  );
  await sleep(1000);
  console.log('Derived NFT addr: ', derivedNFTImplAddress);

  let data = aiCooHubImpl.interface.encodeFunctionData('initialize', [
    governance.address
  ]);

  console.log('\n\t-- Deploying AiCooHub Proxy --');
  let proxy = await deployWithVerify(
    new TransparentUpgradeableProxy__factory(deployer).deploy(
      aiCooHubImpl.address,
      proxyAdminAddress,
      data
    ),
    [aiCooHubImpl.address, proxyAdminAddress, data],
    'contracts/upgradeability/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy'
  );
  await sleep(2000);
  console.log('AiCooHub Proxy addr: ', proxy.address);

  const aiCooHub = AiCooHub__factory.connect(proxy.address, governance);

  console.log('\n\t-- Deploying freeDerivedRuleModule --');
  const freeDerivedRuleModule = await deployWithVerify(
    new FreeDerivedRule__factory(deployer).deploy(aiCooHub.address),
    [aiCooHub.address],
    'contracts/core/derivedrule/FreeDerivedRule.sol:FreeDerivedRule'
  );
  await sleep(1000);
  console.log('freeDerivedRuleModule Proxy addr: ', freeDerivedRuleModule.address);

  console.log('\n\t-- Deploying feeDerivedRuleModule --');
  const feeDerivedRuleModule = await deployWithVerify(
    new FeeDerivedRule__factory(deployer).deploy(aiCooHub.address, moduleGlobal.address),
    [aiCooHub.address, moduleGlobal.address],
    'contracts/core/derivedrule/FeeDerivedRule.sol:FeeDerivedRule'
  );
  await sleep(1000);
  console.log('feeDerivedRuleModule addr: ', feeDerivedRuleModule.address);

  // Whitelist the collect modules
  console.log('\n\t-- Whitelisting Derived Modules --');
  await waitForTx(
    aiCooHub.whitelistDerviedModule(freeDerivedRuleModule.address, true)
  );
  await sleep(2000);
  await waitForTx(
    aiCooHub.whitelistDerviedModule(feeDerivedRuleModule.address, true)
  );
  await sleep(2000);
  await waitForTx(
    aiCooHub.setMaxRoyalty(MAX_ROYALTY)
  );
  await sleep(2000);
  await waitForTx(
    aiCooHub.setAiCooHubRoyalty(governance.address, 1000)
  );
  await sleep(2000);
  await waitForTx(
    aiCooHub.setState(1)
  );
  
  //set currency
  await sleep(2000);
  const moduleGlobalW = ModuleGlobals__factory.connect(moduleGlobal.address, governance);
  console.log('\n\t-- set currency into moduleGlobal --');
  await waitForTx(
    moduleGlobalW.whitelistCurrency(WMATIC_Test_Address, true)
  );
  await sleep(2000);
  await waitForTx(
    moduleGlobalW.whitelistCurrency(WETH_Test_Address, true)
  );
  await sleep(2000);
  await waitForTx(
    moduleGlobalW.whitelistCurrency(USDC_Test_Address, true)
  );
  
  // Save and log the addresses
  const addrs = {
    'aiCooHub proxy': aiCooHub.address,
    'aiCooHub impl:': aiCooHubImpl.address,
    'derived NFT impl': derivedNFTImplAddress,
    'free collect module': freeDerivedRuleModule.address,
    'fee collect module': feeDerivedRuleModule.address,
    'moduleGlobal module': moduleGlobal.address,
  };
  const json = JSON.stringify(addrs, null, 2);
  console.log(json);

  fs.writeFileSync('addresses-testnet.json', json, 'utf-8');
});
