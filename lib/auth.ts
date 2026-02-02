import { prisma } from './prisma'

type SessionLike = {
  user?: ({ id?: string } & Record<string, unknown>) | null
} & Record<string, unknown>

type SessionCallbackParams = { session: SessionLike; user: { id: string } }

type CreateUserEventParams = { user: { id: string } }

export const authOptions = {
  callbacks: {
    session: async ({ session, user }: SessionCallbackParams) => {
      if (session?.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  events: {
    createUser: async ({ user }: CreateUserEventParams) => {
      // Give new users 10 free credits
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          credits: 10,
          plan: 'FREE'
        },
      })
    },
  },
} as const
