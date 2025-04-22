import { NextResponse } from 'next/server';
import { generateNonce } from 'siwe';
import { storeNonce } from '@/lib/nonce';

export async function GET() {
  const nonce = generateNonce();
  storeNonce(nonce);

  return NextResponse.json({ nonce });
}
