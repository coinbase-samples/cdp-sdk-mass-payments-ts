import { NextResponse } from "next/server";
import { getOrCreateEvmAccount } from "@/lib/cdp";

export async function GET(req: Request) {
  try {
    const userAddress = req.headers.get('x-user-address')
    if (!userAddress) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await getOrCreateEvmAccount({ accountId: userAddress })

    return NextResponse.json({ address: account.address })
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
