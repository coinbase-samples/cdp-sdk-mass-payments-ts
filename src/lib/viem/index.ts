/**
 * Copyright 2025-present Coinbase Global, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createPublicClient, erc20Abi, formatUnits, http, parseEther, Address } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "@/lib/config";
import { createWalletClient } from "viem";
import { toAccount } from "viem/accounts";
import { EvmServerAccount } from "@coinbase/cdp-sdk";
import GasliteDrop from "@/contracts/GasliteDrop.json";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.BASE_SEPOLIA_NODE_URL),
});

export const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  cbbtc: '0xcbb7c0006f23900c38eb856149f799620fcb8a4a',
  eurc: '0x808456652fdb597867f38412077a9182bf77359f',
  usdc: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
};

export async function executeBatchTransfer(
  account: EvmServerAccount,
  token: string,
  addresses: Address[],
  amounts: bigint[]
): Promise<{ hash: string }> {
  const walletClient = getWalletClient(account);

  // Get current gas parameters
  const feeData = await publicClient.estimateFeesPerGas();
  const maxFeePerGas = BigInt(Math.floor(Number(feeData.maxFeePerGas) * 1.2));
  const maxPriorityFeePerGas = BigInt(Math.floor(Number(feeData.maxPriorityFeePerGas) * 1.2));

  const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

  if (token === 'eth') {
    const hash = await walletClient.writeContract({
      address: config.GASLITE_DROP_ADDRESS as Address,
      abi: GasliteDrop,
      functionName: 'airdropETH',
      args: [addresses, amounts],
      maxFeePerGas,
      maxPriorityFeePerGas,
      type: 'eip1559',
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });
    return { hash };
  } else {
    const tokenAddress = TOKEN_ADDRESSES[token];
    if (!tokenAddress) {
      throw new Error(`Unknown token symbol: ${token}`);
    }

    const hash = await walletClient.writeContract({
      address: config.GASLITE_DROP_ADDRESS as Address,
      abi: GasliteDrop,
      functionName: 'airdropERC20',
      args: [tokenAddress, addresses, amounts, totalAmount],
      maxFeePerGas,
      maxPriorityFeePerGas,
      type: 'eip1559',
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });
    return { hash };
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

const getWalletClient = (account: EvmServerAccount) => {
  const viemAccount = toAccount(account);
  return createWalletClient({
    account: viemAccount,
    transport: http(config.BASE_SEPOLIA_NODE_URL),
    chain: baseSepolia,
  });
}
