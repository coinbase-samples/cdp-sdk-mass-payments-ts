import { CdpClient } from "@coinbase/cdp-sdk";
import { config } from '../config';
import { getWalletAddress, createWallet } from '../db';
import { createHash } from 'crypto';
import { GetOrCreateEvmAccountParams } from "../types/CDP";

const cdpClient: CdpClient = new CdpClient({
  apiKeyId: config.CDP_API_KEY_ID,
  apiKeySecret: config.CDP_API_KEY_SECRET,
  walletSecret: config.CDP_WALLET_SECRET,
});

export async function getOrCreateEvmAccount(params: GetOrCreateEvmAccountParams) {
  // Check if env variables are properly set
  if (!config.DATABASE_URL) {
    throw new Error("Database configuration is not properly set");
  }

  try {
    const id = createHash('sha256')
      .update(`mass-payments-${config.NODE_ENV}-${params.accountId}`)
      .digest('hex');

    const existingWallet = await getWalletAddress(id);
    if (existingWallet) {
      return existingWallet.evmAccount;
    }

    const evmAccount = await cdpClient.evm.createAccount();

    await createWallet(id, evmAccount.address);
  } catch (error) {
    console.error("Error creating wallet:", error);
    throw error;
  }
}

