import { getOrCreateEvmAccount } from "@/lib/cdp";
import { NextRequest, NextResponse } from "next/server";
import { publicClient, TOKEN_ADDRESSES, executeEthTransfer, executeErc20Transfer } from "@/lib/viem";
import { erc20Abi } from "viem";
import { Address } from "viem";
import { TransferRequest, TransferResult } from "@/lib/types/transfer";

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
  const results: TransferResult[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      // Add a delay between transactions to prevent nonce issues
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      }

      // Get or create EVM account for the recipient
      const recipientEvmAccount = await getOrCreateEvmAccount({ accountId: row.to });
      console.log(`Got EVM account for recipient ${row.to}:`, recipientEvmAccount.address);

      let transferResult;
      if (token === 'eth') {
        transferResult = await executeEthTransfer(evmAccount, recipientEvmAccount.address as Address, row.amount);
      } else {
        transferResult = await executeErc20Transfer(evmAccount, token, recipientEvmAccount.address as Address, row.amount);
      }

      results.push({
        success: transferResult.success,
        recipientId: row.to,
        recipientAddress: recipientEvmAccount.address,
        amount: row.amount,
        error: transferResult.error,
        hash: transferResult.hash
      });

      // If the transfer failed, log it but continue with other transfers
      if (!transferResult.success) {
        console.error(`Transfer failed for ${row.to}:`, transferResult.error);
      }
    } catch (error) {
      console.error(`Unexpected error for ${row.to}:`, error);
      results.push({
        success: false,
        recipientId: row.to,
        recipientAddress: '',
        amount: row.amount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
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
    console.log('Starting transfer request processing');
    const userAddress = await validateUserAddress(request);
    console.log('Validated user address:', userAddress);

    const { token, data } = await validateRequest(request);
    console.log('Validated request:', { token, data });

    const evmAccount = await getOrCreateEvmAccount({ accountId: userAddress });
    console.log('Got EVM account:', evmAccount.address);

    const totalAmount = await calculateTotalAmount(data);
    console.log('Calculated total amount:', totalAmount);

    if (token === 'eth') {
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** 18));
      console.log('Checking ETH balance for amount:', totalAmountWei.toString());
      await checkEthBalance(evmAccount.address as Address, totalAmountWei);
    } else {
      const tokenAddress = TOKEN_ADDRESSES[token];
      console.log('Checking ERC20 balance for token:', tokenAddress);
      const decimals = await publicClient.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'decimals',
      });
      const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** decimals));
      console.log('Checking token balance for amount:', totalAmountWei.toString());
      await checkErc20Balance(tokenAddress, evmAccount.address as Address, totalAmountWei);
    }

    console.log('Starting transfers execution');
    const results = await executeTransfers(evmAccount, token, data);
    const failedTransfers = results.filter(result => !result.success);

    if (failedTransfers.length > 0) {
      console.error('Some transfers failed:', failedTransfers);
      return NextResponse.json({
        error: 'Some transfers failed',
        results
      }, { status: 500 });
    }

    console.log('All transfers completed successfully');
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Transfer request failed:', error);
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
