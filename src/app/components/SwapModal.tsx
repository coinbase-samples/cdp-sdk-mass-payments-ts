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

import { tokenDisplayMap, TokenKey, tokenDecimals } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { getNetworkConfig } from '@/lib/network';

interface SwapQuote {
  quoteId: string;
  liquidityAvailable: boolean;
  fromAmount: string;
  toAmount?: string;
  toToken: string;
  expiresAt: number;
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromToken: TokenKey;
  toToken: TokenKey;
  fromAmount: string;
  quote: SwapQuote | null;
  onConfirm: () => void;
  isExecuting: boolean;
  isSuccess?: boolean;
  transactionHash?: string;
}

export const SwapModal = ({
  isOpen,
  onClose,
  fromToken,
  toToken,
  fromAmount,
  quote,
  onConfirm,
  isExecuting,
  isSuccess = false,
  transactionHash,
}: SwapModalProps) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!quote) return;

    const updateTimeLeft = () => {
      const remaining = Math.max(
        0,
        Math.floor((quote.expiresAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);

      // Auto-close if expired
      if (remaining === 0 && !isExecuting) {
        onClose();
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [quote, isExecuting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Swap Confirmation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isExecuting}
          >
            ✕
          </button>
        </div>

        {isSuccess && transactionHash ? (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 mb-2">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Swap Successful!
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Successfully swapped {fromAmount} {tokenDisplayMap[fromToken]}{' '}
                to {tokenDisplayMap[toToken]}
              </p>
              <div className="text-xs text-gray-500">
                <p className="mb-1">Transaction Hash:</p>
                <a
                  href={`${getNetworkConfig().explorerUrl}/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all font-mono"
                >
                  {transactionHash}
                </a>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#0052ff] text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        ) : quote ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">From</span>
                <span className="font-medium">
                  {fromAmount} {tokenDisplayMap[fromToken]}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">To (estimated)</span>
                <span className="font-medium text-green-600">
                  {quote.toAmount
                    ? `~ ${formatUnits(BigInt(quote.toAmount), tokenDecimals[toToken])} ${tokenDisplayMap[toToken]}`
                    : `~ ${tokenDisplayMap[toToken]}`}
                </span>
              </div>
              <div
                className={`text-xs mt-2 ${timeLeft < 60 ? 'text-red-500 font-medium' : 'text-gray-500'}`}
              >
                Quote expires in {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, '0')}
                {timeLeft < 60 && timeLeft > 0 && ' ⚠️'}
              </div>
            </div>

            {quote.liquidityAvailable ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <p>• Slippage tolerance: 1%</p>
                  <p>• Transaction may take a few minutes to complete</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isExecuting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isExecuting}
                    className="flex-1 bg-[#0052ff] text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExecuting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Swapping...
                      </>
                    ) : (
                      'Confirm Swap'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-red-600">
                <p>No liquidity available for this swap</p>
                <button
                  onClick={onClose}
                  className="mt-3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <svg
              className="animate-spin h-8 w-8 text-[#0052ff]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="ml-3">Getting quote...</span>
          </div>
        )}
      </div>
    </div>
  );
};
