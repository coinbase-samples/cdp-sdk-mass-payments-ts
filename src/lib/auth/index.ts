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

import { AuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import { config } from "@/lib/config"
import { createUser, getUserByEmailHash, addPartnerId, hashEmail, createPartnerId } from "@/lib/db/user"

const providers = [];
if (config.GOOGLE_CLIENT_ID) providers.push(
  GoogleProvider({
    clientId: config.GOOGLE_CLIENT_ID!,
    clientSecret: config.GOOGLE_CLIENT_SECRET!,
  })
)
if (config.GITHUB_CLIENT_ID) providers.push(
  GithubProvider({
    clientId: config.GITHUB_CLIENT_ID!,
    clientSecret: config.GITHUB_CLIENT_SECRET!,
  })
)

export const authOptions: AuthOptions = {
  providers,
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  secret: config.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return false;

      const sha256Email = hashEmail(user.email);
      const partnerId = createPartnerId(account.provider, account.providerAccountId);

      let userDetails = await getUserByEmailHash(sha256Email);
      if (userDetails) {
        if (!userDetails.partnerIds.includes(partnerId)) {
          userDetails = await addPartnerId(sha256Email, partnerId);
        }
      } else {
        userDetails = await createUser(sha256Email, partnerId);
      }

      if (userDetails === null) {
        throw new Error("failed to retrieve user with partnerId")
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.email!;
        const sha256Email = hashEmail(user.email!);
        const userDetails = await getUserByEmailHash(sha256Email);
        if (userDetails) {
          token.userId = userDetails.userId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        const sha256Email = hashEmail(token.email);
        const user = await getUserByEmailHash(sha256Email);
        if (user) {
          session.user.id = user.userId;
        }
      }
      return session;
    }
  },
}
