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

import NextAuth, { SessionStrategy, AuthOptions, DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import { config } from "@/lib/config"
import { createUser, getUserByEmailHash, addPartnerId, hashEmail, createPartnerId } from "@/lib/db/user"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: config.GOOGLE_CLIENT_ID!,
      clientSecret: config.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: config.GITHUB_CLIENT_ID!,
      clientSecret: config.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  secret: config.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return false;

      const sha256Email = hashEmail(user.email);
      const partnerId = createPartnerId(account.provider, account.providerAccountId);

      const existingUser = await getUserByEmailHash(sha256Email);
      if (existingUser) {
        // Add new partner ID if it doesn't exist
        await addPartnerId(sha256Email, partnerId);
      } else {
        // Create new user with the partner ID
        await createUser(sha256Email, partnerId);
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const sha256Email = hashEmail(token.sub);
        const user = await getUserByEmailHash(sha256Email);
        if (user) {
          session.user.id = user.userId;
        }
      }
      return session;
    }
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
