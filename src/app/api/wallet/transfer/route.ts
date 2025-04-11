import { evmAccount } from "@/lib/cdp/sdk";
import { createWalletClient, createPublicClient, erc20Abi, http, zeroAddress } from "viem";
import { toAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// USDC contract addresses for Base Sepolia
const USDC_CONTRACT = {
    testnet: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    mainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
};

export async function POST(request: Request): Promise<Response> {
    try {
        // @todo - validate data
        const { token, data } = await request.json();

        if (!token || !data) {
            return new Response("Invalid request", { status: 400 });
        }

        const viemAccount = toAccount(evmAccount);
        const walletClient = createWalletClient({
            account: viemAccount,
            transport: http(),
            chain: baseSepolia,
        });
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http(),
        });

        // Convert all amounts to numbers and sum them up
        const totalAmount = data
            .map((row: { amount: string }) => parseFloat(row.amount))
            .reduce((sum: number, amount: number) => sum + amount, 0);

        // Native (ETH) transfer
        if (token == zeroAddress) {
            const balance = await client.getBalance({ address: viemAccount.address });
            // Convert totalAmount to wei (1 ETH = 10^18 wei)
            const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** 18));

            if (balance < totalAmountWei) {
                return new Response("Insufficient balance", { status: 400 });
            }

            // Prepare transfers
            for (const row of data) {
                const amountWei = BigInt(Math.floor(parseFloat(row.amount) * 10 ** 18));
                await walletClient.writeContract({
                    address: zeroAddress,
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [row.wallet as `0x${string}`, amountWei]
                });
            }
        }
        // USDC Token Transfer
        else if (token == USDC_CONTRACT.testnet || token == USDC_CONTRACT.mainnet) {
            // USDC has 6 decimals, so we need to multiply by 10^6
            const totalAmountWei = BigInt(Math.floor(totalAmount * 10 ** 6));
            
            // Check USDC balance
            const balance = await client.readContract({
                address: token as `0x${string}`,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [viemAccount.address]
            });

            if (balance < totalAmountWei) {
                return new Response("Insufficient USDC balance", { status: 400 });
            }

            // Prepare transfers
            for (const row of data) {
                const amountWei = BigInt(Math.floor(parseFloat(row.amount) * 10 ** 6));
                await walletClient.writeContract({
                    address: token as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [row.wallet as `0x${string}`, amountWei]
                });
            }
        }
        else {
            return new Response("Unsupported token", { status: 400 });
        }
        return new Response("OK", { status: 200 });
    } catch (error) {
        return new Response("internal failure", { status: 500 });
    }
}