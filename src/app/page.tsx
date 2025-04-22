'use client';

import { Header } from "./components/Header";
import { Payout } from "./components/Payout";
import { Login } from "./components/Login";
import { useAuth } from "./context/AuthContext";

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {isAuthenticated ? <Payout /> : <Login />}
    </div>
  );
}

export default function Home() {
  return (
    <AppContent />
  );
}
