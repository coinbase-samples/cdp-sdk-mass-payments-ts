import { createPublicClient, erc20Abi, formatUnits, http, parseEther } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "@/lib/config";
import { createWalletClient } from "viem";
import { toAccount } from "viem/accounts";
import { EvmServerAccount } from "@coinbase/cdp-sdk";
import { getOrCreateEvmAccount } from "@/lib/cdp";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.BASE_SEPOLIA_NODE_URL),
});

export const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  cbbtc: '0xcbb7c0006f23900c38eb856149f799620fcb8a4a',
  eurc: '0x808456652fdb597867f38412077a9182bf77359f',
  usdc: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
};

export async function executeEthTransfer(
  account: EvmServerAccount,
  to: string,
  amount: string
): Promise<void> {
  const viemAccount = toAccount(account);
  const walletClient = createWalletClient({
    account: viemAccount,
    transport: http(config.BASE_SEPOLIA_NODE_URL),
    chain: baseSepolia,
  });

  const recipientEvmAccount: EvmServerAccount = await getOrCreateEvmAccount({ accountId: to });

  const hash = await walletClient.sendTransaction({
    to: recipientEvmAccount.address as `0x${string}`,
    value: parseEther(amount),
  });

  // Wait for transaction confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed for recipient ${to}`);
  }
}

export async function executeErc20Transfer(
  account: EvmServerAccount,
  tokenSymbol: string,
  to: string,
  amount: string
): Promise<void> {
  const viemAccount = toAccount(account);
  const walletClient = createWalletClient({
    account: viemAccount,
    transport: http(config.BASE_SEPOLIA_NODE_URL),
    chain: baseSepolia,
  });

  const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];
  if (!tokenAddress) {
    throw new Error(`Unknown token symbol: ${tokenSymbol}`);
  }

  const decimals = await publicClient.readContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'decimals',
  });

  const recipientEvmAccount: EvmServerAccount = await getOrCreateEvmAccount({ accountId: to });
  const amountWei = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [recipientEvmAccount.address, amountWei],
  });

  // Wait for transaction confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed for recipient ${to}`);
  }
}

export const getBalanceForAddress = async (
  address: `0x${string}`,
  tokenSymbol?: string,
): Promise<string> => {
  if (!tokenSymbol) {
    // Get native ETH balance
    const balance = await publicClient.getBalance({ address });
    return formatUnits(balance, 18); // ETH is always 18 decimals
  }

  const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];
  if (!tokenAddress) {
    throw new Error(`Unknown token symbol: ${tokenSymbol}`);
  }

  const [decimals, rawBalance] = await Promise.all([
    publicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: 'decimals',
    }),
    publicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: 'balanceOf',
      args: [address],
    }),
  ]);

  return formatUnits(rawBalance as bigint, decimals as number);
}
