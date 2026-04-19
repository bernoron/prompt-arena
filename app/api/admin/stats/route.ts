/**
 * GET /api/admin/stats  – Aggregate statistics for the admin dashboard
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// @spec AC-07-004
export async function GET() {
  const [
    totalUsers, totalPrompts, totalVotes, usageAgg,
    topPrompts, recentUsers, categoryBreakdown,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.prompt.count(),
    prisma.vote.count(),
    prisma.prompt.aggregate({ _sum: { usageCount: true } }),
    prisma.prompt.findMany({
      orderBy: { usageCount: 'desc' },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, department: true, totalPoints: true, createdAt: true },
    }),
    prisma.prompt.groupBy({ by: ['category'], _count: { id: true } }),
  ]);

  return NextResponse.json({
    totals: {
      users:   totalUsers,
      prompts: totalPrompts,
      votes:   totalVotes,
      usages:  usageAgg._sum.usageCount ?? 0,
    },
    topPrompts: topPrompts.map((p) => ({ id: p.id, title: p.title, category: p.category, usageCount: p.usageCount, author: p.author.name })),
    recentUsers: recentUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    categoryBreakdown: categoryBreakdown.map((c) => ({ category: c.category, count: c._count.id })),
  });
}
