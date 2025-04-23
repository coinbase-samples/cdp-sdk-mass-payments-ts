'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import AccountDropdown from './AccountDropdown'

export const Payout = () => {
  const { data: session, status } = useSession()
  const { isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && !isConnected) {
      // Wallet is disconnected but session is active — force logout
      signOut({ redirect: false }).then(() => {
        router.replace('/')
      })
    }
  }, [status, isConnected, router])

  return (
    <div className="flex flex-col gap-6 w-3/4 mx-auto px-4">
      <div className="flex justify-end">
        <AccountDropdown />
      </div>

      <div className="flex flex-row items-center justify-center gap-6 p-7 bg-white rounded-lg border border-gray-200 shadow-lg">
        <div className="flex flex-col items-center">
          <p className="text-gray-600">Payout</p>
          <p className="text-xl font-semibold">1000</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-gray-600">Payout</p>
          <p className="text-xl font-semibold">1000</p>
        </div>
      </div>
    </div>
  )
}

