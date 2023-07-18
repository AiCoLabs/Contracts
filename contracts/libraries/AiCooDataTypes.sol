// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

library AiCooDataTypes {
    enum AiCooState {
        OpenForAll,
        OnlyForLensHandle,
        Paused
    }

    enum CollectionType {
        PixArt,
        PhotoGraph,
        Novel,
        Video,
        Media,
        Model
    }

    struct CreateNewCollectionData {
        uint256 profileId;
        uint256 royalty;
        uint256 addressSalt;
        CollectionType collectionType;
        string collInfoURI;
        string collName;
        string collSymbol;
        address derivedRuleModule;
        bytes derivedRuleModuleInitData;
        address collectModule;
        bytes collectModuleInitData;
        address referenceModule;
        bytes referenceModuleInitData;
    }

    struct CreateNewNFTData {
        uint256 collectionId;
        uint256 profileId;
        string nftInfoURI;
        uint256 derivedFrom;
        bytes derivedModuleData;
        bytes32[] proof;
        bytes referenceModuleData;
        address collectModule;
        bytes collectModuleInitData;
        address referenceModule;
        bytes referenceModuleInitData;
    }

    struct LimitBurnToken {
        uint256 collectionId;
        uint256 tokenId;
    }

    struct EIP712Signature {
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 deadline;
    }
}
