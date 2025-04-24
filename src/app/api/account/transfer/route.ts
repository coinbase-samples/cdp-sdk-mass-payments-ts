import { config } from "@/lib/config";
import { getOrCreateEvmAccount } from "@/lib/cdp";
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther, zeroAddress } from "viem";
import { toAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { EvmServerAccount } from "@coinbase/cdp-sdk";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userAddress = request.headers.get('x-user-address')
  if (!userAddress) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token, data } = await request.json();

  if (!token || !data) {
    return new NextResponse("Invalid request", { status: 400 });
  }

  try {
    const evmAccount = await getOrCreateEvmAccount({ accountId: userAddress });
    const viemAccount = toAccount(evmAccount);
    const walletClient = createWalletClient({
      account: viemAccount,
      transport: http(config.BASE_SEPOLIA_NODE_URL),
      chain: baseSepolia,
    });
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    // Convert all amounts to numbers and sum them up
    const totalAmount = data
      .map((row: { amount: string }) => parseFloat(row.amount))
      .reduce((sum: number, amount: number) => sum + amount, 0);

    // Native (ETH) transfer
    if (token == zeroAddress) {
      const balance = await publicClient.getBalance({ address: viemAccount.address });
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** 18));

      if (balance < totalAmountWei) {
        return new NextResponse("Insufficient balance", { status: 400 });
      }

      // Execute all transfers concurrently and wait for all to complete
      const transferPromises = data.map(async (row: { to: string; amount: string }) => {
        try {
          await executeTransfer(walletClient, publicClient, row.to, row.amount);
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
      return new NextResponse("Unsupported token", { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function executeTransfer(
  walletClient: any,
  publicClient: any,
  to: string,
  amount: string
): Promise<void> {
  const recipientEvmAccount: EvmServerAccount = await getOrCreateEvmAccount({ accountId: to });

  const hash = await walletClient.sendTransaction({
    to: recipientEvmAccount.address as `0x${string}`,
    value: parseEther(amount),
  });

  // Wait for transaction confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed for recipient ${to}`);
  }
}
