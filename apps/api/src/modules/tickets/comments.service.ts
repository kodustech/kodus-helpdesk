import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentModel } from './entities/comment.model';
import { CommentMentionModel } from './entities/comment-mention.model';
import { TicketModel } from './entities/ticket.model';
import { UserModel } from '../users/entities/user.model';
import { UserRole } from '../../config/enums';

const INTERNAL_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR];

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(CommentModel)
        private readonly commentRepository: Repository<CommentModel>,
        @InjectRepository(CommentMentionModel)
        private readonly mentionRepository: Repository<CommentMentionModel>,
        @InjectRepository(TicketModel)
        private readonly ticketRepository: Repository<TicketModel>,
    ) {}

    async create(
        ticketUuid: string,
        content: Record<string, any>,
        user: UserModel,
        mentionedUserIds?: string[],
    ): Promise<CommentModel> {
        const ticket = await this.ticketRepository.findOne({
            where: { uuid: ticketUuid },
        });
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        const comment = this.commentRepository.create({
            content,
            ticket: { uuid: ticketUuid } as TicketModel,
            author: { uuid: user.uuid } as UserModel,
        });
        const saved = await this.commentRepository.save(comment);

        // Create mention records
        if (mentionedUserIds?.length) {
            const mentions = mentionedUserIds.map((userId) =>
                this.mentionRepository.create({
                    comment: { uuid: saved.uuid } as CommentModel,
                    mentionedUser: { uuid: userId } as UserModel,
                }),
            );
            await this.mentionRepository.save(mentions);
        }

        return this.findByUuid(saved.uuid);
    }

    async findByTicket(ticketUuid: string): Promise<CommentModel[]> {
        return this.commentRepository.find({
            where: { ticket: { uuid: ticketUuid } },
            relations: ['author', 'mentions', 'mentions.mentionedUser'],
            order: { createdAt: 'ASC' },
        });
    }

    async findByUuid(uuid: string): Promise<CommentModel> {
        const comment = await this.commentRepository.findOne({
            where: { uuid },
            relations: ['author', 'mentions', 'mentions.mentionedUser'],
        });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        return comment;
    }

    async update(
        commentUuid: string,
        content: Record<string, any>,
        user: UserModel,
        mentionedUserIds?: string[],
    ): Promise<CommentModel> {
        const comment = await this.findByUuid(commentUuid);

        if (comment.author.uuid !== user.uuid) {
            throw new ForbiddenException('Only the author can edit this comment');
        }

        comment.content = content;
        await this.commentRepository.save(comment);

        // Update mentions: remove old, add new
        if (mentionedUserIds) {
            await this.mentionRepository.delete({
                comment: { uuid: commentUuid },
            });

            if (mentionedUserIds.length) {
                const mentions = mentionedUserIds.map((userId) =>
                    this.mentionRepository.create({
                        comment: { uuid: commentUuid } as CommentModel,
                        mentionedUser: { uuid: userId } as UserModel,
                    }),
                );
                await this.mentionRepository.save(mentions);
            }
        }

        return this.findByUuid(commentUuid);
    }

    async remove(commentUuid: string, user: UserModel): Promise<void> {
        const comment = await this.findByUuid(commentUuid);

        const isAuthor = comment.author.uuid === user.uuid;
        const isManagement = INTERNAL_ROLES.includes(user.role);

        if (!isAuthor && !isManagement) {
            throw new ForbiddenException(
                'Only the author or management can delete this comment',
            );
        }

        await this.commentRepository.remove(comment);
    }
}
