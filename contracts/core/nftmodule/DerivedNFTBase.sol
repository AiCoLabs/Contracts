// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import {IDerivedNFTBase} from "../../interfaces/IDerivedNFTBase.sol";
import {Errors} from "../../libraries/Errors.sol";
import {AiCooDataTypes as DataTypes} from "../../libraries/AiCooDataTypes.sol";
import {Events} from "../../libraries/Events.sol";
import {ERC721Derived} from "../base/ERC721Derived.sol";
import {ERC721URIStorage} from "../base/ERC721URIStorage.sol";

abstract contract DerivedNFTBase is ERC721URIStorage, IDerivedNFTBase {
    bytes32 internal constant EIP712_REVISION_HASH = keccak256("1");
    bytes32 internal constant PERMIT_TYPEHASH =
        keccak256(
            "Permit(address spender,uint256 tokenId,uint256 nonce,uint256 deadline)"
        );
    bytes32 internal constant PERMIT_FOR_ALL_TYPEHASH =
        keccak256(
            "PermitForAll(address owner,address operator,bool approved,uint256 nonce,uint256 deadline)"
        );
    bytes32 internal constant BURN_WITH_SIG_TYPEHASH =
        keccak256(
            "BurnWithSig(uint256 tokenId,uint256 nonce,uint256 deadline)"
        );
    bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    mapping(address => uint256) public sigNonces;

    /**
     * @notice Initializer sets the name, symbol and the cached domain separator.
     *
     * NOTE: Inheritor contracts *must* call this function to initialize the name & symbol in the
     * inherited ERC721 contract.
     *
     * @param name The name to set in the ERC721 contract.
     * @param symbol The symbol to set in the ERC721 contract.
     */
    function _initialize(
        string calldata name,
        string calldata symbol
    ) internal {
        ERC721Derived.__ERC721_Init(name, symbol);

        emit Events.BaseInitialized(name, symbol, block.timestamp);
    }

    function permit(
        address spender,
        uint256 tokenId,
        DataTypes.EIP712Signature calldata sig
    ) external override {
        if (spender == address(0)) revert Errors.ZeroSpender();
        address owner = ownerOf(tokenId);
        unchecked {
            _validateRecoveredAddress(
                _calculateDigest(
                    keccak256(
                        abi.encode(
                            PERMIT_TYPEHASH,
                            spender,
                            tokenId,
                            sigNonces[owner]++,
                            sig.deadline
                        )
                    )
                ),
                owner,
                sig
            );
        }
        _approve(spender, tokenId);
    }

    function permitForAll(
        address owner,
        address operator,
        bool approved,
        DataTypes.EIP712Signature calldata sig
    ) external override {
        if (operator == address(0)) revert Errors.ZeroSpender();
        unchecked {
            _validateRecoveredAddress(
                _calculateDigest(
                    keccak256(
                        abi.encode(
                            PERMIT_FOR_ALL_TYPEHASH,
                            owner,
                            operator,
                            approved,
                            sigNonces[owner]++,
                            sig.deadline
                        )
                    )
                ),
                owner,
                sig
            );
        }
        _setOperatorApproval(owner, operator, approved);
    }

    function getDomainSeparator() external view override returns (bytes32) {
        return _calculateDomainSeparator();
    }

    function burn(uint256 tokenId) public virtual override {
        if (!_isApprovedOrOwner(msg.sender, tokenId))
            revert Errors.NotOwnerOrApproved();
        _burn(tokenId);
    }

    function burnWithSig(
        uint256 tokenId,
        DataTypes.EIP712Signature calldata sig
    ) public virtual override {
        address owner = ownerOf(tokenId);
        unchecked {
            _validateRecoveredAddress(
                _calculateDigest(
                    keccak256(
                        abi.encode(
                            BURN_WITH_SIG_TYPEHASH,
                            tokenId,
                            sigNonces[owner]++,
                            sig.deadline
                        )
                    )
                ),
                owner,
                sig
            );
        }
        _burn(tokenId);
    }

    /**
     * @dev Wrapper for ecrecover to reduce code size, used in meta-tx specific functions.
     */
    function _validateRecoveredAddress(
        bytes32 digest,
        address expectedAddress,
        DataTypes.EIP712Signature calldata sig
    ) internal view {
        if (sig.deadline < block.timestamp) revert Errors.SignatureExpired();
        address recoveredAddress = ecrecover(digest, sig.v, sig.r, sig.s);
        if (
            recoveredAddress == address(0) ||
            recoveredAddress != expectedAddress
        ) revert Errors.SignatureInvalid();
    }

    /**
     * @dev Calculates EIP712 DOMAIN_SEPARATOR based on the current contract and chain ID.
     */
    function _calculateDomainSeparator() internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    EIP712_DOMAIN_TYPEHASH,
                    keccak256(bytes(name())),
                    EIP712_REVISION_HASH,
                    block.chainid,
                    address(this)
                )
            );
    }

    /**
     * @dev Calculates EIP712 digest based on the current DOMAIN_SEPARATOR.
     *
     * @param hashedMessage The message hash from which the digest should be calculated.
     *
     * @return bytes32 A 32-byte output representing the EIP712 digest.
     */
    function _calculateDigest(
        bytes32 hashedMessage
    ) internal view returns (bytes32) {
        bytes32 digest;
        unchecked {
            digest = keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    _calculateDomainSeparator(),
                    hashedMessage
                )
            );
        }
        return digest;
    }
}
