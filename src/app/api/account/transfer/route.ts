import { getOrCreateEvmAccount } from "@/lib/cdp";
import { NextRequest, NextResponse } from "next/server";
import { publicClient, TOKEN_ADDRESSES, executeEthTransfer, executeErc20Transfer } from "@/lib/viem";
import { erc20Abi } from "viem";
import { Address } from "viem";

interface TransferRequest {
  token: string;
  data: Array<{
    to: string;
    amount: string;
  }>;
}

interface TransferResult {
  success: boolean;
  to: string;
  error?: string;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

async function validateUserAddress(request: NextRequest): Promise<string> {
  const userAddress = request.headers.get('x-user-address');
  if (!userAddress) {
    throw new ValidationError('Unauthorized');
  }
  return userAddress;
}

async function validateRequest(request: NextRequest): Promise<TransferRequest> {
  const { token, data } = await request.json();
  
  if (!token || !data) {
    throw new ValidationError('Invalid request: token and data are required');
  }

  if (token !== 'eth' && !TOKEN_ADDRESSES[token]) {
    throw new ValidationError('Unsupported token');
  }

  return { token, data };
}

async function calculateTotalAmount(data: TransferRequest['data']): Promise<number> {
  return data
    .map(row => parseFloat(row.amount))
    .reduce((sum, amount) => sum + amount, 0);
}

async function executeTransfers(
  evmAccount: any,
  token: string,
  data: TransferRequest['data']
): Promise<TransferResult[]> {
  const transferPromises = data.map(async (row) => {
    try {
      if (token === 'eth') {
        await executeEthTransfer(evmAccount, row.to as Address, row.amount);
      } else {
        await executeErc20Transfer(evmAccount, token, row.to as Address, row.amount);
      }
      return { success: true, to: row.to };
    } catch (error) {
      return {
        success: false,
        to: row.to,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  return Promise.all(transferPromises);
}

async function checkEthBalance(address: Address, requiredAmount: bigint): Promise<void> {
  const balance = await publicClient.getBalance({ address });
  if (balance < requiredAmount) {
    throw new InsufficientBalanceError('Insufficient ETH balance');
  }
}

async function checkErc20Balance(
  tokenAddress: Address,
  ownerAddress: Address,
  requiredAmount: bigint
): Promise<void> {
  const balance = await publicClient.readContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: [ownerAddress],
  });

  if (balance < requiredAmount) {
    throw new InsufficientBalanceError('Insufficient token balance');
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userAddress = await validateUserAddress(request);
    const { token, data } = await validateRequest(request);
    const evmAccount = await getOrCreateEvmAccount({ accountId: userAddress });
    const totalAmount = await calculateTotalAmount(data);

    if (token === 'eth') {
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** 18));
      await checkEthBalance(evmAccount.address as Address, totalAmountWei);
    } else {
      const tokenAddress = TOKEN_ADDRESSES[token];
      const decimals = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'decimals',
      });
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** decimals));
      await checkErc20Balance(tokenAddress, evmAccount.address as Address, totalAmountWei);
    }

    const results = await executeTransfers(evmAccount, token, data);
    const failedTransfers = results.filter(result => !result.success);

    if (failedTransfers.length > 0) {
      return NextResponse.json({
        error: 'Some transfers failed',
        failedTransfers
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    let status = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof ValidationError) {
      status = 400;
      errorMessage = error.message;
    } else if (error instanceof InsufficientBalanceError) {
      status = 400;
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      error: errorMessage
    }, { status });
  }
}
