'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type WalletContextType = {
  evmAddress?: string
  balances: Partial<Record<TokenKey, string>>
  activeToken: TokenKey
  setActiveToken: (token: TokenKey) => void
  refreshBalance: (token?: TokenKey) => void
}

type TokenKey = 'eth' | 'usdc' | 'eurc' | 'cbbtc'

const WalletContext = createContext<WalletContextType>({
  refreshBalance: () => { },
  setActiveToken: () => { },
  balances: {},
  activeToken: 'eth',
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const [evmAddress, setEvmAddress] = useState<string>()
  const [balances, setBalances] = useState<Partial<Record<TokenKey, string>>>({})
  const [activeToken, setActiveToken] = useState<TokenKey>('eth')

  const fetchEvmAddress = async () => {
    const res = await fetch('/api/account')
    if (res.ok) {
      const { address } = await res.json()
      setEvmAddress(address)
    }
  }

  const refreshBalance = async (token: TokenKey = activeToken) => {
    if (!evmAddress) return

    const query = token !== 'eth' ? `?token=${token}` : ''
    const res = await fetch(`/api/account/${evmAddress}/balance${query}`)
    if (res.ok) {
      const { balance } = await res.json()
      setBalances(prev => ({ ...prev, [token]: balance }))
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvmAddress()
    }
  }, [status])

  useEffect(() => {
    if (evmAddress) {
      refreshBalance('eth') // preload ETH by default
    }
  }, [evmAddress])

  return (
    <WalletContext.Provider
      value={{
        evmAddress,
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
