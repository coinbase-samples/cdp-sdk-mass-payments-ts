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
  results: TransferResult | null;
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

  if (!isOpen || !results) return null;

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
          {results.success ? (
            <div>
              <h3 className="text-green-600 font-medium mb-2">Successful Transfer</h3>
              <div className="space-y-2">
                {results.recipients?.map((recipient, index) => (
                  <div key={index} className="mb-2 p-2 bg-green-100 text-green-700 rounded">
                    <div className="font-semibold">Success</div>
                    <div>Recipient ID: {recipient.recipientId}</div>
                    <div>Recipient Address: {recipient.recipientAddress}</div>
                    <div>Amount: {recipient.amount}</div>
                    {results.hash && (
                      <div>
                        Transaction:{" "}
                        <a
                          href={`https://sepolia.basescan.org/tx/${results.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {results.hash.slice(0, 6)}...{results.hash.slice(-4)}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-red-600 font-medium mb-2">Failed Transfer</h3>
              <div className="space-y-2">
                {results.recipients?.map((recipient, index) => (
                  <div key={index} className="mb-2 p-2 bg-red-100 text-red-700 rounded">
                    <div className="font-semibold">Failed</div>
                    <div>Recipient ID: {recipient.recipientId}</div>
                    {recipient.recipientAddress && <div>Recipient Address: {recipient.recipientAddress}</div>}
                    <div>Amount: {recipient.amount}</div>
                    {results.error && <div>Error: {results.error}</div>}
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
