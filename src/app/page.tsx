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

'use client';

import { Header } from './components/Header';
import { Payout } from './components/Payout';
import { Login } from './components/Login';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading session...</p>;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>
      <div className="flex-grow pt-20 pb-32">
        {session?.user ? <Payout /> : <Login />}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <footer className="py-10 text-center text-gray-600 bg-white border-t border-lavender-200">
          <p>&copy; 2025 CDP SDK. All rights reserved.</p>
          <p>
            By using this app, you agree to the{' '}
            <a
              href="https://www.coinbase.com/legal/cloud/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Terms of Service
            </a>
          </p>
          <p>
            <a
              href="https://www.coinbase.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Privacy Policy
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
