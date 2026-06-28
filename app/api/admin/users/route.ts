/**
 * GET /api/admin/users
 *
 * Returns all users with decrypted email addresses.
 * Admin-only endpoint (protected by middleware).
 *
 * @spec AC-12-006
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decryptEmail } from '@/lib/email-crypto';

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { totalPoints: 'desc' },
    select: {
      id: true, name: true, department: true, avatarColor: true,
      totalPoints: true, level: true, createdAt: true,
      emailEncrypted: true,
    },
  });

  const result = users.map((u) => {
    let emailDecrypted: string | null = null;
    if (u.emailEncrypted) {
      try { emailDecrypted = decryptEmail(u.emailEncrypted); } catch { /* tampered or wrong key */ }
    }
    return {
      id: u.id, name: u.name, department: u.department,
      avatarColor: u.avatarColor, totalPoints: u.totalPoints,
      level: u.level, createdAt: u.createdAt, emailDecrypted,
    };
  });

  return NextResponse.json(result);
}
