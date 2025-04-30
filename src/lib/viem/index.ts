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

import { createPublicClient, erc20Abi, formatUnits, http, Address, createWalletClient, InsufficientFundsError } from "viem";
import { baseSepolia } from "viem/chains";
import { config } from "@/lib/config";
import { EvmServerAccount } from "@coinbase/cdp-sdk";
import GasliteDrop from "@/contracts/GasliteDrop.json";
import { InsufficientBalanceError, InsufficientGasError } from '@/lib/errors';
import { toAccount } from "viem/accounts";
import { TOKEN_ADDRESSES, TokenKey } from "@/lib/constant";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.BASE_SEPOLIA_NODE_URL),
});

export async function getWalletClient(account: EvmServerAccount) {
  console.log('ACCOUNT', account.address)
  return createWalletClient({
    account: toAccount(account),
    chain: baseSepolia,
    transport: http(config.BASE_SEPOLIA_NODE_URL),
  });
}

export async function checkGasFunds(address: Address, token: string, addresses: Address[], amounts: bigint[], totalTransferAmount: bigint): Promise<void> {
  try {
    // Get ETH balance for gas
    const ethBalance = await publicClient.getBalance({ address });

    if (token === 'eth') {
      if (ethBalance < totalTransferAmount) {
        throw new InsufficientBalanceError(
          `Insufficient ETH balance for transfer. Required: ${formatUnits(totalTransferAmount, 18)} ETH`
        );
      }

      // Estimate gas for the transfer - If it fails, it will throw an error
      await publicClient.estimateContractGas({
        address: config.GASLITE_DROP_ADDRESS as Address,
        abi: GasliteDrop,
        functionName: 'airdropETH',
        args: [addresses, amounts],
        account: address,
        value: totalTransferAmount,
      });

    } else {
      const tokenAddress = TOKEN_ADDRESSES[token as TokenKey];
      if (!tokenAddress) {
        throw new Error(`Unknown token symbol: ${token}`);
      }

      // Check ERC20 token balance
      const tokenBalance = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'balanceOf',
        args: [address],
      });


      if (tokenBalance < totalTransferAmount) {
        throw new InsufficientBalanceError(
          `Insufficient ${token.toUpperCase()} balance. Required: ${formatUnits(totalTransferAmount, 18)} ${token.toUpperCase()}`
        );
      }

      await publicClient.estimateContractGas({
        address: config.GASLITE_DROP_ADDRESS as Address,
        abi: GasliteDrop,
        functionName: 'airdropERC20',
        args: [tokenAddress, addresses, amounts, totalTransferAmount],
        account: address,
        value: totalTransferAmount,
      });
    }

  } catch (error) {
    console.error(error);
    if (error instanceof InsufficientGasError || error instanceof InsufficientBalanceError) {
      throw error;
    }

    if (error instanceof Error) {
      const errMsg = error.message.toLowerCase();

      if (errMsg.includes('failed to estimate gas') && errMsg.includes('the total cost (gas * gas fee + value')) {
        throw new InsufficientBalanceError('Insufficient balance for transaction');
      }
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }

    throw new Error(`Failed to estimate gas: unknown error ${error}`)

  }
}

