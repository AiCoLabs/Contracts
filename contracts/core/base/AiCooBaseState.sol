// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import {Events} from "../../libraries/Events.sol";
import {AiCooDataTypes as DataTypes} from "../../libraries/AiCooDataTypes.sol";
import {Errors} from "../../libraries/Errors.sol";

abstract contract AiCooBaseState {
    DataTypes.AiCooState public _state;
    address public _aiCooHubRoyaltyAddress;
    uint32 public _aiCooHubRoyaltyRercentage;
    uint32 public _maxRoyalty;
    uint32 public _createCollectionFee;
    address public _collectionFeeAddress;

    modifier whenNotPaused() {
        _validateNotPaused();
        _;
    }

    function getState() external view returns (DataTypes.AiCooState) {
        return _state;
    }

    function _setState(DataTypes.AiCooState newState) internal {
        DataTypes.AiCooState prevState = _state;
        _state = newState;
        emit Events.StateSet(msg.sender, prevState, newState, block.timestamp);
    }

    function _setMaxRoyalty(uint256 newRoyalty) internal {
        uint32 prevMaxRoyalty = _maxRoyalty;
        _maxRoyalty = uint32(newRoyalty);
        emit Events.MaxRoyaltySet(
            msg.sender,
            prevMaxRoyalty,
            _maxRoyalty,
            block.timestamp
        );
    }

    function _setCreateCollectionFee(uint256 newCreateCollectionFee) internal {
        uint32 prevCreateCollectionFee = _createCollectionFee;
        _createCollectionFee = uint32(newCreateCollectionFee);
        emit Events.CreateCollectionFeeSet(
            msg.sender,
            prevCreateCollectionFee,
            _createCollectionFee,
            block.timestamp
        );
    }

    function _setCollectionFeeAddress(
        address newCollectionFeeAddress
    ) internal {
        address prevCollectionFeeAddress = _collectionFeeAddress;
        _collectionFeeAddress = newCollectionFeeAddress;
        emit Events.CollectionFeeAddressSet(
            msg.sender,
            prevCollectionFeeAddress,
            _collectionFeeAddress,
            block.timestamp
        );
    }

    function _setAiCooHubRoyalty(
        address newRoyaltyAddress,
        uint256 newRoyaltyRercentage
    ) internal {
        _aiCooHubRoyaltyAddress = newRoyaltyAddress;
        _aiCooHubRoyaltyRercentage = uint32(newRoyaltyRercentage);
        emit Events.AiCooRoyaltyDataSet(
            msg.sender,
            _aiCooHubRoyaltyAddress,
            _aiCooHubRoyaltyRercentage,
            block.timestamp
        );
    }

    function _validateNotPaused() internal view {
        if (_state == DataTypes.AiCooState.Paused) revert Errors.Paused();
        if (
            _maxRoyalty == 0 ||
            _aiCooHubRoyaltyAddress == address(0x0) ||
            _aiCooHubRoyaltyRercentage == 0
        ) revert Errors.InitParamsInvalid();
    }
}
