import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketActivityModel } from './entities/ticket-activity.model';
import { ActivityAction } from '../../config/enums/activity-action.enum';
import { TicketModel } from './entities/ticket.model';
import { UserModel } from '../users/entities/user.model';

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectRepository(TicketActivityModel)
        private readonly activityRepository: Repository<TicketActivityModel>,
    ) {}

    async findByTicket(ticketUuid: string): Promise<TicketActivityModel[]> {
        return this.activityRepository.find({
            where: { ticket: { uuid: ticketUuid } },
            relations: ['actor'],
            order: { createdAt: 'DESC' },
        });
    }

    async log(
        action: ActivityAction,
        ticket: TicketModel | { uuid: string },
        actor: UserModel | { uuid: string },
        metadata?: Record<string, any>,
    ): Promise<void> {
        const activity = this.activityRepository.create({
            action,
            ticket: { uuid: ticket.uuid } as TicketModel,
            actor: { uuid: actor.uuid } as UserModel,
            metadata: metadata || null,
        });
        await this.activityRepository.save(activity);
    }

    // Convenience methods

    async logTicketOpened(ticket: TicketModel, actor: UserModel): Promise<void> {
        await this.log(ActivityAction.TICKET_OPENED, ticket, actor);
    }

    async logAssigned(
        ticket: TicketModel,
        assignee: UserModel,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.TICKET_ASSIGNED, ticket, actor, {
            assignee_name: assignee.name || assignee.email,
            assignee_id: assignee.uuid,
        });
    }

    async logStatusChanged(
        ticket: TicketModel,
        oldStatus: string,
        newStatus: string,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.STATUS_CHANGED, ticket, actor, {
            from: oldStatus,
            to: newStatus,
        });
    }

    async logTitleChanged(
        ticket: TicketModel,
        oldTitle: string,
        newTitle: string,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.TITLE_CHANGED, ticket, actor, {
            from: oldTitle,
            to: newTitle,
        });
    }

    async logDescriptionChanged(
        ticket: TicketModel,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.DESCRIPTION_CHANGED, ticket, actor);
    }

    async logCategoryChanged(
        ticket: TicketModel,
        oldCategory: string,
        newCategory: string,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.CATEGORY_CHANGED, ticket, actor, {
            from: oldCategory,
            to: newCategory,
        });
    }

    async logLabelsAdded(
        ticket: TicketModel,
        labelNames: string[],
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.LABELS_ADDED, ticket, actor, {
            labels: labelNames,
        });
    }

    async logLabelsRemoved(
        ticket: TicketModel,
        labelName: string,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.LABELS_REMOVED, ticket, actor, {
            labels: [labelName],
        });
    }

    async logCommentAdded(
        ticket: TicketModel,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.COMMENT_ADDED, ticket, actor);
    }

    async logCommentDeleted(
        ticket: TicketModel,
        actor: UserModel,
    ): Promise<void> {
        await this.log(ActivityAction.COMMENT_DELETED, ticket, actor);
    }
}
