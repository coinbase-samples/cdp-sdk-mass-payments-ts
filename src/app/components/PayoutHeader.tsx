import Image from 'next/image'
import AccountDropdown from './AccountDropdown'

export const PayoutHeader = () => {
  return (
    <div className="flex justify-between items-center mb-6 pb-6 border-b">
      <div className="w-48 md:w-96 h-16 relative">
        <Image
          src="/paymaker.png"
          alt="Paymaker Logo"
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <AccountDropdown />
    </div>
  )
} 