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

import Image from 'next/image'
import AccountDropdown from './AccountDropdown'

export const PayoutHeader = () => {
  return (
    <div className="flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center gap-2 md:gap-4 mb-2 md:mb-6 pb-2 md:pb-6">
      <div className="w-48 md:w-96 h-12 md:h-16 relative">
        <Image
          src="/paymaker.png"
          alt="Paymaker Logo"
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className="w-full md:w-auto">
        <AccountDropdown />
      </div>
    </div>
  )
} 