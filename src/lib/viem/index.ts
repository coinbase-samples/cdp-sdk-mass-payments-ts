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

import { createPublicClient, erc20Abi, formatUnits, http, Address, createWalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "@/lib/config";
import { EvmServerAccount } from "@coinbase/cdp-sdk";
import GasliteDrop from "@/contracts/GasliteDrop.json";
import { InsufficientBalanceError, InsufficientGasError } from '@/lib/errors';
import { toAccount } from "viem/accounts";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.BASE_SEPOLIA_NODE_URL),
});

export const TOKEN_ADDRESSES: Record<string, Address> = {
  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  usdt: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  dai: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
};

export async function getWalletClient(account: EvmServerAccount) {
  console.log('ACCOUNT', account.address)
  return createWalletClient({
    account: toAccount(account),
    chain: baseSepolia,
    transport: http(config.BASE_SEPOLIA_NODE_URL),
  });
}

export async function checkGasFunds(address: Address, token: string, addresses: Address[], amounts: bigint[]): Promise<void> {
  try {
    // Get ETH balance for gas
    const balance = await publicClient.getBalance({ address });

    // Estimate gas for the transfer
    const gasEstimate = await publicClient.estimateContractGas({
      address: config.GASLITE_DROP_ADDRESS as Address,
      abi: GasliteDrop,
      functionName: token === 'eth' ? 'airdropETH' : 'airdropERC20',
      args: token === 'eth'
        ? [addresses, amounts]
        : [
            TOKEN_ADDRESSES[token],
            addresses,
            amounts,
            amounts.reduce((sum, amount) => sum + amount, BigInt(0)),
          ],
      account: address,
      value: token === 'eth' ? amounts.reduce((sum, amount) => sum + amount, BigInt(0)) : undefined,
    });

    // Add 20% buffer to gas estimate
    const totalGasCost = (gasEstimate * BigInt(120)) / BigInt(100);

    if (token === 'eth') {
      // For ETH transfers, we need to check gas + total transfer amount
      const totalTransferAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));
      const totalCost = totalGasCost + totalTransferAmount;

      if (balance < totalCost) {
        throw new InsufficientBalanceError(
          `Insufficient ETH balance. Required: ${formatUnits(totalCost, 18)} ETH (${formatUnits(totalTransferAmount, 18)} ETH for transfer + ${formatUnits(totalGasCost, 18)} ETH for gas)`
        );
      }
    } else {
      // For ERC20 transfers, we only need to check gas
      if (balance < totalGasCost) {
        throw new InsufficientGasError(`Insufficient ETH for gas fees. Required: ${formatUnits(totalGasCost, 18)} ETH`);
      }
    }
  } catch (error) {
    if (error instanceof InsufficientGasError || error instanceof InsufficientBalanceError) {
      throw error;
    }
    // If we can't estimate gas, we should fail the operation
    throw new Error(`Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function executeBatchTransfer(
  account: EvmServerAccount,
  token: string,
  addresses: Address[],
  amounts: bigint[]
): Promise<`0x${string}`> {
  const walletClient = await getWalletClient(account);

  if (token === 'eth') {
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));
    return walletClient.writeContract({
      address: config.GASLITE_DROP_ADDRESS as Address,
      abi: GasliteDrop,
      functionName: 'airdropETH',
      args: [addresses, amounts],
      value: totalAmount,
    });
  }

  return walletClient.writeContract({
    address: config.GASLITE_DROP_ADDRESS as Address,
    abi: GasliteDrop,
    functionName: 'airdropERC20',
    args: [
      TOKEN_ADDRESSES[token],
      addresses,
      amounts,
      amounts.reduce((sum, amount) => sum + amount, BigInt(0)),
    ],
  });
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
