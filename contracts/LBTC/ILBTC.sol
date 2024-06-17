// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ILBTC {
    error ProofAlreadyUsed();
    error BadChainId(uint256 expected, uint256 received);
    error ZeroAmount();
    error ZeroAddress();
    error WithdrawalsDisabled();
    error WBTCStakingDisabled();
    error WBTCNotSet();
    error WBTCDecimalsMissmatch(uint8 expected, uint8 got);
    error InvalidContractAddress();
    error EventFromUnknownContract();
    error BadFromToken();
    error InvalidType();
    error KnownDestination();
    error UnknownDestination();
    error BadSignature();
    error BadCommission();

    struct Metadata {
        bytes32 symbol;
        bytes32 name;
        uint256 originChain;
        address originAddress;
    }

    event UnstakeRequest(address fromAddress, bytes32 toAddress, uint256 amount);
    event WithdrawalsEnabled(bool);
    event NameAndSymbolChanged(string name, string symbol);
    event ConsortiumChanged(address prevVal, address newVal);
    event OutputProcessed(bytes32 transactionId, uint32 index, bytes32 hash);
    event WBTCStaked(address staker, address to, uint256 amount);
    event WBTCStakingEnabled(bool);
    event WBTCChanged(address prevVal, address newVal);
    event BridgeDestinationAdded(uint256 indexed toChain, address indexed toToken);
    event BridgeDestinationRemoved(uint256 indexed toChain, address indexed toToken);
    event DepositToBridge(uint256 chainId, address indexed fromAddress, address indexed toAddress, address fromToken, address toToken, uint256 totalAmount, uint256 nonce);
    event WithdrawFromBridge(bytes32 receiptHash, address indexed fromAddress, address indexed toAddress, address fromToken, address toToken, uint256 totalAmount);
    event DepositCommissionChanged(uint16 newValue, uint256 toChain);
    event TreasuryAddressChanged(address prevValue, address newValue);


    function depositToBridge(uint256 toChain, address toAddress, uint256 amount) external;

    function withdrawFromBridge(bytes calldata encodedProof, bytes calldata rawReceipt, bytes memory receiptRootSignature) external;

}
