import { task } from "hardhat/config";
import { verify } from "./helpers";

task("deploy-lbtc", "Deploys the LBTC contract")
  .addParam("consortium", "The address of LombardConsortium")
  .addParam("testEnv", "testnet deployment", false)
  .setAction(async (taskArgs, hre) => {
    const { consortium, testEnv } = taskArgs;
    const { ethers, upgrades, run } = hre;

    const res = await upgrades.deployProxy(
      await ethers.getContractFactory(testEnv ? "LBTCMock" : "LBTC"),
      [consortium]
    );
    await res.waitForDeployment();
    console.log(`Deployment address is ${await res.getAddress()}`);

    console.log(await res.getAddress());
    await verify(run, await res.getAddress());
  });
