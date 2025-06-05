export function bigintToNumberSafe(value: bigint): number {
    if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
        throw new Error("BigInt value is too large to convert safely to number.");
    }
    return Number(value);
}