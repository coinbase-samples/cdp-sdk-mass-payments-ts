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

import { cdpClient, requestFaucetFunds } from '@/lib/cdp';
import { NextRequest, NextResponse } from 'next/server';
import { isTokenKey } from '@/lib/constants';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  const account = await cdpClient.evm.getAccount({ name: session!.user.id });

  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token parameter is required' },
      { status: 400 }
    );
  }

  if (!isTokenKey(token)) {
    return NextResponse.json(
      { error: 'Invalid token parameter' },
      { status: 400 }
    );
  }

  try {
    await requestFaucetFunds({
      address: account.address,
      tokenName: token,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error requesting faucet:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
