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

import { useState, useRef } from 'react'
import { useWallet } from '@/app/context/WalletContext'
import { TransferResultsModal } from './TransferResultsModal'
import { TransferResult } from '@/lib/types/transfer'

type PayoutRow = {
  recipientId: string
  amount: string
}

const MAX_ROWS = 100

export const PayoutForm = () => {
  const { activeToken, refreshBalance, evmAddress } = useWallet()
  const [payoutRows, setPayoutRows] = useState<PayoutRow[]>([{ recipientId: '', amount: '' }])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [transferResults, setTransferResults] = useState<TransferResult[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addRow = () => {
    if (payoutRows.length >= MAX_ROWS) {
      setError(`Maximum of ${MAX_ROWS} rows allowed`)
      return
    }
    setPayoutRows([...payoutRows, { recipientId: '', amount: '' }])
    setError(null)
  }

  const updateRow = (index: number, field: keyof PayoutRow, value: string) => {
    const newRows = [...payoutRows]
    newRows[index][field] = value
    setPayoutRows(newRows)
    setError(null)
  }

  const removeRow = (index: number) => {
    if (payoutRows.length > 1) {
      setPayoutRows(payoutRows.filter((_, i) => i !== index))
      setError(null)
    } else {
      setPayoutRows([{ recipientId: '', amount: '' }])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const rows = text.split('\n').map(row => row.trim()).filter(row => row)

        // Skip header row if it exists
        const dataRows = rows[0].includes('recipientId') ? rows.slice(1) : rows

        if (dataRows.length > MAX_ROWS) {
          setError(`CSV contains too many rows. Maximum allowed is ${MAX_ROWS}`)
          return
        }

        const parsedRows = dataRows.map(row => {
          const [recipientId, amount] = row.split(',').map(cell => cell.trim())
          return { recipientId, amount }
        })

        setPayoutRows(parsedRows)
        setError(null)
      } catch (err) {
        setError('Error parsing CSV file. Please ensure it has the correct format: recipientId,amount')
      }
    }
    reader.readAsText(file)
  }

  const handleConfirm = async () => {
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setError(null);

    try {
      if (!evmAddress) {
        throw new Error('No wallet connected');
      }

      const response = await fetch(`/api/account/${evmAddress}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: activeToken,
          data: payoutRows.map(row => ({
            to: row.recipientId,
            amount: row.amount
          }))
        }),
      })

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setTransferResults(data.results);
      setShowResults(true);
      refreshBalance(activeToken); // Refresh balance after successful transfer

      // Only clear form if all transfers succeeded
      if (data.results.every((r: TransferResult) => r.success)) {
        setPayoutRows([{ recipientId: '', amount: '' }]);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg font-semibold">Payout Recipients</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm w-fit max-w-[120px] sm:max-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
            disabled={isSubmitting}
          />
          <button
            onClick={addRow}
            disabled={isSubmitting}
            className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm w-fit max-w-[120px] sm:max-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Row
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {payoutRows.map((row, index) => (
          <div key={index} className="flex gap-1 sm:gap-2 items-center">
            <input
              type="text"
              placeholder="Recipient ID"
              value={row.recipientId}
              onChange={(e) => updateRow(index, 'recipientId', e.target.value)}
              className="flex-1 p-1 sm:p-2 border rounded text-sm sm:text-base min-w-0 disabled:opacity-50"
              disabled={isSubmitting}
            />
            <input
              type="number"
              placeholder="Amount"
              value={row.amount}
              onChange={(e) => updateRow(index, 'amount', e.target.value)}
              className="w-16 sm:w-24 p-1 sm:p-2 border rounded text-sm sm:text-base disabled:opacity-50"
              disabled={isSubmitting}
            />
            <button
              onClick={() => removeRow(index)}
              disabled={isSubmitting}
              className="px-3 py-1.5 sm:py-2 bg-red-500 text-white rounded text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {payoutRows.length} of {MAX_ROWS} rows used
      </div>

      <div className="flex justify-start sm:justify-end">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer mt-4 px-6 py-2 text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Confirm Transfer'
          )}
        </button>
      </div>

      <TransferResultsModal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        results={transferResults}
      />
    </div>
  )
} 
