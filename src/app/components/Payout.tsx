'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import AccountDropdown from './AccountDropdown'
import { useWallet } from '../context/WalletContext'

type PayoutRow = {
  recipientId: string
  amount: string
}

const MAX_ROWS = 100

export const Payout = () => {
  const { status } = useSession()
  const { isConnected } = useAccount()
  const router = useRouter()
  const { evmAddress, balance } = useWallet()
  const [payoutRows, setPayoutRows] = useState<PayoutRow[]>([{ recipientId: '', amount: '' }])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'authenticated' && !isConnected) {
      // Wallet is disconnected but session is active — force logout
      signOut({ redirect: false }).then(() => {
        router.replace('/')
      })
    }
  }, [status, isConnected, router])

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
    try {
      const response = await fetch('/api/account/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: '0x0000000000000000000000000000000000000000', // Native token
          data: payoutRows.map(row => ({
            to: row.recipientId,
            amount: row.amount
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Transfer failed')
      }

      const result = await response.json()
      console.log('Transfer successful:', result)
    } catch (error) {
      console.error('Transfer error:', error)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-3/4 mx-auto px-4">
      <div className="flex justify-end">
        <AccountDropdown />
      </div>

      <div className="flex flex-row gap-6 p-7 bg-white rounded-lg border border-gray-200 shadow-lg">
        {/* Wallet Information */}
        <div className="w-1/3 p-4 border-r border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Wallet Information</h2>
          <div className="space-y-2">
            <div>
              <p className="text-gray-600">Address</p>
              <p className="text-sm font-mono">{evmAddress}</p>
            </div>
            <div>
              <p className="text-gray-600">Balance</p>
              <p className="text-xl font-semibold">{balance || '0'} ETH</p>
            </div>
          </div>
        </div>

        {/* Payout Rows */}
        <div className="w-2/3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Payout Recipients</h2>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="connectBttn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Upload CSV
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
              <button
                onClick={addRow}
                className="connectBttn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Row
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {payoutRows.map((row, index) => (
              <div key={index} className="flex gap-4 items-center">
                <input
                  type="text"
                  placeholder="Recipient ID"
                  value={row.recipientId}
                  onChange={(e) => updateRow(index, 'recipientId', e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={row.amount}
                  onChange={(e) => updateRow(index, 'amount', e.target.value)}
                  className="w-32 p-2 border rounded"
                />
                <button
                  onClick={() => removeRow(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-500">
            {payoutRows.length} of {MAX_ROWS} rows used
          </div>

          <button
            onClick={handleConfirm}
            className="mt-6 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  )
}

