import { Header } from "./components/Header";
import { Payout } from "./components/Payout";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Payout />
    </div>
  );
}
