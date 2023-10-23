import '@nomiclabs/hardhat-ethers';
import { expect } from 'chai';
import {
    makeSuiteCleanRoom,
    user,
    userAddress,
    governance,
    userTwo,
    userTwoAddress,
    aiCooHub,
    MOCK_URI,
    freeDerivedRule,
    abiCoder,
    sleep,
} from '../__setup.spec';
import { ZERO_ADDRESS } from '../helpers/constants';
import { ERRORS } from '../helpers/errors';
import { getTimestamp, setNextBlockTimestamp } from '../helpers/utils';
  
makeSuiteCleanRoom('Free Derived Rule', function () {
    context('Generic', function () {
        beforeEach(async function () {
            await expect(
                aiCooHub.connect(governance).whitelistDerviedModule(freeDerivedRule.address, true)
            ).to.not.be.reverted;
        });
        context('Negatives', function () {
            it('User should fail to create more than mint expired', async function () {
                const timestamp = parseInt((new Date().getTime() / 1000 ).toFixed(0))
                await expect( aiCooHub.connect(user).createNewCollection({
                    royalty: 500,
                    collectionType: 1,
                    collInfoURI: MOCK_URI,
                    collName: "Skull",
                    collSymbol: "Skull",
                    derivedRuleModule: freeDerivedRule.address,
                    derivedRuleModuleInitData: abiCoder.encode(['uint256','uint256'], [1, (timestamp + 100)]),
                })).to.not.be.reverted;
                const currentTimestamp = await getTimestamp();
                await setNextBlockTimestamp(Number(currentTimestamp) + 24 * 60 * 60);

                await expect( aiCooHub.connect(user).commitNewNFTIntoCollection({
                    collectionId: 0,
                    nftInfoURI: MOCK_URI,
                    derivedFrom: 0,
                    derivedModuleData: abiCoder.encode(['bool'], [false]),
                    proof: [],
                })).to.be.revertedWithCustomError(freeDerivedRule, ERRORS.MINT_EXPIRED);
            });
            it('User should fail to create more than mint limit', async function () {
                const timestamp = parseInt((new Date().getTime() / 1000 ).toFixed(0))
                await expect( aiCooHub.connect(user).createNewCollection({
                    royalty: 500,
                    collectionType: 1,
                    collInfoURI: MOCK_URI,
                    collName: "Skull",
                    collSymbol: "Skull",
                    derivedRuleModule: freeDerivedRule.address,
                    derivedRuleModuleInitData: abiCoder.encode(['uint256','uint256'], [1, (timestamp + 24 * 3600)]),
                })).to.not.be.reverted;
                await expect( aiCooHub.connect(user).commitNewNFTIntoCollection({
                    collectionId: 0,
                    nftInfoURI: MOCK_URI,
                    derivedFrom: 0,
                    derivedModuleData: abiCoder.encode(['bool'], [false]),
                    proof: [],
                })).to.not.be.reverted;
                await expect( aiCooHub.connect(user).commitNewNFTIntoCollection({
                    collectionId: 0,
                    nftInfoURI: MOCK_URI,
                    derivedFrom: 0,
                    derivedModuleData: abiCoder.encode(['bool'], [false]),
                    proof: [],
                })).to.be.revertedWithCustomError(freeDerivedRule, ERRORS.MINT_LIMIT_EXCEEDED);
            });
        })

        context('Scenarios', function () {
            it('Should return the expected data when create nft successful', async function () {
                const timestamp = parseInt((new Date().getTime() / 1000 ).toFixed(0))
                await expect( aiCooHub.connect(user).createNewCollection({
                    royalty: 500,
                    collectionType: 1,
                    collInfoURI: MOCK_URI,
                    collName: "Skull",
                    collSymbol: "Skull",
                    derivedRuleModule: freeDerivedRule.address,
                    derivedRuleModuleInitData: abiCoder.encode(['uint256','uint256'], [1, (timestamp + 24 * 3600)]),
                })).to.not.be.reverted;
                await expect( aiCooHub.connect(user).commitNewNFTIntoCollection({
                    collectionId: 0,
                    nftInfoURI: MOCK_URI,
                    derivedFrom: 0,
                    derivedModuleData: abiCoder.encode(['bool'], [false]),
                    proof: [],
                })).to.not.be.reverted;

                const info = await freeDerivedRule.getDerivedRuleDataByCollectionId(0)
                expect(info.mintLimit).to.eq(1);
                expect(info.alreadyMint).to.eq(1);
            });
        })
    })
})