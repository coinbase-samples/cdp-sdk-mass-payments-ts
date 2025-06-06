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

import { cdpClient } from '@/lib/cdp';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTokenAddresses, TokenKey } from '@/lib/constants';
import { parseUnits } from 'viem';
import { getNetworkConfig } from '@/lib/network';
import { swapCache } from '@/lib/swap';
import { randomUUID } from 'crypto';

const { network } = getNetworkConfig();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { toToken, fromAmount } = await request.json();

    if (!toToken || !fromAmount) {
      return NextResponse.json(
        { error: 'Missing required parameters: toToken, fromAmount' },
        { status: 400 }
      );
    }

    const account = await cdpClient.evm.getAccount({ name: session.user.id });

    const tokenAddresses = getTokenAddresses(network === 'base');
    const toTokenAddress = tokenAddresses[toToken as TokenKey];
    // For ETH swaps, we need to use WETH address on mainnet
    const fromTokenAddress = tokenAddresses['eth'];

    if (!toTokenAddress) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Convert amount to wei (ETH has 18 decimals)
    const fromAmountWei = parseUnits(fromAmount.toString(), 18);

    const swapQuote = await account.quoteSwap({
      network: network as 'base' | 'ethereum',
      toToken: toTokenAddress,
      fromToken: fromTokenAddress,
      fromAmount: fromAmountWei,
      slippageBps: 100, // 1% slippage tolerance
    });

    if (!('transaction' in swapQuote) || !swapQuote.liquidityAvailable) {
      return NextResponse.json(
        {
          error: 'No liquidity available for this swap',
        },
        { status: 400 }
      );
    }

    const quoteId = randomUUID();
    // Cache the swap data and get the generated quote ID
    swapCache.set(quoteId, swapQuote);

    // Convert BigInt values to strings for JSON serialization
    const serializableQuote = JSON.parse(
      JSON.stringify(swapQuote, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json({
      quote: {
        ...serializableQuote,
        quoteId,
        // Note: We're not sending the actual transaction data to the frontend anymore
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
      },
    });
  } catch (error) {
    console.error('Swap quote error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate swap quote',
      },
      { status: 500 }
    );
  }
}
