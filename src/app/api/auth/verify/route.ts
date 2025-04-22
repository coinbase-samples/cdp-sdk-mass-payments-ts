import { deleteNonce, isValidNonce } from "@/lib/nonce";
import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";


export async function POST(req: NextRequest) {
  const { message, signature } = await req.json();
  console.log(message);
  console.log(signature);

  try {
    const siwe = new SiweMessage(message);
    const siweResponse = await siwe.verify(signature);

    const nonce = siweResponse.data.nonce;
    if (!isValidNonce(nonce)) {
      return new NextResponse('Invalid or expired nonce', { status: 400 });
    }

    deleteNonce(nonce); // One-time use

    if (!siweResponse.success) {
      console.error('Invalid signature', siweResponse.error);
      return new NextResponse('Invalid signature', { status: 401, statusText: 'Invalid signature' });
    }
    return NextResponse.json({ valid: siweResponse.success });
  } catch (e) {
    console.error('Error verifying signature:', e);
    return new NextResponse('Invalid signature', { status: 401 });
  }
}
