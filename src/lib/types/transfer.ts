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

import { TokenKey } from '@/lib/constants';
import { EvmServerAccount } from '@coinbase/cdp-sdk';

export type TransferRequest = {
  token: string;
  recipients: TransferRecipient[];
}

export type TransferParams = {
  senderAccount: EvmServerAccount;
  token: TokenKey;
  addresses: `0x${string}`[];
  amounts: bigint[];
  totalAmount: bigint;
}

export type TransferResult = {
  success: boolean;
  hash?: string;
  error?: string;
}

export type TransferResponse = {
  recipients: TransferRecipient[];
  result: TransferResult;
}


export type TransferRecipient = {
  recipientId: string;
  amount: string;
}
