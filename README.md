# CDP Mass Payments Demo

![Next.js](https://img.shields.io/badge/-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/-SCSS-cd6799?style=for-the-badge&logo=SASS&logoColor=white)
![Coinbase](https://img.shields.io/badge/Coinbase-0052FF?style=for-the-badge&logo=Coinbase&logoColor=white)

A full-stack Next.js application for managing balances and paying out to other users using the [Coinbase Developer Platform SDK Wallet API](https://docs.cdp.coinbase.com/wallet-api-v2/docs/welcome).

## License
The *CDP Mass Payments App* is free and open source and released under the [Apache License, Version 2.0](LICENSE).

The application and code are only available for demonstration purposes.

## Prerequisites

- Git
- Node.js (v18 or higher)
- Coinbase Developer Platform (CDP) Account
- Vercel Account (for Neon DB)

## Getting Started

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

* Copy .env.example to .env.local
* Get an API Key ID and Secret from [Coinbase Developer Platform portal](https://portal.cdp.coinbase.com)
* Create a [Neon DB instance on Vercel](https://vercel.com/marketplace/neon) (for the postgres)
* Fill out all environment variables as expected

4. Start the development server:

```sh
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Features

- 🔐 Example Authentication using [NextAuth.js](https://next-auth.js.org/) and [SignInWithEthereum](https://docs.login.xyz/)
- 💰 Creating CDP Server Wallets for logged in users
- 💸 Transfer assets to recipients - creating server wallets if the user doesn't already exist
