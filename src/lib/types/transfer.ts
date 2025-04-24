export type TransferRequest = {
  token: string;
  data: Array<{
    to: string;
    amount: string;
  }>;
}

export type TransferResult = {
  success: boolean;
  recipientId: string;
  recipientAddress: string;
  amount: string;
  error?: string;
  hash?: string;
}
