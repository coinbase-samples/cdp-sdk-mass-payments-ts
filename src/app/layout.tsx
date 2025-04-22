import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import '@coinbase/onchainkit/styles.css'; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CDP Mass Payouts",
  description: "Mass payout system for CDP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
