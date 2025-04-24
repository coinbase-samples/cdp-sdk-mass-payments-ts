import { CdpClient, EvmServerAccount } from "@coinbase/cdp-sdk";
import { config } from '../config';
import { getWalletAddress, createWallet } from '../db';
import { createHash } from 'crypto';
import { GetOrCreateEvmAccountParams, RequestFaucetParams } from "../types/cdp";
import { publicClient } from "@/lib/viem";

const cdpClient: CdpClient = new CdpClient({
  apiKeyId: config.CDP_API_KEY_ID,
  apiKeySecret: config.CDP_API_KEY_SECRET,
  walletSecret: config.CDP_WALLET_SECRET,
});

export async function getOrCreateEvmAccount(params: GetOrCreateEvmAccountParams): Promise<EvmServerAccount> {
  if (!config.DATABASE_URL) {
    throw new Error("Database configuration is not properly set");
  }

  try {
    const id = createHash('sha256')
      .update(`mass-payments-${config.NODE_ENV}-${params.accountId}`)
      .digest('hex');

    const existingWallet = await getWalletAddress(id);
    if (existingWallet) {
      return await cdpClient.evm.getAccount({ address: existingWallet.address });
    }

    const evmAccount: EvmServerAccount = await cdpClient.evm.createAccount();

    await createWallet(id, evmAccount.address);

    return evmAccount;
  } catch (error) {
    console.error("Error creating wallet:", error);
    throw error;
  }
}

export async function requestFaucetFunds(params: RequestFaucetParams) {
  const { transactionHash } = await cdpClient.evm.requestFaucet({
    address: params.address,
    network: "base-sepolia",
    token: params.tokenName,
  });

  await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });
}

