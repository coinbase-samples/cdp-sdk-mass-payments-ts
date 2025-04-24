import { getOrCreateEvmAccount } from "@/lib/cdp";
import { NextRequest, NextResponse } from "next/server";
import { publicClient, TOKEN_ADDRESSES, executeEthTransfer, executeErc20Transfer } from "@/lib/viem";
import { erc20Abi } from "viem";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userAddress = request.headers.get('x-user-address')
  if (!userAddress) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token, data } = await request.json();

  if (!token || !data) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  // Validate token
  if (token !== 'eth' && !TOKEN_ADDRESSES[token]) {
    return new NextResponse("Unsupported token", { status: 400 });
  }

  try {
    const evmAccount = await getOrCreateEvmAccount({ accountId: userAddress });

    // Convert all amounts to numbers and sum them up
    const totalAmount = data
      .map((row: { amount: string }) => parseFloat(row.amount))
      .reduce((sum: number, amount: number) => sum + amount, 0);

    // Native (ETH) transfer
    if (token === 'eth') {
      const balance = await publicClient.getBalance({ address: evmAccount.address });
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** 18));

      if (balance < totalAmountWei) {
        return new NextResponse("Insufficient balance", { status: 400 });
      }

      // Execute all transfers concurrently and wait for all to complete
      const transferPromises = data.map(async (row: { to: string; amount: string }) => {
        try {
          await executeEthTransfer(evmAccount, row.to, row.amount);
          return { success: true, to: row.to };
        } catch (error) {
          return { success: false, to: row.to, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(transferPromises);

      // Check if any transfers failed
      const failedTransfers = results.filter(result => !result.success);
      if (failedTransfers.length > 0) {
        return NextResponse.json({
          error: 'Some transfers failed',
          failedTransfers
        }, { status: 500 });
      }

      return NextResponse.json({ success: true, results });
    } else {
      // ERC20 token transfer
      const tokenAddress = TOKEN_ADDRESSES[token];
      const decimals = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'decimals',
      });

      // Get token balance
      const balance = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'balanceOf',
        args: [evmAccount.address],
      });

      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** decimals));
      if (balance < totalAmountWei) {
        return new NextResponse("Insufficient token balance", { status: 400 });
      }

      // Execute all transfers concurrently and wait for all to complete
      const transferPromises = data.map(async (row: { to: string; amount: string }) => {
        try {
          await executeErc20Transfer(evmAccount, token, row.to, row.amount);
          return { success: true, to: row.to };
        } catch (error) {
          return { success: false, to: row.to, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      const results = await Promise.all(transferPromises);

      // Check if any transfers failed
      const failedTransfers = results.filter(result => !result.success);
      if (failedTransfers.length > 0) {
        return NextResponse.json({
          error: 'Some transfers failed',
          failedTransfers
        }, { status: 500 });
      }

      return NextResponse.json({ success: true, results });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
