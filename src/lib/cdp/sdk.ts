import { CdpClient, EvmServerAccount } from "@coinbase/cdp-sdk";
import { walletAddressesCollection } from "../mongodb/client";
import { config } from '../config';

const cdpClient: CdpClient = new CdpClient({
  apiKeyId: config.CDP_API_KEY_ID,
  apiKeySecret: config.CDP_API_KEY_SECRET,
  walletSecret: config.CDP_WALLET_SECRET,
});

let evmAccount: EvmServerAccount;

export async function getOrCreateResource(id: string) {
  // Check if env variables are properly set
  if (!config.MONGODB_URI || !config.MONGODB_DB_NAME) {
    throw new Error("MongoDB configuration is not properly set");
  }

  const existingWallet = await walletAddressesCollection.findOne({ id });

  if (existingWallet) {
    evmAccount = await cdpClient.evm.getAccount({ address: `0x${existingWallet.address.replace('0x', '')}` });
    return;
  }

  evmAccount = await cdpClient.evm.createAccount();

  await walletAddressesCollection.insertOne({
    id,
    address: evmAccount.address,
  });
}

export { evmAccount };