import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { getOrCreateEvmAccount } from "@/lib/cdp";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.address) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const account = await getOrCreateEvmAccount({ accountId: session.address })
  return NextResponse.json({ address: account.address })
}
