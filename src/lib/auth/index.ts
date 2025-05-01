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
        // Create new user with the partner ID
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
