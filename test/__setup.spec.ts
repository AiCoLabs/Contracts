
import '@nomiclabs/hardhat-ethers';
import { expect, use } from 'chai';
import { BytesLike, Signer, Wallet } from 'ethers';
import { ethers } from 'hardhat';
import {
  ModuleGlobals,
  ModuleGlobals__factory,
  DerivedNFT,
  DerivedNFT__factory,
  AiCooHub,
  AiCooHub__factory,
  FreeDerivedRule,
  FreeDerivedRule__factory,
  TransparentUpgradeableProxy__factory,
  FeeDerivedRule,
  FeeDerivedRule__factory,
  Currency,
  Currency__factory,
  Events,
  Events__factory,
} from '../typechain-types';
import {
  computeContractAddress,
  AiCooState,
  revertToSnapshot,
  takeSnapshot,
} from './helpers/utils';
import hre from 'hardhat'
import { ERRORS } from './helpers/errors';
import { FAKE_PRIVATEKEY, ZERO_ADDRESS } from './helpers/constants';

export const BPS_MAX = 10000;
export const TREASURY_FEE_BPS = 50;
export const REFERRAL_FEE_BPS = 250;
export const ROYALTY = 1000;
export const MOCK_URI = 'https://ipfs.io/ipfs/QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR';
export const OTHER_MOCK_URI = 'https://ipfs.io/ipfs/QmSfyMcnh1wnJHrAWCBjZHapTS859oNSsuDFiAPPdAHgHP';
export let accounts: Signer[];
export let deployer: Signer;
export let user: Signer;
export let userTwo: Signer;
export let userThree: Signer;
export let governance: Signer;
export let treasury: Signer;
export let admin: Signer;
export let deployerAddress: string;
export let userAddress: string;
export let userTwoAddress: string;
export let userThreeAddress: string;
export let governanceAddress: string;
export let treasuryAddress: string;
export let adminAddress: string;
export let testWallet: Wallet;
export let moduleGlobals: ModuleGlobals;
export let derivedNFTImpl: DerivedNFT;
export let aiCooHubImpl: AiCooHub;
export let aiCooHub: AiCooHub;
export let currency: Currency;
export let freeDerivedRule: FreeDerivedRule;
export let feeDerivedRule: FeeDerivedRule;
export let eventsLib: Events;
export let abiCoder = hre.ethers.utils.defaultAbiCoder;
export let yestoday = parseInt((new Date().getTime() / 1000 ).toFixed(0)) - 24 * 3600
export let now = parseInt((new Date().getTime() / 1000 ).toFixed(0))
export let tomorrow = parseInt((new Date().getTime() / 1000 ).toFixed(0)) + 24 * 3600

export function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function makeSuiteCleanRoom(name: string, tests: () => void) {
  describe(name, () => {
    beforeEach(async function () {
      await takeSnapshot();
    });
    tests();
    afterEach(async function () {
      await revertToSnapshot();
    });
  });
}

before(async function () {
  abiCoder = ethers.utils.defaultAbiCoder;
  testWallet = new ethers.Wallet(FAKE_PRIVATEKEY).connect(ethers.provider);
  accounts = await ethers.getSigners();
  deployer = accounts[0];
  user = accounts[1];
  userTwo = accounts[2];
  userThree = accounts[3];
  governance = accounts[4];
  treasury = accounts[5];
  admin = accounts[6];

  deployerAddress = await deployer.getAddress();
  userAddress = await user.getAddress();
  userTwoAddress = await userTwo.getAddress();
  userThreeAddress = await userThree.getAddress();
  governanceAddress = await governance.getAddress();
  treasuryAddress = await treasury.getAddress();
  adminAddress = await admin.getAddress();

  moduleGlobals = await new ModuleGlobals__factory(deployer).deploy(
    governanceAddress,
    treasuryAddress,
    TREASURY_FEE_BPS
  );
  
  //mockLensHub = await new MockLensHub__factory(deployer).deploy();
  // Here, we pre-compute the nonces and addresses used to deploy the contracts.
  const nonce = await deployer.getTransactionCount();
  // nonce + 0 is dervied NFT impl
  // nonce + 1 is impl
  // nonce + 2 is optreehub proxy

  const hubProxyAddress = computeContractAddress(deployerAddress, nonce + 2); //'0x' + keccak256(RLP.encode([deployerAddress, hubProxyNonce])).substr(26);

  derivedNFTImpl = await new DerivedNFT__factory(deployer).deploy(hubProxyAddress);
  aiCooHubImpl = await new AiCooHub__factory(deployer).deploy(
    derivedNFTImpl.address,
    moduleGlobals.address
  );

  let data = aiCooHubImpl.interface.encodeFunctionData('initialize', [
    governanceAddress,
  ]);
  let proxy = await new TransparentUpgradeableProxy__factory(deployer).deploy(
    aiCooHubImpl.address,
    deployerAddress,
    data
  );
  
  // Connect the hub proxy to the LensHub factory and the user for ease of use.
  aiCooHub = AiCooHub__factory.connect(proxy.address, user);

  // Currency
  currency = await new Currency__factory(deployer).deploy();

  // Modules
  freeDerivedRule = await new FreeDerivedRule__factory(deployer).deploy(aiCooHub.address);
  feeDerivedRule = await new FeeDerivedRule__factory(deployer).deploy(aiCooHub.address, moduleGlobals.address);

  await expect(aiCooHub.connect(governance).setEmergencyAdmin(adminAddress)).to.not.be.reverted;
  await expect(aiCooHub.connect(admin).setState(AiCooState.CreateCollectionPaused)).to.be.revertedWithCustomError(aiCooHub, ERRORS.EMERGENCYADMIN_JUST_CAN_PAUSE);

  await expect(aiCooHub.connect(governance).setState(AiCooState.CreateCollectionPaused)).to.not.be.reverted;
  await expect(aiCooHub.connect(governance).setMaxRoyalty(1000)).to.not.be.reverted;
  await expect(aiCooHub.connect(governance).setAiCooHubRoyalty(treasuryAddress, 1000)).to.not.be.reverted;

  await expect(aiCooHub.connect(user).setMaxRoyalty(1000)).to.be.revertedWithCustomError(aiCooHub, ERRORS.NOT_GOVERNANCE);
  await expect(aiCooHub.connect(user).setState(AiCooState.CreateCollectionPaused)).to.be.revertedWithCustomError(aiCooHub, ERRORS.NOT_GOVERNANCE_OR_EMERGENCYADMIN);
  await expect(aiCooHub.connect(user).setAiCooHubRoyalty(treasuryAddress, 1000)).to.be.revertedWithCustomError(aiCooHub, ERRORS.NOT_GOVERNANCE);
  await expect(aiCooHub.connect(user).setEmergencyAdmin(adminAddress)).to.be.revertedWithCustomError(aiCooHub, ERRORS.NOT_GOVERNANCE);
  await expect(aiCooHub.connect(user).setCreateCollectionFee(1000)).to.be.revertedWithCustomError(aiCooHub, ERRORS.NOT_GOVERNANCE);
  await expect(aiCooHub.connect(user).setCollectionFeeAddress(adminAddress)).to.be.revertedWithCustomError(aiCooHub, ERRORS.NOT_GOVERNANCE);

  expect(aiCooHub).to.not.be.undefined;
  expect(currency).to.not.be.undefined;

  // Event library deployment is only needed for testing and is not reproduced in the live environment
  eventsLib = await new Events__factory(deployer).deploy();
});
