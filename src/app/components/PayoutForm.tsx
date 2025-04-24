import { useState, useRef } from 'react'

type PayoutRow = {
  recipientId: string
  amount: string
}

const MAX_ROWS = 100

export const PayoutForm = () => {
  const [payoutRows, setPayoutRows] = useState<PayoutRow[]>([{ recipientId: '', amount: '' }])
  const [error, setError] = useState<string | null>(null)
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
        throw new Error('Transfer failed', { cause: await response.json() })
      }
    } catch (error) {
      console.error('Transfer error:', error)
    }
  }

  return (
    <div className="w-3/4 sm:w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Payout Recipients</h2>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="connectBttn px-3 py-1 text-sm"
          >
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
            className="connectBttn px-3 py-1 text-sm"
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
          <div key={index} className="flex gap-2 items-center">
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
              className="px-2 py-1 bg-red-500 text-white rounded"
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
        className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded font-bold"
      >
        Confirm Transfer
      </button>
    </div>
  )
} 