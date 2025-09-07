import { currentUser } from '@clerk/nextjs/server';
import { db } from './db';


export type CheckUserResult =
  | (NonNullable<Awaited<ReturnType<typeof db.user.findUnique>>> & { isNew: boolean })
  | null;

export const checkUser = async (): Promise<CheckUserResult> => {
  const user = await currentUser();
  if (!user) return null;

  const existing = await db.user.findUnique({ where: { clerkUserId: user.id } });

  if (existing) {
    return { ...existing, isNew: false }; 
  }

  const created = await db.user.create({
    data: {
      clerkUserId: user.id,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      imageUrl: user.imageUrl,
      email: user.emailAddresses[0]?.emailAddress,
    },
  });

  return { ...created, isNew: true }; 
};
