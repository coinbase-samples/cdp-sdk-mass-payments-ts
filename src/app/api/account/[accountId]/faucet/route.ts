import { requestFaucetFunds } from '@/lib/cdp';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = await params;
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
  }

  if (token !== 'eth' && token !== 'usdc' && token !== 'eurc' && token !== 'cbbtc') {
    return NextResponse.json({ error: 'Invalid token parameter' }, { status: 400 });
  }

  try {
    await requestFaucetFunds(
      {
        address: accountId as `0x${string}`,
        tokenName: token
      }
    );
    return NextResponse.json('Ok', { status: 200 });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}

