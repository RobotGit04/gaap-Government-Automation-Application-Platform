import { prisma } from '../utils/prisma';

export class AdminService {
  async getDashboardStats() {
    const [
      totalApplications,
      byStatus,
      byType,
      recentApplications,
      totalUsers,
      retryStats,
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.groupBy({ by: ['status'], _count: true }),
      prisma.application.groupBy({ by: ['type'], _count: true }),
      prisma.application.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.user.count(),
      prisma.retryLog.groupBy({ by: ['success'], _count: true }),
    ]);

    const approved = byStatus.find(s => s.status === 'APPROVED')?._count ?? 0;
    const failed = byStatus.find(s => s.status === 'FAILED')?._count ?? 0;
    const total = totalApplications || 1;

    return {
      overview: {
        totalApplications,
        totalUsers,
        successRate: ((approved / total) * 100).toFixed(1),
        failureRate: ((failed / total) * 100).toFixed(1),
        pendingApplications: byStatus
          .filter(s => ['DRAFT', 'DATA_COLLECTED', 'VALIDATED', 'SUBMITTED', 'RETRYING'].includes(s.status))
          .reduce((acc, s) => acc + s._count, 0),
      },
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      byType: byType.map(t => ({ type: t.type, count: t._count })),
      recentApplications,
      retryStats: {
        totalRetries: retryStats.reduce((acc, r) => acc + r._count, 0),
        successfulRetries: retryStats.find(r => r.success)?._count ?? 0,
        failedRetries: retryStats.find(r => !r.success)?._count ?? 0,
      },
    };
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true, email: true, phone: true, name: true, role: true,
          isVerified: true, createdAt: true,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAllApplications(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          retryLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    return { applications, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getApplicationRetryHistory(applicationId: string) {
    return prisma.retryLog.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
