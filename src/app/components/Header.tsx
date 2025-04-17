import Image from "next/image";
import Link from "next/link";
import { FaDiscord, FaGithub, FaLightbulb } from "react-icons/fa";

export const Header = () => {
    return (
        <header className="w-full py-6 px-8 bg-white shadow-md">
            <nav className="flex justify-between items-center">
              <Link href="/">
                <Image src="/logo.png" alt="CDP SDK Logo" width={120} height={40} />
              </Link>
              <ul className="flex space-x-6 items-center">
                <li>
                  <a href="https://docs.cdp.coinbase.com/wallet-api-v2/docs/welcome" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaLightbulb size={24} />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/nmorgan-cb/cdp-mass-payouts" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaGithub size={24} />
                  </a>
                </li>
                <li>
                  <a href="https://discord.gg/cdp" className="text-gray-700 hover:text-blue-600 transition-colors" target="_blank" rel="noopener noreferrer">
                    <FaDiscord size={24} />
                  </a>
                </li>
              </ul>
            </nav>
          </header>
    )
}