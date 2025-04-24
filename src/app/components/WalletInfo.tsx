import { useWallet } from '../context/WalletContext'
import { useState } from 'react'

type TokenKey = 'eth' | 'usdc' | 'eurc' | 'cbbtc'

const tokenDisplayMap: Record<TokenKey, string> = {
  eth: 'ETH',
  usdc: 'USDC',
  eurc: 'EURC',
  cbbtc: 'cbBTC'
}

export const WalletInfo = () => {
  const { evmAddress, balances, activeToken, setActiveToken, refreshBalance } = useWallet()
  const [isLoading, setIsLoading] = useState(false)

  const handleFaucetRequest = async () => {
    if (!evmAddress) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/account/${evmAddress}/faucet?token=${activeToken}`);
      if (res.ok) {
        refreshBalance(activeToken);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-1/4 sm:w-full p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Wallet Information</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600">Address</p>
          <p className="text-sm font-mono break-all">{evmAddress}</p>
        </div>
        <div>
          <p className="text-gray-600">Balance</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold">
              {balances[activeToken] ?? '—'} {tokenDisplayMap[activeToken]}
            </p>
            <select
              value={activeToken}
              onChange={(e) => {
                setActiveToken(e.target.value as TokenKey)
                refreshBalance(e.target.value as TokenKey)
              }}
              className="px-2 py-1 rounded border"
            >
              {Object.entries(tokenDisplayMap).map(([key, display]) => (
                <option key={key} value={key}>
                  {display}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFaucetRequest}
            disabled={isLoading}
            className="connectBttn mt-2 px-3 py-1 text-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Requesting...
              </>
            ) : (
              'Request Faucet'
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 