import { CdpClient, EvmServerAccount } from "@coinbase/cdp-sdk";
import { config } from '../config';
import { getOrCreateWallet, createWallet } from '../db';

const cdpClient: CdpClient = new CdpClient({
  apiKeyId: config.CDP_API_KEY_ID,
  apiKeySecret: config.CDP_API_KEY_SECRET,
  walletSecret: config.CDP_WALLET_SECRET,
});

let evmAccount: EvmServerAccount;

export async function getOrCreateEvmAccount() {
  // Check if env variables are properly set
  if (!config.DATABASE_URL) {
    throw new Error("Database configuration is not properly set");
  }

  const id = `mass-payouts-${config.NODE_ENV}`;
  const existingWallet = await getOrCreateWallet(id);
  if (existingWallet) {
    evmAccount = await cdpClient.evm.getAccount({ address: existingWallet.address as `0x${string}` });
    return;
  }

  evmAccount = await cdpClient.evm.createAccount();

  await createWallet(id, evmAccount.address);

  const { transactionHash } = await cdpClient.evm.requestFaucet({
    address: evmAccount.address,
    network: "base-sepolia",
    token: "eth",
  });

  console.log(
    `Requested funds from faucet. Transaction hash: ${transactionHash}`
  );
}

export { evmAccount };