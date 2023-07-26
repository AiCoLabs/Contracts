// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {AiCooDataTypes} from "../libraries/AiCooDataTypes.sol";
import {Errors} from "../libraries/Errors.sol";
import {Events} from "../libraries/Events.sol";
import {MockAiCooStorageV2} from "./MockAiCooStorageV2.sol";
import {VersionedInitializable} from "../upgradeability/VersionedInitializable.sol";
import {AiCooBaseState} from "../core/base/AiCooBaseState.sol";
import {IAiCooHub} from "../interfaces/IAiCooHub.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IDerivedNFT} from "../interfaces/IDerivedNFT.sol";
import {IDerivedRuleModule} from "../interfaces/IDerivedRuleModule.sol";

contract MockAiCooHubV2 is
    VersionedInitializable,
    AiCooBaseState,
    MockAiCooStorageV2
{
    uint256 internal constant REVISION = 2;

    function initialize(uint256 newValue) external initializer {
        _additionalValue = newValue;
    }

    function setAdditionalValue(uint256 newValue) external {
        _additionalValue = newValue;
    }

    function getAdditionalValue() external view returns (uint256) {
        return _additionalValue;
    }

    function getRevision() internal pure virtual override returns (uint256) {
        return REVISION;
    }
}
