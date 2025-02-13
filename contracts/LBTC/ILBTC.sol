// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface ILBTC {
    error ProofAlreadyUsed();
    error ZeroAddress();
    error ZeroContractHash();
    error ZeroChainId();
    error WithdrawalsDisabled();
    error BadChainId(uint256 expected, uint256 received);
    error BadToContractAddress(address expected, address received);
    error BadDestination();
    error KnownDestination();
    error UnknownDestination();
    error ScriptPubkeyUnsupported();
    error AmountLessThanCommission(uint256 fee);
    error AmountBelowDustLimit(uint256 dustLimit);
    error InvalidDustFeeRate();
    error UnauthorizedAccount(address account);
    event PauserRoleTransferred(address indexed previousPauser, address indexed newPauser);

    event UnstakeRequest(address indexed fromAddress, bytes scriptPubKey, uint256 amount);
    event WithdrawalsEnabled(bool);
    event NameAndSymbolChanged(string name, string symbol);
    event ConsortiumChanged(address indexed prevVal, address indexed newVal);
    event OutputProcessed(bytes32 indexed transactionId, uint32 indexed index, bytes32 proofHash);
    event BridgeDestinationAdded(bytes32 indexed toChain, bytes32 indexed toContract);
    event BridgeDestinationRemoved(bytes32 indexed toChain, bytes32 indexed toContract);
    event DepositToBridge(address indexed fromAddress, bytes32 indexed toAddress, bytes32 toContract, bytes32 chainId, uint64 amount);
    event WithdrawFromBridge(address indexed toAddress, bytes32 indexed txHash, uint32 indexed eventIndex, bytes32 proofHash, bytes32 fromContract, bytes32 fromChainId, uint64 amount);
    event TreasuryAddressChanged(address indexed prevValue, address indexed newValue);
    event DepositAbsoluteCommissionChanged(uint64 newValue, bytes32 indexed toChain);
    event DepositRelativeCommissionChanged(uint16 newValue, bytes32 indexed toChain);
    event BurnCommissionChanged(uint64 indexed prevValue, uint64 indexed newValue);
    event DustFeeRateChanged(uint256 indexed oldRate, uint256 indexed newRate);
    event BasculeChanged(address indexed prevVal, address indexed newVal);
    event MinterUpdated(address indexed minter, bool isMinter);
}
