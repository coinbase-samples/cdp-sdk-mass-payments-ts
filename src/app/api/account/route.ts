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
