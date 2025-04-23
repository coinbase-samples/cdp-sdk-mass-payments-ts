'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type WalletContextType = {
  evmAddress?: string
  balance?: string
  refreshBalance: () => void
}

const WalletContext = createContext<WalletContextType>({
  refreshBalance: () => { },
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession()
  const [evmAddress, setEvmAddress] = useState<string>()
  const [balance, setBalance] = useState<string>()

  const fetchEvmAddress = async () => {
    try {
      const res = await fetch('/api/account')
      if (!res.ok) throw new Error('Failed to fetch evm account')
      const { address } = await res.json()
      setEvmAddress(address)
    } catch (err) {
      console.error('fetchEvmAddress error:', err)
    }
  }

  const refreshBalance = async () => {
    if (!evmAddress) return
    try {
      const res = await fetch(`/api/balance?address=${evmAddress}`)
      if (!res.ok) throw new Error('Failed to fetch balance')
      const { balance } = await res.json()
      setBalance(balance)
    } catch (err) {
      console.error('refreshBalance error:', err)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvmAddress()
    }
  }, [status])

  useEffect(() => {
    if (evmAddress) {
      refreshBalance()
    }
  }, [evmAddress])

  return (
    <WalletContext.Provider value={{ evmAddress, balance, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  )
}

