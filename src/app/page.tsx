'use client';

import { Header } from "./components/Header";
import { Payout } from "./components/Payout";
import { Login } from "./components/Login";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <p>Loading session...</p>

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {session?.user ? <Payout /> : <Login />}
    </div>
  );
}
