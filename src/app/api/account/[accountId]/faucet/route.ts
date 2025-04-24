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

import { requestFaucetFunds } from '@/lib/cdp';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const userAddress = req.headers.get('x-user-address')
  if (!userAddress) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { accountId } = await params;

  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
  }

  if (token !== 'eth' && token !== 'usdc' && token !== 'eurc' && token !== 'cbbtc') {
    return NextResponse.json({ error: 'Invalid token parameter' }, { status: 400 });
  }

  try {
    await requestFaucetFunds({
      address: accountId as `0x${string}`,
      tokenName: token
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error requesting faucet:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

