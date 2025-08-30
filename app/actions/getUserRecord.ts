'use server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

type GetUserRecordResult = {
  totalAmount?: number;
  daysWithRecords?: number;
  error?: string;
};

export default async function getUserRecord(): Promise<GetUserRecordResult> {
  const { userId } = await auth();
  if (!userId) return { error: 'User not found' };

  try {
    const records = await db.record.findMany({
      where: { userId },
      // If you have a date field, select it; otherwise use createdAt
      select: { amount: true, date: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalAmount = records.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

    // Count unique calendar days with any positive expense.
    // Use UTC day keys to avoid off-by-one due to server timezone.
    const dayKeys = new Set<string>();
    for (const r of records) {
      if (Number(r.amount) > 0) {
        const raw = r.date ?? r.createdAt; // prefer your own date field if present
        const d = raw instanceof Date ? raw : new Date(raw);
        const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
        dayKeys.add(dayKey);
      }
    }

    return {
      totalAmount,
      daysWithRecords: dayKeys.size,
    };
  } catch (e) {
    console.error('Error fetching user record:', e);
    return { error: 'Database error' };
  }
}
