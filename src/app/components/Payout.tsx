'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { PayoutHeader } from './PayoutHeader'
import { WalletInfo } from './WalletInfo'
import { PayoutForm } from './PayoutForm'

export const Payout = () => {
  const { status } = useSession()
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <PayoutHeader />
      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 p-4 sm:p-7 bg-white rounded-lg shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] min-w-[320px]">
        <WalletInfo />
        <PayoutForm />
      </div>
    </div>
  )
}