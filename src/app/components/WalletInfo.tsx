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

import { useWallet } from '@/app/context/WalletContext';
import { tokenDisplayMap, TokenKey } from '@/lib/constants';
import { useState } from 'react';
import { SwapModal } from './SwapModal';

export const WalletInfo = () => {
  const { evmAddress, balances, activeToken, setActiveToken, refreshBalance } =
    useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');

  const handleFaucetRequest = async () => {
    if (!evmAddress) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/account/faucet?token=${activeToken}`);
      if (res.ok) {
        refreshBalance(activeToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundRequest = () => {
    if (!evmAddress) return;

    const appId = process.env.NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID || '';

    const coinbasePayUrl = `https://pay.coinbase.com/buy/select-asset?appId=${appId}&addresses={"${evmAddress}":["base"]}&assets=["ETH"]&defaultPaymentMethod=CARD&fiatCurrency=USD&presetFiatAmount=5`;

    window.open(coinbasePayUrl, '_blank');
  };

  const handleSwapRequest = async () => {
    if (!evmAddress || activeToken === 'eth') return;

    const ethBalance = balances['eth'] || '0';
    const amount = prompt(
      `Enter amount of ETH to swap:\n\nAvailable ETH: ${ethBalance}`
    );
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    // Check if amount exceeds balance
    if (Number(amount) > Number(ethBalance)) {
      alert(`Insufficient ETH balance. You have ${ethBalance} ETH available.`);
      return;
    }

    setSwapAmount(amount);
    setIsSwapModalOpen(true);
    setSwapQuote(null);

    try {
      const res = await fetch('/api/account/swap/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toToken: activeToken,
          fromAmount: amount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSwapQuote(data.quote);
      } else {
        const error = await res.json();
        alert(`Failed to get quote: ${error.error}`);
        setIsSwapModalOpen(false);
      }
    } catch (error) {
      console.error('Error getting swap quote:', error);
      alert('Failed to get swap quote');
      setIsSwapModalOpen(false);
    }
  };

  const handleSwapConfirm = async () => {
    if (!swapQuote) return;

    setIsExecutingSwap(true);
    try {
      const res = await fetch('/api/account/swap/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: swapQuote.quoteId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTransactionHash(data.transactionHash);
        setSwapSuccess(true);

        refreshBalance('eth');
        refreshBalance(activeToken);
      } else {
        const error = await res.json();
        alert(`Swap failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      alert('Swap execution failed');
    } finally {
      setIsExecutingSwap(false);
    }
  };

  const closeSwapModal = () => {
    if (!isExecutingSwap) {
      setIsSwapModalOpen(false);
      setSwapQuote(null);
      setSwapAmount('');
      setSwapSuccess(false);
      setTransactionHash('');

      // Refresh balances when modal is closed
      refreshBalance('eth');
      refreshBalance(activeToken);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-4">
      <h2 className="text-lg font-semibold mb-4">Wallet Information</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600">Address</p>
          <p className="text-sm font-mono break-all overflow-hidden text-ellipsis">
            {evmAddress}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold">
              {balances[activeToken] ?? '—'}
            </p>
            <select
              value={activeToken}
              onChange={(e) => {
                setActiveToken(e.target.value as TokenKey);
                refreshBalance(e.target.value as TokenKey);
              }}
              className="px-3 py-1 rounded border text-xs sm:text-sm"
            >
              {Object.entries(tokenDisplayMap).map(([key, display]) => (
                <option key={key} value={key}>
                  {display}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {process.env.NEXT_PUBLIC_USE_MAINNET !== 'true' ? (
              <button
                onClick={handleFaucetRequest}
                disabled={isLoading}
                className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Requesting...
                  </>
                ) : (
                  'Request Faucet'
                )}
              </button>
            ) : (
              activeToken === 'eth' && (
                <button
                  onClick={handleFundRequest}
                  className="font-bold bg-[#0052ff] text-white rounded-[30px] border-none outline-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm flex items-center gap-2 w-fit hover:bg-blue-600 transition-colors"
                >
                  Request Funds
                </button>
              )
            )}

            {process.env.NEXT_PUBLIC_USE_MAINNET === 'true' &&
              activeToken !== 'eth' && (
                <button
                  onClick={handleSwapRequest}
                  disabled={isLoading}
                  className="font-bold bg-green-600 text-white rounded-[30px] border-none outline-none cursor-pointer px-4 py-1.5 text-xs sm:text-sm flex items-center gap-2 w-fit hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Swap ETH to {tokenDisplayMap[activeToken]}
                </button>
              )}
          </div>
        </div>
      </div>

      <SwapModal
        isOpen={isSwapModalOpen}
        onClose={closeSwapModal}
        fromToken="eth"
        toToken={activeToken}
        fromAmount={swapAmount}
        quote={swapQuote}
        onConfirm={handleSwapConfirm}
        isExecuting={isExecutingSwap}
        isSuccess={swapSuccess}
        transactionHash={transactionHash}
      />
    </div>
  );
};
