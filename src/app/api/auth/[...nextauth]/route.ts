import NextAuth, { SessionStrategy } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { SiweMessage } from "siwe"
import { getServerSession } from "next-auth"
import { config } from "@/lib/config"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"))
          const nextAuthUrl = new URL(config.NEXTAUTH_URL!)
          const domain = nextAuthUrl.host

          const nonce = (await getServerSession(authOptions))?.csrfToken

          const result = await siwe.verify({
            signature: credentials?.signature || "",
            domain,
            nonce,
          })

          if (result.success) {
            return {
              id: siwe.address,
            }
          }
          return null
        } catch (e) {
          console.error("SIWE Auth error", e)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  secret: config.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      session.address = token.sub
      session.user.name = token.sub
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
