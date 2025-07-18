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
import { Footer } from './components/Footer';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading session...</p>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow pb-32 flex items-center justify-center">
        {session?.user ? <Payout /> : <Login />}
      </div>
      <Footer />
    </div>
  );
}
