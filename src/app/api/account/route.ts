import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getOrCreateEvmAccount } from "@/lib/cdp";

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const account = await getOrCreateEvmAccount({ accountId: session.address })

    return NextResponse.json({ address: account.address })
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
