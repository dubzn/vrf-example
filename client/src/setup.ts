import { createDojoConfig } from "@dojoengine/core";
import { BurnerManager } from "@dojoengine/create-burner";
import { Account, RpcProvider } from "starknet";
import { RPC_URL } from "./config";
import manifest from "./manifest_slot.json";

export async function setupBurner() {
  // Master account from dojo_slot.toml
  const masterAddress = "0x6677fe62ee39c7b07401f754138502bab7fac99d2d3c5d37df7d1c6fab10819";
  const masterPrivateKey = "0x3e3979c1ed728490308054fe357a9f49cf67f80f9721f44cc57235129e090f4";

  // Create DojoConfig using createDojoConfig - this will automatically set accountClassHash
  const config = createDojoConfig({
    manifest,
    rpcUrl: RPC_URL,
    toriiUrl: "",
    masterAddress,
    masterPrivateKey,
  });


  // Create RPC provider directly - we don't need DojoProvider for burner setup
  const rpcProvider = new RpcProvider({ nodeUrl: config.rpcUrl });

  // Create master account - use masterPrivateKey directly as signer
  const masterAccount = new Account({
    provider: rpcProvider,
    address: config.masterAddress,
    signer: config.masterPrivateKey,
  });

  // Create burner manager
  const burnerManager = new BurnerManager({
    masterAccount,
    accountClassHash: config.accountClassHash,
    rpcProvider: rpcProvider,
    feeTokenAddress: config.feeTokenAddress,
  });

  try {
    await burnerManager.init();
    if (burnerManager.list().length === 0) {
      await burnerManager.create();
    }
  } catch (e) {
    console.error("Error initializing burnerManager:", e);
    throw e;
  }

  return burnerManager;
}

