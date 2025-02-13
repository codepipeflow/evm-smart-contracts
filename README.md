# Lombard Finance EVM smart-contracts
[Website](https://www.lombard.finance/) | [Docs](https://docs.lombard.finance/)

## Overview
LBTC is liquid Bitcoin; it's yield-bearing, cross-chain, and 1:1 backed by BTC. LBTC enables yield-bearing BTC to move cross-chain without fragmenting liquidity, and is designed to seamlessly integrate Bitcoin into the decentralized finance (DeFi) ecosystem while maintaining the security and integrity of the underlying asset.

```mermaid
graph TD
    users1(Users) -- mint(data,proofSignature)  --> lbtc1{{LBTC}}
    lbtc1 -- isValidSignature(hash,signature) --> consortium1{{consortium}}
    lbtc1 -- validateWithdrawal(depositID,withdrawalAmount) --> bascule{{bascule}}
    
    users2(Users) -- redeem(scriptPubkey,amount) --> lbtc2{{LBTC}}

    users3(Users) -- depositToBridge(toChain,toAddress,amount) -->lbtc3A{{LBTC, chain A}}
    users3 -- withdrawFromBridge(data,proofSignature) --> lbtc3B{{LBTC, chain B}}
    lbtc3B -- isValidSignature(hash,signature) --> consortium3{{consortium}}
```

### Addresses
#### Ethereum

| Smart contract    | Description                                                                    | Address                                                                                                               | ProxyAdmin                                                                                                            |
|-------------------|--------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Bascule           | Bascule drawbridge designed to prevent bridge hacks before they hit the chain. | [0xc750eCAC7250E0D18ecE2C7a5F130E3A765dc260](https://etherscan.io/address/0xc750eCAC7250E0D18ecE2C7a5F130E3A765dc260) | -                                                                                                                     |
| LombardConsortium | Stores consortium threshold key and verify signatures                          | [0xed6d647e2f81e5262101aff72c4a7bcdcfd780e0](https://etherscan.io/address/0xed6d647e2f81e5262101aff72c4a7bcdcfd780e0) | [0xa212Db18f8aEC6eF2F08cE42D7B447f9a405CD24](https://etherscan.io/address/0xa212Db18f8aEC6eF2F08cE42D7B447f9a405CD24) |
| LombardTimelock   | Safeguard helps to perform delayed transactions (implementation upgrade)       | [0x055E84e7FE8955E2781010B866f10Ef6E1E77e59](https://etherscan.io/address/0x055E84e7FE8955E2781010B866f10Ef6E1E77e59) | -                                                                                                                     |
| LBTC              | ERC20 token to interact with protocol                                          | [0x8236a87084f8B84306f72007F36F2618A5634494](https://etherscan.io/address/0x8236a87084f8B84306f72007F36F2618A5634494) | [0xbae061C73876952aa2C5e483B74DfA785425f879](https://etherscan.io/address/0xbae061C73876952aa2C5e483B74DfA785425f879) |
| GnosisSafeProxy   | Lombard governance and treasury wallet                                         | [0x251a604E8E8f6906d60f8dedC5aAeb8CD38F4892](https://etherscan.io/address/0x251a604E8E8f6906d60f8dedC5aAeb8CD38F4892) | -                                                                                                                     |


## Installation

### Prerequisites
* Node: v18+

### Tasks
#### Compilation
```bash
yarn hardhat compile
```
#### Tests
```bash
yarn hardhat test
```
#### Deploy
```bash
yarn hardhat deploy-consortium [params]
yarn hardhat deploy-timelock [params]
yarn hardhat deploy-lbtc [params]
```