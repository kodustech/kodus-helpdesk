import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { ActivityAction } from '../../../config/enums/activity-action.enum';
import { TicketModel } from './ticket.model';
import { UserModel } from '../../users/entities/user.model';

@Entity('ticket_activities')
@Index('IDX_ticket_activities_ticket_created', ['ticket', 'createdAt'])
export class TicketActivityModel extends CoreModel {
    @Column({
        type: 'enum',
        enum: ActivityAction,
    })
    action: ActivityAction;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @ManyToOne(() => TicketModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: TicketModel;

    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'actor_id' })
    actor: UserModel;
}
