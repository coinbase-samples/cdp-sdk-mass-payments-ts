'use client'

import { signIn } from 'next-auth/react'
import { SiweMessage } from 'siwe'
import { useAccount, useConnect, useSignMessage } from 'wagmi'
import { coinbaseWallet } from 'wagmi/connectors'
import { useState } from 'react'


export const Login = () => {
  const { connect, status } = useConnect()
  const { isConnected, address, chain } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [isSigning, setIsSigning] = useState(false)

  const isConnecting = status === 'pending'

  const handleSignIn = async () => {
    try {
      setIsSigning(true)

      const nonceRes = await fetch('/api/auth/csrf')
      const { csrfToken } = await nonceRes.json()

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to access this app.',
        uri: window.location.origin,
        version: '1',
        chainId: chain?.id,
        nonce: csrfToken,
      })

      const signature = await signMessageAsync({
        message: siweMessage.prepareMessage(),
      })

      await signIn('credentials', {
        message: JSON.stringify(siweMessage),
        signature,
        redirect: false,
      })
    } catch (err) {
      console.error('SIWE login failed:', err)
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Connect Your Wallet
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Connect your wallet to access the application
          </p>
        </div>

        <div className="space-y-6 flex flex-col items-center">
          {!isConnected && (
            <button
              onClick={() => connect({ connector: coinbaseWallet() })}
              disabled={isConnecting}
              className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Spinner />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </button>
          )}

          {isConnected && (
            <button
              onClick={handleSignIn}
              disabled={isSigning}
              className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer w-[200px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigning ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                'Sign In with Ethereum'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 
      0 0 5.373 0 12h4zm2 5.291A7.962 
      7.962 0 014 12H0c0 3.042 1.135 
      5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

