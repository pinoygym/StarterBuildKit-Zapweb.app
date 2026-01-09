import { cooperativeProposalRepository } from '@/repositories/cooperative-proposal.repository';
import { CreateProposalInput, ProposalFilters } from '@/types/cooperative.types';

export class ProposalService {
    async createProposal(data: CreateProposalInput) {
        if (!data.title) throw new Error('Title is required');
        return await cooperativeProposalRepository.create(data);
    }

    async updateProposalStatus(id: string, status: string) {
        return await cooperativeProposalRepository.updateStatus(id, status);
    }

    async voteOnProposal(proposalId: string, memberId: string, voteType: string, comment?: string) {
        const proposal = await cooperativeProposalRepository.findById(proposalId);
        if (!proposal) throw new Error('Proposal not found');

        // Logic check: Is voting active?
        const now = new Date();
        const { votingStartDate, votingEndDate, status } = proposal;

        if (status === 'approved' || status === 'rejected') {
            throw new Error('Voting is closed for this proposal');
        }

        if (votingStartDate && now < votingStartDate) {
            throw new Error('Voting has not started yet');
        }

        if (votingEndDate && now > votingEndDate) {
            throw new Error('Voting period has ended');
        }

        return await cooperativeProposalRepository.vote(proposalId, memberId, voteType, comment);
    }

    async getProposals(filters?: ProposalFilters) {
        return await cooperativeProposalRepository.findAll(filters);
    }

    async getProposalById(id: string) {
        const proposal = await cooperativeProposalRepository.findById(id);
        if (!proposal) throw new Error('Proposal not found');
        return proposal;
    }

    async deleteProposal(id: string) {
        return await cooperativeProposalRepository.delete(id);
    }
}

export const proposalService = new ProposalService();
