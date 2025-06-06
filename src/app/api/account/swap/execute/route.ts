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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { publicClient } from '@/lib/viem';
import { swapCache } from '@/lib/swap';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { quoteId } = await request.json();

    if (!quoteId) {
      return NextResponse.json({ error: 'Missing quote ID' }, { status: 400 });
    }

    // Retrieve the cached swap transaction data
    const swapQuote = swapCache.get(quoteId);

    if (!swapQuote) {
      return NextResponse.json(
        { error: 'Quote not found or expired' },
        { status: 400 }
      );
    }

    const result = await swapQuote.execute();

    // Clean up the used quote from cache
    swapCache.delete(quoteId);

    // Wait for transaction confirmation
    if (result.transactionHash) {
      await publicClient.waitForTransactionReceipt({
        hash: result.transactionHash as `0x${string}`,
      });
    }

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
    });
  } catch (error) {
    console.error('Swap execution error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to execute swap',
      },
      { status: 500 }
    );
  }
}
