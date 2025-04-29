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

import { useWallet } from '@/app/context/WalletContext'
import { tokenDisplayMap, TokenKey } from '@/lib/constant'
import { useState } from 'react'


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
    <div className="w-full md:w-1/2 p-4">
      <h2 className="text-lg font-semibold mb-4">Wallet Information</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600">Address</p>
          <p className="text-sm font-mono break-all overflow-hidden text-ellipsis">{evmAddress}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold">
              {balances[activeToken] ?? '—'}
            </p>
            <select
              value={activeToken}
              onChange={(e) => {
                setActiveToken(e.target.value as TokenKey)
                refreshBalance(e.target.value as TokenKey)
              }}
              className="px-3 py-1 rounded border text-xs sm:text-sm"
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
            className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
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
