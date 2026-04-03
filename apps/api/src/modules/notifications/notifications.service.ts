import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationModel } from './entities/notification.model';
import { NotificationType } from '../../config/enums/notification-type.enum';
import { UserModel } from '../users/entities/user.model';
import { TicketModel } from '../tickets/entities/ticket.model';
import { UserRole } from '../../config/enums';

const INTERNAL_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR];

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(NotificationModel)
        private readonly notificationRepository: Repository<NotificationModel>,
        @InjectRepository(UserModel)
        private readonly userRepository: Repository<UserModel>,
    ) {}

    async findByUser(
        userId: string,
        limit = 50,
        offset = 0,
    ): Promise<NotificationModel[]> {
        return this.notificationRepository.find({
            where: { recipient: { uuid: userId } },
            relations: ['ticket', 'actor'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepository.count({
            where: { recipient: { uuid: userId }, read: false },
        });
    }

    async markAsRead(notificationUuid: string, userId: string): Promise<void> {
        await this.notificationRepository.update(
            { uuid: notificationUuid, recipient: { uuid: userId } },
            { read: true },
        );
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { recipient: { uuid: userId }, read: false },
            { read: true },
        );
    }

    // --- Trigger methods ---

    async notifyNewTicket(ticket: TicketModel, actor: UserModel): Promise<void> {
        // Notify all management users
        const managementUsers = await this.userRepository
            .createQueryBuilder('user')
            .where('user.role IN (:...roles)', { roles: INTERNAL_ROLES })
            .andWhere('user.uuid != :actorId', { actorId: actor.uuid })
            .getMany();

        const notifications = managementUsers.map((user) =>
            this.notificationRepository.create({
                type: NotificationType.NEW_TICKET,
                title: 'New ticket',
                body: `${actor.name || actor.email} opened "${ticket.title}"`,
                recipient: user,
                ticket: { uuid: ticket.uuid } as TicketModel,
                actor,
            }),
        );

        if (notifications.length) {
            await this.notificationRepository.save(notifications);
        }
    }

    async notifyAssigned(
        ticket: TicketModel,
        assignee: UserModel,
        actor: UserModel,
    ): Promise<void> {
        if (assignee.uuid === actor.uuid) return;

        const notification = this.notificationRepository.create({
            type: NotificationType.TICKET_ASSIGNED,
            title: 'Ticket assigned to you',
            body: `${actor.name || actor.email} assigned you to "${ticket.title}"`,
            recipient: assignee,
            ticket: { uuid: ticket.uuid } as TicketModel,
            actor,
        });
        await this.notificationRepository.save(notification);
    }

    async notifyStatusChange(
        ticket: TicketModel,
        oldStatus: string,
        newStatus: string,
        actor: UserModel,
    ): Promise<void> {
        const recipients: UserModel[] = [];

        // Notify ticket author
        if (ticket.author && ticket.author.uuid !== actor.uuid) {
            recipients.push(ticket.author);
        }

        // Notify assignee (if different from author and actor)
        if (
            ticket.assignee &&
            ticket.assignee.uuid !== actor.uuid &&
            !recipients.some((r) => r.uuid === ticket.assignee.uuid)
        ) {
            recipients.push(ticket.assignee);
        }

        const notifications = recipients.map((user) =>
            this.notificationRepository.create({
                type: NotificationType.STATUS_CHANGED,
                title: 'Ticket status changed',
                body: `${actor.name || actor.email} changed "${ticket.title}" from ${oldStatus} to ${newStatus}`,
                recipient: user,
                ticket: { uuid: ticket.uuid } as TicketModel,
                actor,
            }),
        );

        if (notifications.length) {
            await this.notificationRepository.save(notifications);
        }
    }

    async notifyNewComment(
        ticket: TicketModel,
        actor: UserModel,
        mentionedUserIds: string[] = [],
    ): Promise<void> {
        const recipientIds = new Set<string>();

        // Notify ticket author
        if (ticket.author && ticket.author.uuid !== actor.uuid) {
            recipientIds.add(ticket.author.uuid);
        }

        // Notify assignee
        if (ticket.assignee && ticket.assignee.uuid !== actor.uuid) {
            recipientIds.add(ticket.assignee.uuid);
        }

        // Notify mentioned users
        for (const id of mentionedUserIds) {
            if (id !== actor.uuid) {
                recipientIds.add(id);
            }
        }

        if (recipientIds.size === 0) return;

        const recipients = await this.userRepository
            .createQueryBuilder('user')
            .where('user.uuid IN (:...ids)', { ids: [...recipientIds] })
            .getMany();

        // Create separate notification for mentioned users
        const notifications = recipients.map((user) => {
            const isMentioned = mentionedUserIds.includes(user.uuid);
            return this.notificationRepository.create({
                type: isMentioned ? NotificationType.MENTIONED : NotificationType.NEW_COMMENT,
                title: isMentioned ? 'You were mentioned' : 'New comment',
                body: `${actor.name || actor.email} ${isMentioned ? 'mentioned you in' : 'commented on'} "${ticket.title}"`,
                recipient: user,
                ticket: { uuid: ticket.uuid } as TicketModel,
                actor,
            });
        });

        await this.notificationRepository.save(notifications);
    }
}
