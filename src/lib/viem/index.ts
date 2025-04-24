import { createPublicClient, erc20Abi, formatUnits, http } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "@/lib/config";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.BASE_SEPOLIA_NODE_URL),
});

const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  cbbtc: '0xcbb7c0006f23900c38eb856149f799620fcb8a4a',
  eurc: '0x808456652fdb597867f38412077a9182bf77359f',
  usdc: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
};


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
