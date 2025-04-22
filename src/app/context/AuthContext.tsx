'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAccount, useSignMessage, useDisconnect } from 'wagmi'
import { SiweMessage } from 'siwe'

type AuthContextType = {
  isAuthenticated: boolean
  address?: string
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { disconnect } = useDisconnect()

  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const signIn = async () => {
    try {
      const nonceRes = await fetch('/api/auth/nonce')
      const nonce = await nonceRes.text()

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to the app.',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce,
      })

      const signature = await signMessageAsync({ message: message.prepareMessage() })

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      })

      if (!verifyRes.ok) throw new Error('SIWE verification failed')
      setIsAuthenticated(true)
    } catch (err) {
      console.error('Sign-in failed', err)
    }
  }

  const signOut = async () => {
    await fetch('/api/siwe/logout', { method: 'POST' })
    disconnect()
    setIsAuthenticated(false)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/me')
      setIsAuthenticated(res.ok)
    }

    if (isConnected) {
      checkAuth()
    } else {
      setIsAuthenticated(false)
    }
  }, [isConnected])

  return (
    <AuthContext.Provider value={{ isAuthenticated, address, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
