// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import {AiCooDataTypes} from "../libraries/AiCooDataTypes.sol";
import {AiCooStorage} from "../core/storage/AiCooStorage.sol";

/**
 * @title IAiCoo
 *
 * @notice This is the interface for the contract, the main entry point for the protocol.
 * You'll find all the events and external functions, as well as the reasoning behind them here.
 */
interface IAiCooHub {
    function initialize(address newGovernance) external;

    function setGovernance(address newGovernance) external;

    function setEmergencyAdmin(address newEmergencyAdmin) external;

    function setCreateCollectionFee(uint256 createCollectionFee) external;

    function setCollectionFeeAddress(address feeAddress) external;

    function getDerivedNFTImpl() external view returns (address);

    function setState(AiCooDataTypes.AiCooState newState) external;

    function setMaxRoyalty(uint256 maxRoyalty) external;

    function setAiCooHubRoyalty(
        address newRoyaltyAddress,
        uint256 newRoyaltyRercentage
    ) external;

    function whitelistDerviedModule(
        address derviedModule,
        bool whitelist
    ) external;

    function createNewCollection(
        AiCooDataTypes.CreateNewCollectionData calldata vars
    ) external payable returns (uint256);

    function commitNewNFTIntoCollection(
        AiCooDataTypes.CreateNewNFTData calldata vars
    ) external payable returns (uint256);

    function limitBurnTokenByCollectionOwner(
        AiCooDataTypes.LimitBurnToken calldata vars
    ) external returns (bool);

    function getCollectionInfo(
        uint256 collectionId
    ) external view returns (AiCooStorage.DervideCollectionStruct memory);

    function balanceOf(address owner) external view returns (uint256);
}
