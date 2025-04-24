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