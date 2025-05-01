import { AuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google"
import GithubProvider from "next-auth/providers/github"
import { config } from "@/lib/config"
import { createUser, getUserByEmailHash, addPartnerId, hashEmail, createPartnerId } from "@/lib/db/user"

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

      let userDetails = await getUserByEmailHash(sha256Email);
      if (userDetails && !userDetails.partnerIds.includes(partnerId)) {
        // Add new partner ID if it doesn't exist
        userDetails = await addPartnerId(sha256Email, partnerId);
      } else {
        // Create new user with the partner ID
        userDetails = await createUser(sha256Email, partnerId);
      }

      if (userDetails === null) {
        throw new Error("failed to retrieve user with partnerId")
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
