import { config, ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { takeSnapshot } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { enrichWithPrivateKeys, signData } from "./helpers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { LBTC, WBTCMock } from "../typechain-types";
import { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers/src/helpers/takeSnapshot";
import { lcov } from "node:test/reporters";

async function init(consortium: HardhatEthersSigner) {
  console.log("=== LBTC");
  const LBTC = await ethers.getContractFactory("LBTC");
  const lbtc = (await upgrades.deployProxy(LBTC, [
    consortium.address,
  ])) as unknown as LBTC;
  await lbtc.waitForDeployment();

  console.log("=== LBTC");
  const WBTC = await ethers.getContractFactory("WBTCMock");
  const wbtc = (await upgrades.deployProxy(WBTC, [])) as unknown as WBTCMock;
  await wbtc.waitForDeployment();

  return { lbtc, wbtc };
}

describe("LBTC", function () {
  let deployer: HardhatEthersSigner,
    consortium: HardhatEthersSigner,
    signer1: HardhatEthersSigner,
    signer2: HardhatEthersSigner,
    signer3: HardhatEthersSigner;
  let signers;
  let lbtc: LBTC;
  let snapshot: SnapshotRestorer;
  let wbtc: WBTCMock;

  before(async function () {
    [deployer, consortium, signer1, signer2, signer3] =
      await ethers.getSigners();
    signers = [deployer, consortium, signer1, signer2, signer3];
    await enrichWithPrivateKeys(signers);
    const result = await init(consortium);
    lbtc = result.lbtc;
    wbtc = result.wbtc;
    snapshot = await takeSnapshot();
  });

  describe("Setters and getters", function () {
    beforeEach(async function () {
      await snapshot.restore();
    });

    it("owner() is deployer", async function () {
      expect(await lbtc.owner()).to.equal(deployer.address);
    });

    it("consortium() set at initialization", async function () {
      expect(await lbtc.consortium()).to.equal(consortium.address);
    });

    it("decimals()", async function () {
      expect(await lbtc.decimals()).to.equal(8n);
    });

    it("WBTC() unset", async function () {
      expect(await lbtc.WBTC()).to.be.equal(ethers.ZeroAddress);
    });

    it("WBTC() unset", async function () {
      expect(await lbtc.WBTC()).to.be.equal(ethers.ZeroAddress);
    });

    it("pause() turns on enforced pause", async function () {
      expect(await lbtc.paused()).to.be.false;
      await expect(lbtc.pause())
        .to.emit(lbtc, "Paused")
        .withArgs(deployer.address);
      expect(await lbtc.paused()).to.be.true;
    });

    it("pause() reverts when called by not an owner", async function () {
      await expect(lbtc.connect(signer1).pause()).to.revertedWithCustomError(
        lbtc,
        "OwnableUnauthorizedAccount"
      );
    });

    it("unpause() turns off enforced pause", async function () {
      await lbtc.pause();
      expect(await lbtc.paused()).to.be.true;
      await expect(lbtc.unpause())
        .to.emit(lbtc, "Unpaused")
        .withArgs(deployer.address);
      expect(await lbtc.paused()).to.be.false;
    });

    it("unpause() reverts when called by not an owner", async function () {
      await lbtc.pause();
      expect(await lbtc.paused()).to.be.true;
      await expect(lbtc.connect(signer1).unpause()).to.revertedWithCustomError(
        lbtc,
        "OwnableUnauthorizedAccount"
      );
    });

    it("changeNameAndSymbol", async function () {
      const newName = "NEW_NAME";
      const newSymbol = "NEW_SYMBOL";
      await expect(lbtc.changeNameAndSymbol(newName, newSymbol))
        .to.emit(lbtc, "NameAndSymbolChanged")
        .withArgs(newName, newSymbol);
      expect(await lbtc.name()).to.be.eq(newName);
      expect(await lbtc.symbol()).to.be.eq(newSymbol);
    });

    it("toggleWithdrawals() enables or disables burn", async function () {
      await expect(lbtc.toggleWithdrawals())
        .to.emit(lbtc, "WithdrawalsEnabled")
        .withArgs(true);

      await expect(lbtc.toggleWithdrawals())
        .to.emit(lbtc, "WithdrawalsEnabled")
        .withArgs(false);
    });

    it("toggleWithdrawals() reverts when called by not an owner", async function () {
      await expect(
        lbtc.connect(signer1).toggleWithdrawals()
      ).to.revertedWithCustomError(lbtc, "OwnableUnauthorizedAccount");
    });

    it("WBTC() set", async function () {
      await expect(lbtc.changeWBTC(await wbtc.getAddress()))
        .to.emit(lbtc, "WBTCChanged")
        .withArgs(ethers.ZeroAddress, await wbtc.getAddress());
      expect(await lbtc.WBTC()).to.be.equal(await wbtc.getAddress());
    });

    it("Enable WBTC staking if WBTC not set", async function () {
      await expect(lbtc.enableWBTCStaking()).to.be.revertedWithCustomError(
        lbtc,
        "WBTCNotSet"
      );
    });

    it("Enable WBTC staking if WBTC set", async function () {
      await expect(lbtc.changeWBTC(await wbtc.getAddress()))
        .to.emit(lbtc, "WBTCChanged")
        .withArgs(ethers.ZeroAddress, await wbtc.getAddress());
      expect(await lbtc.enableWBTCStaking())
        .to.emit(lbtc, "WBTCStakingEnabled")
        .withArgs(true);
    });
  });

  describe("Mint positive cases", function () {
    before(async function () {
      await snapshot.restore();
    });

    const args = [
      {
        name: "1 BTC",
        amount: 100_000_000n,
        recipient: () => signer1,
        msgSender: () => signer2,
      },
      {
        name: "1 satoshi",
        amount: 1n,
        recipient: () => signer1,
        msgSender: () => signer2,
      },
    ];
    args.forEach(function (arg) {
      it(`Mint ${arg.name}`, async function () {
        const amount = arg.amount;
        const recipient = arg.recipient();
        const msgSender = arg.msgSender();
        const balanceBefore = await lbtc.balanceOf(recipient.address);
        const totalSupplyBefore = await lbtc.totalSupply();

        const signedData = await signData(consortium.privateKey, {
          to: recipient.address,
          amount,
        });
        await expect(
          lbtc.connect(msgSender).mint(signedData.data, signedData.signature)
        )
          .to.emit(lbtc, "Transfer")
          .withArgs(ethers.ZeroAddress, recipient.address, amount);

        const balanceAfter = await lbtc.balanceOf(recipient.address);
        const totalSupplyAfter = await lbtc.totalSupply();

        expect(balanceAfter - balanceBefore).to.be.eq(amount);
        expect(totalSupplyAfter - totalSupplyBefore).to.be.eq(amount);
      });
    });
  });

  describe("Mint negative cases", function () {
    beforeEach(async function () {
      await snapshot.restore();
    });

    const args = [
      {
        name: "signer is not a consortium",
        signer: () => signer1,
        signData: signData,
        recipient: () => signer1.address,
        amount: 100_000_000n,
        chainId: config.networks.hardhat.chainId,
        customError: "BadSignature",
      },
      {
        name: "data does not match hash",
        signer: () => signer1,
        signData: async function (
          privateKey: string,
          data: { to: string; amount: bigint; chainId?: number }
        ): Promise<{
          data: string;
          hash: string;
          signature: string;
        }> {
          const result1 = await signData(privateKey, data);
          const result2 = await signData(privateKey, {
            to: signer2.address,
            amount: 100_000_000n,
          });
          return {
            data: result1.data,
            hash: "",
            signature: result2.signature,
          };
        },
        recipient: () => signer1.address,
        amount: 100_000_000n,
        chainId: config.networks.hardhat.chainId,
        customError: "BadSignature",
      },
      {
        name: "chain is wrong",
        signer: () => consortium,
        signData: signData,
        recipient: () => signer1.address,
        amount: 100_000_000n,
        chainId: 1,
        customError: "BadChainId",
      },
      {
        name: "amount is 0",
        signer: () => consortium,
        signData: signData,
        recipient: () => signer1.address,
        amount: 0n,
        chainId: config.networks.hardhat.chainId,
        customError: "ZeroAmount",
      },
      {
        name: "recipient is 0 address",
        signer: () => consortium,
        signData: signData,
        recipient: () => ethers.ZeroAddress,
        amount: 100_000_000n,
        chainId: config.networks.hardhat.chainId,
        customError: "WrongAddressEncoding",
      },
    ];
    args.forEach(function (arg) {
      it(`Reverts when ${arg.name}`, async function () {
        const amount = arg.amount;
        const recipient = arg.recipient();
        const signer = arg.signer();
        const signedData = await arg.signData(signer.privateKey, {
          to: recipient,
          amount: amount,
          chainId: arg.chainId,
        });

        if (arg.customError) {
          await expect(
            lbtc.mint(signedData.data, signedData.signature)
          ).to.revertedWithCustomError(lbtc, arg.customError);
        } else if (arg.errorMessage) {
          await expect(
            lbtc.mint(signedData.data, signedData.signature)
          ).to.revertedWith(arg.errorMessage);
        } else {
          await expect(lbtc.mint(signedData.data, signedData.signature)).to.be
            .reverted;
        }
      });
    });

    it("Reverts when proof already used", async function () {
      const amount = 100_000_000n;
      const signedData = await signData(consortium.privateKey, {
        to: signer1.address,
        amount,
      });
      await lbtc.mint(signedData.data, signedData.signature);
      await expect(
        lbtc.mint(signedData.data, signedData.signature)
      ).to.revertedWithCustomError(lbtc, "ProofAlreadyUsed");
    });

    it("Reverts when paused", async function () {
      await lbtc.pause();
      const amount = 100_000_000n;
      const signedData = await signData(consortium.privateKey, {
        to: signer1.address,
        amount,
      });
      await expect(
        lbtc.mint(signedData.data, signedData.signature)
      ).to.revertedWithCustomError(lbtc, "EnforcedPause");
    });
  });

  describe("Stake WBTC", function () {
    const stakeAm = 10n ** 8n; // 1 WBTC

    beforeEach(async function () {
      await snapshot.restore();
    });

    it("WBTC stake disabled", async function () {
      await expect(lbtc.stakeWBTC(stakeAm)).to.revertedWithCustomError(
        lbtc,
        "WBTCStakingDisabled"
      );
    });

    it("Stake WBTC", async function () {
      await expect(lbtc.changeWBTC(await wbtc.getAddress()))
        .to.emit(lbtc, "WBTCChanged")
        .withArgs(ethers.ZeroAddress, await wbtc.getAddress());
      expect(await lbtc.enableWBTCStaking())
        .to.emit(lbtc, "WBTCStakingEnabled")
        .withArgs(true);

      await wbtc.mint(await signer3.getAddress(), stakeAm);
      await wbtc.connect(signer3).approve(await lbtc.getAddress(), stakeAm);

      await expect(lbtc.connect(signer3).stakeWBTC(stakeAm))
        .to.emit(lbtc, "WBTCStaked")
        .withArgs(
          await signer3.getAddress(),
          await signer3.getAddress(),
          stakeAm
        );

      expect(await lbtc.balanceOf(await signer3.getAddress())).to.be.eq(
        stakeAm
      );
    });

    it("Stake WBT if not enough funds", async function () {
      await expect(lbtc.changeWBTC(await wbtc.getAddress()))
        .to.emit(lbtc, "WBTCChanged")
        .withArgs(ethers.ZeroAddress, await wbtc.getAddress());
      expect(await lbtc.enableWBTCStaking())
        .to.emit(lbtc, "WBTCStakingEnabled")
        .withArgs(true);

      await wbtc.connect(signer3).approve(await lbtc.getAddress(), stakeAm);

      await expect(
        lbtc.connect(signer3).stakeWBTC(stakeAm)
      ).to.be.revertedWithCustomError(lbtc, "ERC20InsufficientBalance");
    });

    it("Stake WBTC if amount not allowed", async function () {
      await expect(lbtc.changeWBTC(await wbtc.getAddress()))
        .to.emit(lbtc, "WBTCChanged")
        .withArgs(ethers.ZeroAddress, await wbtc.getAddress());
      expect(await lbtc.enableWBTCStaking())
        .to.emit(lbtc, "WBTCStakingEnabled")
        .withArgs(true);

      await expect(
        lbtc.connect(signer3).stakeWBTC(stakeAm)
      ).to.be.revertedWithCustomError(lbtc, "ERC20InsufficientAllowance");
    });

    it("Stake WBTC for another address", async function () {
      await expect(lbtc.changeWBTC(await wbtc.getAddress()))
        .to.emit(lbtc, "WBTCChanged")
        .withArgs(ethers.ZeroAddress, await wbtc.getAddress());
      expect(await lbtc.enableWBTCStaking())
        .to.emit(lbtc, "WBTCStakingEnabled")
        .withArgs(true);

      await wbtc.mint(await signer3.getAddress(), stakeAm);
      await wbtc.connect(signer3).approve(await lbtc.getAddress(), stakeAm);

      await expect(
        lbtc.connect(signer3).stakeWBTCFor(stakeAm, await signer2.getAddress())
      )
        .to.emit(lbtc, "WBTCStaked")
        .withArgs(
          await signer3.getAddress(),
          await signer2.getAddress(),
          stakeAm
        );

      expect(await wbtc.balanceOf(await signer3.getAddress())).to.be.eq(0);
      expect(await lbtc.balanceOf(await signer3.getAddress())).to.be.eq(0);

      expect(await lbtc.balanceOf(await signer2.getAddress())).to.be.eq(
        stakeAm
      );
    });
  });

  //TODO: finish when burn will be ready
  describe("Burn negative cases", function () {
    beforeEach(async function () {
      await snapshot.restore();
    });

    it("Reverts when withdrawals off", async function () {
      await lbtc.pause();
      const amount = 100_000_000n;
      const signedData = await signData(consortium.privateKey, {
        to: signer1.address,
        amount,
      });
      await expect(
        lbtc.burn(ethers.encodeBytes32String("script"), 50_000_000n)
      ).to.revertedWithCustomError(lbtc, "WithdrawalsDisabled");
    });
  });
});
