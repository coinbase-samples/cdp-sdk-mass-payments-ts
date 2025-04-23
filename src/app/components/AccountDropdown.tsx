'use client'

import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useAccount, useEnsName } from 'wagmi'
import { useRouter } from 'next/navigation'

export default function AccountDropdown() {
  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = ensName || address?.slice(0, 6) + '...' + address?.slice(-4)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.replace('/') // back to main screen (Login shows when session is gone)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!address) return null

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-medium shadow hover:bg-gray-200 transition"
      >
        {displayName}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50">
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

