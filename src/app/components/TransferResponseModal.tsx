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

import { useEffect, useRef } from 'react'
import { TransferRecipient, TransferResponse } from '@/lib/types/transfer';
import { getNetworkConfig } from '@/lib/network';

interface TransferResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: TransferResponse | null;
}

const RecipientCard = ({ recipient, isSuccess }: { recipient: TransferRecipient, isSuccess: boolean }) => (
  <div className={`p-3 rounded ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
    <div className="font-semibold">{isSuccess ? 'Success' : 'Failed'}</div>
    <div>Recipient ID: {recipient.recipientId}</div>
    {isSuccess && recipient.amount && <div>Amount: {recipient.amount}</div>}
  </div>
);

const TransactionLink = ({ hash }: { hash: string }) => {
  const { explorerUrl } = getNetworkConfig();

  return (
  <div>
    Transaction:{" "}
    <a
      href={`${explorerUrl}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
    >
      {hash.slice(0, 6)}...{hash.slice(-4)}
    </a>
  </div>
)
};

export const TransferResponseModal = ({ isOpen, onClose, response }: TransferResponseModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !response) return null;

  const isSuccess = response.result?.success === true;
  const hasRecipients = response.recipients?.length > 0;

  return (
    <div className="fixed inset-0 flex items-start justify-center z-50 pt-16">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl" ref={modalRef}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Transfer Results</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className={`font-medium mb-2 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {isSuccess ? 'Successful Transfer' : 'Failed Transfer'}
          </h3>

          {hasRecipients && (
            <div className="space-y-2">
              {response.recipients.map((recipient, index) => (
                <RecipientCard key={index} recipient={recipient} isSuccess={isSuccess} />
              ))}
            </div>
          )}

          {isSuccess && response.result?.hash && <TransactionLink hash={response.result.hash} />}
          {!isSuccess && response.result?.error && <div className="text-red-600">Error: {response.result.error}</div>}
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
