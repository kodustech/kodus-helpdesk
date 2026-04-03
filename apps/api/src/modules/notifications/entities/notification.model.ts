import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { NotificationType } from '../../../config/enums/notification-type.enum';
import { UserModel } from '../../users/entities/user.model';
import { TicketModel } from '../../tickets/entities/ticket.model';

@Entity('notifications')
@Index('IDX_notifications_recipient_read', ['recipient', 'read', 'createdAt'])
export class NotificationModel extends CoreModel {
    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'varchar', nullable: true })
    body: string;

    @Column({ type: 'boolean', default: false })
    read: boolean;

    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipient_id' })
    recipient: UserModel;

    @ManyToOne(() => TicketModel, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: TicketModel;

    @ManyToOne(() => UserModel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'actor_id' })
    actor: UserModel;
}
