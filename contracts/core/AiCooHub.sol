// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {AiCooDataTypes} from "../libraries/AiCooDataTypes.sol";
import {Errors} from "../libraries/Errors.sol";
import {Events} from "../libraries/Events.sol";
import {AiCooStorage} from "./storage/AiCooStorage.sol";
import {VersionedInitializable} from "../upgradeability/VersionedInitializable.sol";
import {AiCooBaseState} from "./base/AiCooBaseState.sol";
import {IAiCooHub} from "../interfaces/IAiCooHub.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IDerivedNFT} from "../interfaces/IDerivedNFT.sol";
import {IDerivedRuleModule} from "../interfaces/IDerivedRuleModule.sol";

contract AiCooHub is
    VersionedInitializable,
    AiCooBaseState,
    AiCooStorage,
    IAiCooHub
{
    uint256 internal constant ONE_WEEK = 7 days;
    uint256 internal constant REVISION = 1;

    address internal immutable DERIVED_NFT_IMPL;

    modifier onlyGov() {
        _validateCallerIsGovernance();
        _;
    }

    constructor(address derivedNFTImpl) {
        if (derivedNFTImpl == address(0)) revert Errors.InitParamsInvalid();
        DERIVED_NFT_IMPL = derivedNFTImpl;
    }

    function initialize(address newGovernance) external override initializer {
        _setState(AiCooDataTypes.AiCooState.Paused);
        _setGovernance(newGovernance);
    }

    /// ***********************
    /// *****GOV FUNCTIONS*****
    /// ***********************

    function setGovernance(address newGovernance) external override onlyGov {
        _setGovernance(newGovernance);
    }

    function setEmergencyAdmin(
        address newEmergencyAdmin
    ) external override onlyGov {
        address prevEmergencyAdmin = _emergencyAdmin;
        _emergencyAdmin = newEmergencyAdmin;
        emit Events.EmergencyAdminSet(
            msg.sender,
            prevEmergencyAdmin,
            newEmergencyAdmin,
            block.timestamp
        );
    }

    function setMaxRoyalty(uint256 maxRoyalty) external override onlyGov {
        _setMaxRoyalty(maxRoyalty);
    }

    function setAiCooHubRoyalty(
        address newRoyaltyAddress,
        uint256 newRoyaltyRercentage
    ) external override onlyGov {
        _setAiCooHubRoyalty(newRoyaltyAddress, newRoyaltyRercentage);
    }

    function setState(AiCooDataTypes.AiCooState newState) external override {
        if (msg.sender == _emergencyAdmin) {
            if (newState != AiCooDataTypes.AiCooState.Paused)
                revert Errors.EmergencyAdminJustCanPause();
            _validateNotPaused();
        } else if (msg.sender != _governance) {
            revert Errors.NotGovernanceOrEmergencyAdmin();
        }
        _setState(newState);
    }

    function whitelistDerviedModule(
        address derviedModule,
        bool whitelist
    ) external override onlyGov {
        _derivedRuleModuleWhitelisted[derviedModule] = whitelist;
        emit Events.DerivedRuleModuleWhitelisted(
            derviedModule,
            whitelist,
            block.timestamp
        );
    }

    /// ***************************************
    /// *****EXTERNAL FUNCTIONS*****
    /// ***************************************

    function createNewCollection(
        AiCooDataTypes.CreateNewCollectionData calldata vars
    ) external override whenNotPaused returns (uint256) {
        return _createCollection(msg.sender, vars);
    }

    function commitNewNFTIntoCollection(
        AiCooDataTypes.CreateNewNFTData calldata vars
    ) external override whenNotPaused returns (uint256) {
        checkParams(msg.sender, vars);
        return _createNFT(vars, msg.sender);
    }

    function limitBurnTokenByCollectionOwner(
        AiCooDataTypes.LimitBurnToken calldata vars
    ) external override returns (bool) {
        _validateNotPaused();
        if (_collectionByIdCollInfo[vars.collectionId].creator != msg.sender)
            revert Errors.NotCollectionOwner();
        if (
            block.timestamp >
            IDerivedNFT(
                _collectionByIdCollInfo[vars.collectionId].derivedNFTAddr
            ).getTokenMintTime(vars.tokenId) +
                ONE_WEEK
        ) {
            revert Errors.BurnExpiredOneWeek();
        }
        address ownerOfToken = IERC721(
            _collectionByIdCollInfo[vars.collectionId].derivedNFTAddr
        ).ownerOf(vars.tokenId);

        IDerivedNFT(_collectionByIdCollInfo[vars.collectionId].derivedNFTAddr)
            .burnByCollectionOwner(vars.tokenId);

        IDerivedRuleModule(
            _collectionByIdCollInfo[vars.collectionId].derivedRuletModule
        ).processBurn(vars.collectionId, msg.sender, ownerOfToken);

        emit Events.BurnNFTFromCollection(
            vars.collectionId,
            vars.tokenId,
            msg.sender,
            ownerOfToken,
            block.timestamp
        );

        return true;
    }

    function getCollectionInfo(
        uint256 collectionId
    ) external view returns (DervideCollectionStruct memory) {
        return _collectionByIdCollInfo[collectionId];
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balance[owner];
    }

    /// ****************************
    /// *****INTERNAL FUNCTIONS*****
    /// ****************************

    function _createCollection(
        address creator,
        AiCooDataTypes.CreateNewCollectionData calldata vars
    ) internal returns (uint256) {
        _validateParams(vars.royalty);
        uint256 colltionId = _collectionCounter++;
        address derivedCollectionAddr = _deployDerivedCollection(
            creator,
            colltionId,
            vars
        );

        _setStateVariable(
            colltionId,
            creator,
            derivedCollectionAddr,
            vars.derivedRuleModule,
            vars.derivedRuleModuleInitData
        );
        _emitNewCollectionCreatedEvent(
            creator,
            colltionId,
            derivedCollectionAddr,
            vars
        );
        _emitNewCollectionInfo(vars.derivedRuleModule, colltionId);
        return colltionId;
    }

    function checkParams(
        address creator,
        AiCooDataTypes.CreateNewNFTData calldata vars
    ) internal view {
        if (!_exists(vars.collectionId)) {
            revert Errors.CollectionIdNotExist();
        }
        address derivedNFTAddr = _collectionByIdCollInfo[vars.collectionId]
            .derivedNFTAddr;
        if (IDerivedNFT(derivedNFTAddr).getLastTokenId() == 0) {
            if (
                creator != _collectionByIdCollInfo[vars.collectionId].creator ||
                vars.derivedFrom != 0
            ) {
                revert Errors.JustOwnerCanPublishRootNode();
            }
        } else {
            if (!IDerivedNFT(derivedNFTAddr).exists(vars.derivedFrom)) {
                revert Errors.DerivedFromNFTNotExist();
            }
        }
    }

    function _createNFT(
        AiCooDataTypes.CreateNewNFTData calldata vars,
        address minter
    ) internal returns (uint256) {
        uint256 tokenId = IDerivedNFT(
            _collectionByIdCollInfo[vars.collectionId].derivedNFTAddr
        ).mint(minter, vars.derivedFrom, vars.nftInfoURI);
        IDerivedRuleModule(
            _collectionByIdCollInfo[vars.collectionId].derivedRuletModule
        ).processDerived(minter, vars.collectionId, vars.derivedModuleData);
        _emitCreatedNFTEvent(tokenId, vars);
        return tokenId;
    }

    function _setStateVariable(
        uint256 colltionId,
        address creator,
        address collectionAddr,
        address ruleModule,
        bytes memory ruleModuleInitData
    ) internal returns (bytes memory) {
        if (!_derivedRuleModuleWhitelisted[ruleModule])
            revert Errors.DerivedRuleModuleNotWhitelisted();

        uint256 len = _allCollections.length;
        _balance[creator] += 1;
        _holdIndexes[creator].push(len);
        _collectionByIdCollInfo[colltionId] = DervideCollectionStruct({
            creator: creator,
            derivedNFTAddr: collectionAddr,
            derivedRuletModule: ruleModule
        });
        _allCollections.push(collectionAddr);

        return
            IDerivedRuleModule(ruleModule).initializeDerivedRuleModule(
                colltionId,
                ruleModuleInitData
            );
    }

    function _validateParams(uint256 baseRoyalty) internal view returns (bool) {
        if (baseRoyalty > _maxRoyalty) {
            revert Errors.RoyaltyTooHigh();
        }
        return true;
    }

    function _deployDerivedCollection(
        address collectionOwner,
        uint256 collectionId,
        AiCooDataTypes.CreateNewCollectionData calldata vars
    ) internal returns (address) {
        address derivedCollectionAddr = Clones.clone(DERIVED_NFT_IMPL);

        IDerivedNFT(derivedCollectionAddr).initialize(
            collectionOwner,
            collectionId,
            _aiCooHubRoyaltyAddress,
            _aiCooHubRoyaltyRercentage,
            vars.collName,
            vars.collSymbol,
            vars
        );

        return derivedCollectionAddr;
    }

    function _setGovernance(address newGovernance) internal {
        address prevGovernance = _governance;
        _governance = newGovernance;
        emit Events.GovernanceSet(
            msg.sender,
            prevGovernance,
            newGovernance,
            block.timestamp
        );
    }

    function _validateCallerIsGovernance() internal view {
        if (msg.sender != _governance) revert Errors.NotGovernance();
    }

    function getRevision() internal pure virtual override returns (uint256) {
        return REVISION;
    }

    function getDerivedNFTImpl() external view override returns (address) {
        return DERIVED_NFT_IMPL;
    }

    function _exists(
        uint256 collectionId
    ) internal view virtual returns (bool) {
        return _collectionByIdCollInfo[collectionId].creator != address(0);
    }

    function _emitNewCollectionCreatedEvent(
        address creator,
        uint256 collectionId,
        address derivedCollectionAddr,
        AiCooDataTypes.CreateNewCollectionData calldata vars
    ) private {
        emit Events.NewCollectionCreated(
            creator,
            collectionId,
            vars.royalty,
            vars.collectionType,
            derivedCollectionAddr,
            vars.collInfoURI,
            vars.derivedRuleModule,
            block.timestamp
        );
    }

    function _emitNewCollectionInfo(
        address derivedRuleAddr,
        uint256 collectionId
    ) private {
        emit Events.NewCollectionMintInfo(
            collectionId,
            IDerivedRuleModule(derivedRuleAddr).getMintLimit(collectionId),
            IDerivedRuleModule(derivedRuleAddr).getMintExpired(collectionId),
            IDerivedRuleModule(derivedRuleAddr).getMintPrice(collectionId),
            IDerivedRuleModule(derivedRuleAddr).getWhiteListRootHash(
                collectionId
            )
        );
    }

    function _emitCreatedNFTEvent(
        uint256 tokenId,
        AiCooDataTypes.CreateNewNFTData calldata vars
    ) private {
        emit Events.NewNFTCreated(
            tokenId,
            vars.collectionId,
            vars.derivedFrom,
            vars.nftInfoURI
        );
    }
}
