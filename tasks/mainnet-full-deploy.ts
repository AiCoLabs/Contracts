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
import { deployContract, waitForTx } from './helpers/utils';

const MAX_ROYALTY = 1000;
const WMATIC_MainNet_Address = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const WETH_MainNet_Address = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
const USDC_MainNet_Address = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

task('mainnet-full-deploy', 'deploys the OpTreeHub Protocol to mainnet...').setAction(async ({}, hre) => {
  // Note that the use of these signers is a placeholder and is not meant to be used in
  // production.
  const ethers = hre.ethers;
  const accounts = await ethers.getSigners();
  const deployer = accounts[0];
  const governance = accounts[1];
  const treasury = accounts[2];
  const proxyAdminAddress = deployer.address;

  // Nonce management in case of deployment issues
  let deployerNonce = await ethers.provider.getTransactionCount(deployer.address);

  // Here, we pre-compute the nonces and addresses used to deploy the contracts.
  // const nonce = await deployer.getTransactionCount();
  const derivedNFTNonce = hexlify(deployerNonce + 1);
  const opTreeHubProxyNonce = hexlify(deployerNonce + 2);

  const derivedNFTImplAddress =
    '0x' + keccak256(RLP.encode([deployer.address, derivedNFTNonce])).substr(26);
  const opTreeHubProxyAddress =
    '0x' + keccak256(RLP.encode([deployer.address, opTreeHubProxyNonce])).substr(26);

  // Next, we deploy first the hub implementation, then the followNFT implementation, the collectNFT, and finally the
  // hub proxy with initialization.
  console.log('\n\t-- Onwer address:  --', deployer.address, ' Gov address: ', governance.address);


  console.log('\n\t-- Deploying ModuleGlobal Proxy --');
  let moduleGlobal = await deployContract(
    new ModuleGlobals__factory(deployer).deploy(
      governance.address,
      treasury.address,
      1000
    )
  );
  await sleep(1000);
  console.log('ModuleGlobal addr: ', moduleGlobal.address);

  console.log('\n\t-- Deploying opTreeHub Implementation --');

  const opTreeHubImpl = await deployContract(
    new AiCooHub__factory(deployer).deploy(derivedNFTImplAddress, moduleGlobal.address)
  );
  await sleep(1000);
  console.log('opTreeHubImpl addr: ', opTreeHubImpl.address);

  console.log('\n\t-- Deploying derived NFT Implementations --');
  await deployContract(
    new DerivedNFT__factory(deployer).deploy(opTreeHubProxyAddress)
  );
  await sleep(1000);
  console.log('Derived NFT addr: ', derivedNFTImplAddress);

  let data = opTreeHubImpl.interface.encodeFunctionData('initialize', [
    governance.address
  ]);

  console.log('\n\t-- Deploying OpTreeHub Proxy --');
  let proxy = await deployContract(
    new TransparentUpgradeableProxy__factory(deployer).deploy(
      opTreeHubImpl.address,
      proxyAdminAddress,
      data
    )
  );
  await sleep(2000);
  console.log('OpTreeHub Proxy addr: ', proxy.address);

  const opTreeHub = AiCooHub__factory.connect(proxy.address, governance);

  console.log('\n\t-- Deploying freeDerivedRuleModule --');
  const freeDerivedRuleModule = await deployContract(
    new FreeDerivedRule__factory(deployer).deploy(opTreeHub.address)
  );
  await sleep(1000);
  console.log('freeDerivedRuleModule Proxy addr: ', freeDerivedRuleModule.address);

  console.log('\n\t-- Deploying feeDerivedRuleModule --');
  const feeDerivedRuleModule = await deployContract(
    new FeeDerivedRule__factory(deployer).deploy(opTreeHub.address, moduleGlobal.address)
  );
  await sleep(1000);
  console.log('feeDerivedRuleModule addr: ', feeDerivedRuleModule.address);

  // Whitelist the collect modules
  console.log('\n\t-- Whitelisting Derived Modules --');
  await waitForTx(
    opTreeHub.whitelistDerviedModule(freeDerivedRuleModule.address, true)
  );
  await sleep(2000);
  await waitForTx(
    opTreeHub.whitelistDerviedModule(feeDerivedRuleModule.address, true)
  );
  await sleep(2000);
  await waitForTx(
    opTreeHub.setMaxRoyalty(MAX_ROYALTY)
  );
  await sleep(2000);
  await waitForTx(
    opTreeHub.setAiCooHubRoyalty(governance.address, 1000)
  );
  await sleep(2000);
  await waitForTx(
    opTreeHub.setState(1)
  );
  
  //set currency
  await sleep(2000);
  const moduleGlobalW = ModuleGlobals__factory.connect(moduleGlobal.address, governance);
  console.log('\n\t-- set currency into moduleGlobal --');
  await waitForTx(
    moduleGlobalW.whitelistCurrency(WMATIC_MainNet_Address, true)
  );
  await sleep(2000);
  await waitForTx(
    moduleGlobalW.whitelistCurrency(WETH_MainNet_Address, true)
  );
  await sleep(2000);
  await waitForTx(
    moduleGlobalW.whitelistCurrency(USDC_MainNet_Address, true)
  );
  
  // Save and log the addresses
  const addrs = {
    'opTreeHub proxy': opTreeHub.address,
    'opTreeHub impl:': opTreeHubImpl.address,
    'derived NFT impl': derivedNFTImplAddress,
    'free collect module': freeDerivedRuleModule.address,
    'fee collect module': feeDerivedRuleModule.address,
    'moduleGlobal module': moduleGlobal.address,
  };
  const json = JSON.stringify(addrs, null, 2);
  console.log(json);

  fs.writeFileSync('addresses-mainnet.json', json, 'utf-8');
});
