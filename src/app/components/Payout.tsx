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

import { useSession } from 'next-auth/react'
import { PayoutHeader } from './PayoutHeader'
import { WalletInfo } from './WalletInfo'
import { PayoutForm } from './PayoutForm'

export const Payout = () => {
  const { status } = useSession()

  if (status !== 'authenticated') return null

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