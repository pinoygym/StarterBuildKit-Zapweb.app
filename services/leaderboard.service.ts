import { prisma } from '@/lib/prisma';

export class LeaderboardService {
    async getTopContributors(limit: number = 10) {
        return prisma.memberEngagementScore.findMany({
            take: limit,
            orderBy: { totalXp: 'desc' },
            include: {
                Member: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        photoUrl: true,
                        memberCode: true
                    }
                }
            }
        });
    }

    async getMemberRank(memberId: string) {
        const memberScore = await prisma.memberEngagementScore.findUnique({
            where: { memberId }
        });

        if (!memberScore) return { rank: null, totalXp: 0, badges: [] };

        const higherScores = await prisma.memberEngagementScore.count({
            where: {
                totalXp: { gt: memberScore.totalXp }
            }
        });

        return {
            rank: higherScores + 1,
            totalXp: memberScore.totalXp,
            badges: memberScore.badgesEarned
        };
    }
}

export const leaderboardService = new LeaderboardService();
