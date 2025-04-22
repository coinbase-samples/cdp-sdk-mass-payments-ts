'use client';

import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Identity, Name } from '@coinbase/onchainkit/identity';
import { color } from '@coinbase/onchainkit/theme';

export function Login() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Coinbase Wallet to continue
          </p>
        </div>
        <div className="mt-8">
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address className={color.foregroundMuted} />
              </Identity>
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
        </div>
      </div>
    </div>
  );
} 
