// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import {Errors} from "../../../libraries/Errors.sol";
import {Events} from "../../../libraries/Events.sol";

abstract contract ModuleBase {
    address public immutable AICOOHUB;

    modifier onlyAiCooHub() {
        if (msg.sender != AICOOHUB) revert Errors.NotOpTreeHub();
        _;
    }

    constructor(address aiCooHub) {
        if (aiCooHub == address(0)) revert Errors.InitParamsInvalid();
        AICOOHUB = aiCooHub;
        emit Events.ModuleBaseConstructed(aiCooHub, block.timestamp);
    }
}
