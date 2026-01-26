import { prisma } from '@/lib/prisma';
import { CooperativeProposal, ProposalVote } from '@prisma/client';
import { CreateProposalInput, ProposalFilters } from '@/types/cooperative.types';

export class CooperativeProposalRepository {
    async create(data: CreateProposalInput): Promise<CooperativeProposal> {
        const { votingStartDate, votingEndDate, ...rest } = data;
        return prisma.cooperativeProposal.create({
            data: {
                ...rest,
                votingStartDate: votingStartDate ? new Date(votingStartDate) : null,
                votingEndDate: votingEndDate ? new Date(votingEndDate) : null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }

    async updateStatus(id: string, status: string): Promise<CooperativeProposal> {
        return prisma.cooperativeProposal.update({
            where: { id },
            data: { status, updatedAt: new Date() }
        });
    }

    async vote(proposalId: string, memberId: string, voteType: string, comment?: string): Promise<ProposalVote> {
        // Check if already voted
        const existingVote = await prisma.proposalVote.findUnique({
            where: {
                proposalId_memberId: {
                    proposalId,
                    memberId
                }
            }
        });

        if (existingVote) {
            return prisma.proposalVote.update({
                where: { id: existingVote.id },
                data: { voteType, comment, votedAt: new Date() }
            });
        }

        return prisma.proposalVote.create({
            data: {
                proposalId,
                memberId,
                voteType,
                comment,
                votedAt: new Date()
            }
        });
    }

    async findAll(filters?: ProposalFilters): Promise<CooperativeProposal[]> {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.category) where.category = filters.category;

        return prisma.cooperativeProposal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                Member: {
                    select: { firstName: true, lastName: true, photoUrl: true }
                },
                _count: { select: { Votes: true } }
            }
        });
    }

    async findById(id: string): Promise<CooperativeProposal | null> {
        return prisma.cooperativeProposal.findUnique({
            where: { id },
            include: {
                Member: {
                    select: { firstName: true, lastName: true, photoUrl: true }
                },
                Votes: {
                    include: {
                        Member: {
                            select: { firstName: true, lastName: true, photoUrl: true }
                        }
                    },
                    orderBy: { votedAt: 'desc' }
                }
            }
        });
    }

    async delete(id: string): Promise<CooperativeProposal> {
        return prisma.cooperativeProposal.delete({
            where: { id }
        });
    }
}

export const cooperativeProposalRepository = new CooperativeProposalRepository();
