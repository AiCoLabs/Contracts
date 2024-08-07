import '@nomiclabs/hardhat-ethers';
import { expect } from 'chai';
import {
    DerivedNFT,
    DerivedNFT__factory,
} from '../../typechain-types';
import {
    makeSuiteCleanRoom,
    user,
    userTwo,
    governance,
    aiCooHub,
    MOCK_URI,
    freeDerivedRule,
    feeDerivedRule,
    abiCoder,
    tomorrow,
    userAddress,
    userTwoAddress,
} from '../__setup.spec';
import helpers from "@nomicfoundation/hardhat-network-helpers";
import { ERRORS } from '../helpers/errors';
  
makeSuiteCleanRoom('Limit Burn NFT', function () {
    context('Generic', function () {
        beforeEach(async function () {
            await expect(
                aiCooHub.connect(governance).whitelistDerviedModule(freeDerivedRule.address, true)
            ).to.not.be.reverted;
            await expect(
                aiCooHub.connect(governance).whitelistDerviedModule(feeDerivedRule.address, true)
            ).to.not.be.reverted;
            await expect( aiCooHub.connect(user).createNewCollection({
                royalty: 500,
                collectionType: 1,
                collInfoURI: MOCK_URI,
                collName: "Skull",
                collSymbol: "Skull",
                derivedRuleModule: freeDerivedRule.address,
                derivedRuleModuleInitData: abiCoder.encode(['uint256','uint256'], [1000, tomorrow]),
            })).to.not.be.reverted;
            await expect(aiCooHub.connect(user).commitNewNFTIntoCollection({
                collectionId: 0,
                nftInfoURI: MOCK_URI,
                derivedFrom: 0,
                derivedModuleData: abiCoder.encode(['bool'], [false]),
                proof: [],
            })).to.be.not.reverted;

            const info = await aiCooHub.getCollectionInfo(0)
            expect(info.creator).to.eq(userAddress);
            expect(info.derivedRuletModule).to.eq(freeDerivedRule.address);
            let derivedNft: DerivedNFT = DerivedNFT__factory.connect(info.derivedNFTAddr, user)
            expect(await derivedNft.getLastTokenId()).to.equal(1)
            expect(await derivedNft.balanceOf(userAddress)).to.equal(1)

            await expect(aiCooHub.connect(userTwo).commitNewNFTIntoCollection({
                collectionId: 0,
                nftInfoURI: MOCK_URI,
                derivedFrom: 0,
                derivedModuleData: abiCoder.encode(['bool'], [false]),
                proof: [],
            })).to.be.not.reverted;
        });
        context('Negatives', async function () {
            it('UserTwo can not burn the nft not owned', async function () {
                await expect(aiCooHub.connect(userTwo).limitBurnTokenByCollectionOwner({
                    collectionId: 0,
                    tokenId: 0,
                })).to.be.revertedWithCustomError(aiCooHub, ERRORS.NOT_COLLECTION_OWNER);
            });
            await helpers.time.increase(8 * 24 * 3600);

            it('User can not burn the nft cause time exceed', async function () {
                await expect(aiCooHub.connect(user).limitBurnTokenByCollectionOwner({
                    collectionId: 0,
                    tokenId: 0,
                })).to.be.revertedWithCustomError(aiCooHub, ERRORS.BURN_EXPIRE_ONE_WEEK);
            });
        })
        context('Scenarios', function () {
            it('User can burn the nft sucess in time', async function () {
                await expect(aiCooHub.connect(user).limitBurnTokenByCollectionOwner({
                    collectionId: 0,
                    tokenId: 0,
                })).to.be.revertedWithCustomError(aiCooHub, ERRORS.CAN_NOT_DELETE_ZERO_NFT);

                await expect(aiCooHub.connect(user).limitBurnTokenByCollectionOwner({
                    collectionId: 0,
                    tokenId: 1,
                })).to.be.not.reverted;

                const info = await aiCooHub.getCollectionInfo(0)
                expect(info.creator).to.eq(userAddress);
                expect(info.derivedRuletModule).to.eq(freeDerivedRule.address);
                let derivedNft: DerivedNFT = DerivedNFT__factory.connect(info.derivedNFTAddr, user)
                expect(await derivedNft.getLastTokenId()).to.equal(2)
                expect(await derivedNft.balanceOf(userTwoAddress)).to.equal(0)

            });
        })
    })
})