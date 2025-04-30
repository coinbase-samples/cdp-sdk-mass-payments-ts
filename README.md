# CDP Mass Payments Demo

![Next.js](https://img.shields.io/badge/-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/-SCSS-cd6799?style=for-the-badge&logo=SASS&logoColor=white)
![Coinbase](https://img.shields.io/badge/Coinbase-0052FF?style=for-the-badge&logo=Coinbase&logoColor=white)

A full-stack Next.js application for managing balances and paying out to other users using the [Coinbase Developer Platform SDK Wallet API](https://docs.cdp.coinbase.com/wallet-api-v2/docs/welcome).

## License

The *CDP Mass Payments App* is free and open source and released under the [Apache License, Version 2.0](LICENSE).

The application and code are only available for demonstration purposes.

## Acknowledgments

This project leverages the [Gaslite Drop contract](https://github.com/PopPunkLLC/gaslite-core/blob/main/src/GasliteDrop.sol) from [Pop Punk LLC Gaslite](https://www.gaslite.org/) for mass transfers.

Special thanks to [HeimLabs](https://www.heimlabs.com/) for foundational work on the original Paymaker [frontend](https://github.com/HeimLabs/coinbase-sdk-payout-frontend) and [backend](https://github.com/HeimLabs/coinbase-sdk-payout-backend) that informed this sample app.

## Prerequisites

- Git
- [Bun](https://bun.sh/docs/installation)
- [Coinbase Developer Platform (CDP) Account](https://portal.cdp.coinbase.com)
- Docker & Docker-Compose (for local NeonDB testing)

## Getting Started

0. Deploy the Drop Contract

This application uses the Gaslite Drop smart contract for the batch transfers.
The .env.example file contains the contract address for the Gaslite Drop contract
deployed on the Base Sepolia testnet. If you want to deploy your own contract,
you can clone the [Gaselite Core](https://github.com/PopPunkLLC/gaslite-core),
and deploy by calling:

```sh
cd gaslite-core
forge build
forge script script/GasliteDrop.s.sol \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --chain-id 84532
```

Note: you will need to have your Base Sepolia wallet private key in your env as PRIVATE_KEY

1. Clone the repository:

```sh
git clone https://github.com/coinbase-samples/coinbase-samples/cdp-sdk-mass-payments-ts.git
cd cdp-sdk-mass-payments-ts
```

2. Install dependencies:

```sh
bun install
```

3. Set up your environment variables - You will need to do the following

- Copy .env.example to .env.local
- Get an API Key ID and Secret from [Coinbase Developer Platform portal](https://portal.cdp.coinbase.com)
- Generate a WalletSecret from the [CDP Portal Wallet Page](https://portal.cdp.coinbase.com/products/wallet-api)
- Navigate to the Node page on the CDP Portal to get a Base Sepolia RPC URL for BASE_SEPOLIA_NODE_URL
- Generate a secret for NEXTAUTH_SECRET via:

```sh
openssl rand -base64 32
```

Set that output in the .env.local for JWT and CSRF token signing

4. Start the local Postgres/Neon database:

```sh
bun run start-local-db
```

5. Start the development server:

```sh
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).
