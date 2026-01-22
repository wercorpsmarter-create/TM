import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "./supabase"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email || !account?.providerAccountId) {
                return false
            }

            try {
                // Check if user exists
                const { data: existingUser } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .eq('google_id', account.providerAccountId)
                    .single()

                if (existingUser) {
                    // Update existing user
                    await supabaseAdmin
                        .from('users')
                        .update({
                            name: user.name,
                            email: user.email,
                        })
                        .eq('google_id', account.providerAccountId)
                } else {
                    // Create new user
                    await supabaseAdmin
                        .from('users')
                        .insert({
                            email: user.email,
                            name: user.name,
                            google_id: account.providerAccountId,
                            subscription_status: 'none',
                        })
                }

                return true
            } catch (error) {
                console.error('Error creating/updating user:', error)
                return false
            }
        },
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token
                token.googleId = account.providerAccountId
            }
            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken

            // Fetch user ID from database
            if (token.googleId) {
                const { data: dbUser } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('google_id', token.googleId as string)
                    .single()

                if (dbUser) {
                    session.userId = dbUser.id
                }
            }

            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
