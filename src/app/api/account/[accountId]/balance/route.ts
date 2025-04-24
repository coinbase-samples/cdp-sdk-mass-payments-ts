import { getBalanceForAddress } from '@/lib/viem';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const { accountId } = await params;
  const token = req.nextUrl.searchParams.get('token');

  try {
    const balance = await getBalanceForAddress(accountId as `0x${string}`, token || undefined);
    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}

