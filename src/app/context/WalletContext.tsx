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

'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { TokenKey } from '@/lib/constant'

type WalletContextType = {
  evmAddress?: string
  accountId?: string
  balances: Partial<Record<TokenKey, string>>
  activeToken: TokenKey
  setActiveToken: (token: TokenKey) => void
  refreshBalance: (token?: TokenKey) => void
}

const WalletContext = createContext<WalletContextType>({
  refreshBalance: () => { },
  setActiveToken: () => { },
  balances: {},
  activeToken: 'eth',
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession()
  const [evmAddress, setEvmAddress] = useState<string>()
  const [accountId, setAccountId] = useState<string>()
  const [balances, setBalances] = useState<Partial<Record<TokenKey, string>>>({})
  const [activeToken, setActiveToken] = useState<TokenKey>('eth')

  const fetchEvmAddress = async () => {
    const res = await fetch('/api/account')
    if (res.ok) {
      const { address, accountId } = await res.json()
      setEvmAddress(address)
      setAccountId(accountId)
    }
  }

  const refreshBalance = useCallback(async (token: TokenKey = activeToken) => {
    if (!evmAddress) return

    const query = token !== 'eth' ? `?token=${token}` : ''
    const res = await fetch(`/api/account/balance${query}`)
    if (res.ok) {
      const { balance } = await res.json()
      setBalances(prev => ({ ...prev, [token]: balance }))
    }
  }, [evmAddress, activeToken])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvmAddress()
    }
  }, [status])

  useEffect(() => {
    if (evmAddress) {
      refreshBalance('eth')
    }
  }, [evmAddress, refreshBalance])

  return (
    <WalletContext.Provider
      value={{
        evmAddress,
        accountId,
        balances,
        activeToken,
        setActiveToken,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
