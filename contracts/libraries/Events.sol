// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import {AiCooDataTypes as DataTypes} from "./AiCooDataTypes.sol";

library Events {
    event EmergencyAdminSet(
        address indexed caller,
        address indexed oldEmergencyAdmin,
        address indexed newEmergencyAdmin,
        uint256 timestamp
    );

    event GovernanceSet(
        address indexed caller,
        address indexed prevGovernance,
        address indexed newGovernance,
        uint256 timestamp
    );

    event StateSet(
        address indexed caller,
        DataTypes.AiCooState indexed prevState,
        DataTypes.AiCooState indexed newState,
        uint256 timestamp
    );

    event MaxRoyaltySet(
        address indexed caller,
        uint32 indexed prevMaxBaseRoyalty,
        uint32 indexed newMaxBaseRoyalty,
        uint256 timestamp
    );

    event CollectionFeeAddressSet(
        address indexed caller,
        address indexed prevMaxBaseRoyalty,
        address indexed newMaxBaseRoyalty,
        uint256 timestamp
    );

    event CreateCollectionFeeSet(
        address indexed caller,
        uint32 indexed prevMaxBaseRoyalty,
        uint32 indexed newMaxBaseRoyalty,
        uint256 timestamp
    );

    event AiCooRoyaltyDataSet(
        address indexed caller,
        address indexed royaltyAddr,
        uint32 indexed percentage,
        uint256 timestamp
    );

    event NewCollectionCreated(
        address indexed collectionOwner,
        uint256 indexed collectionId,
        uint256 baseRoyalty,
        DataTypes.CollectionType collectionType,
        address derivedCollectionAddr,
        string collInfoURI,
        address derivedRuleModule,
        uint256 timestamp
    );

    event NewCollectionMintInfo(
        uint256 collectionId,
        uint256 mintLimit,
        uint256 mintExpired,
        uint256 mintPrice,
        bytes32 whiteListRootHash
    );

    event BurnNFTFromCollection(
        uint256 collectionId,
        uint256 nftId,
        address burner,
        address owner,
        uint256 timestamp
    );

    event NewNFTCreated(
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        uint256 derivedFrom,
        address creator,
        string nftInfoURI
    );

    event BaseInitialized(string name, string symbol, uint256 timestamp);

    event ModuleBaseConstructed(address indexed aiCooHub, uint256 timestamp);

    event DerivedNFTInitialized(
        uint256 indexed collectionId,
        uint256 timestamp
    );

    event DerivedRuleModuleWhitelisted(
        address derivedRuleModule,
        bool whitelist,
        uint256 timestamp
    );

    /**
     * @notice Emitted when the ModuleGlobals governance address is set.
     *
     * @param prevGovernance The previous governance address.
     * @param newGovernance The new governance address set.
     * @param timestamp The current block timestamp.
     */
    event ModuleGlobalsGovernanceSet(
        address indexed prevGovernance,
        address indexed newGovernance,
        uint256 timestamp
    );

    /**
     * @notice Emitted when the ModuleGlobals treasury address is set.
     *
     * @param prevTreasury The previous treasury address.
     * @param newTreasury The new treasury address set.
     * @param timestamp The current block timestamp.
     */
    event ModuleGlobalsTreasurySet(
        address indexed prevTreasury,
        address indexed newTreasury,
        uint256 timestamp
    );

    /**
     * @notice Emitted when the ModuleGlobals treasury fee is set.
     *
     * @param prevTreasuryFee The previous treasury fee in BPS.
     * @param newTreasuryFee The new treasury fee in BPS.
     * @param timestamp The current block timestamp.
     */
    event ModuleGlobalsTreasuryFeeSet(
        uint16 indexed prevTreasuryFee,
        uint16 indexed newTreasuryFee,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a currency is added to or removed from the ModuleGlobals whitelist.
     *
     * @param currency The currency address.
     * @param prevWhitelisted Whether or not the currency was previously whitelisted.
     * @param whitelisted Whether or not the currency is whitelisted.
     * @param timestamp The current block timestamp.
     */
    event ModuleGlobalsCurrencyWhitelisted(
        address indexed currency,
        bool indexed prevWhitelisted,
        bool indexed whitelisted,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a module inheriting from the `FeeModuleBase` is constructed.
     *
     * @param moduleGlobals The ModuleGlobals contract address used.
     * @param timestamp The current block timestamp.
     */
    event FeeModuleBaseConstructed(
        address indexed moduleGlobals,
        uint256 timestamp
    );
}
