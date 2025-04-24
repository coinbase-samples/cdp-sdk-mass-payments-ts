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

import { useEffect } from 'react'
import { TransferResult } from '@/lib/types/transfer';

interface TransferResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: TransferResult[];
}

export const TransferResultsModal = ({ isOpen, onClose, results }: TransferResultsModalProps) => {
  // Close modal when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const successfulTransfers = results.filter(r => r.success);
  const failedTransfers = results.filter(r => !r.success);

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 pt-16">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Transfer Results</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {successfulTransfers.length > 0 && (
            <div>
              <h3 className="text-green-600 font-medium mb-2">Successful Transfers ({successfulTransfers.length})</h3>
              <div className="space-y-2">
                {successfulTransfers.map((result, index) => (
                  <div key={index} className="mb-2 p-2 bg-green-100 text-green-700 rounded">
                    <div className="font-semibold">Success</div>
                    <div>Recipient ID: {result.recipientId}</div>
                    <div>Recipient Address: {result.recipientAddress}</div>
                    <div>Amount: {result.amount}</div>
                    {result.hash && (
                      <div>
                        Transaction:{" "}
                        <a
                          href={`https://sepolia.basescan.org/tx/${result.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {result.hash.slice(0, 6)}...{result.hash.slice(-4)}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {failedTransfers.length > 0 && (
            <div>
              <h3 className="text-red-600 font-medium mb-2">Failed Transfers ({failedTransfers.length})</h3>
              <div className="space-y-2">
                {failedTransfers.map((result, index) => (
                  <div key={index} className="mb-2 p-2 bg-red-100 text-red-700 rounded">
                    <div className="font-semibold">Failed</div>
                    <div>Recipient ID: {result.recipientId}</div>
                    {result.recipientAddress && <div>Recipient Address: {result.recipientAddress}</div>}
                    <div>Amount: {result.amount}</div>
                    {result.error && <div>Error: {result.error}</div>}
                    {result.hash && (
                      <div>
                        Transaction:{" "}
                        <a
                          href={`https://sepolia.etherscan.io/tx/${result.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {result.hash.slice(0, 6)}...{result.hash.slice(-4)}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0052ff] text-white rounded-[30px] hover:bg-[#0042cc] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 
