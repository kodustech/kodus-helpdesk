import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { TicketCategory } from '../../../config/enums/ticket-category.enum';
import { TicketStatus } from '../../../config/enums/ticket-status.enum';
import { UserModel } from '../../users/entities/user.model';
import { CustomerModel } from '../../customers/entities/customer.model';
import { TicketLabelModel } from './ticket-label.model';
import { CommentModel } from './comment.model';
import { AttachmentModel } from '../../attachments/entities/attachment.model';

@Entity('tickets')
@Index('IDX_tickets_customer_status', ['customer', 'status'])
@Index('IDX_tickets_assignee', ['assignee'])
@Index('IDX_tickets_author', ['author'])
export class TicketModel extends CoreModel {
    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'jsonb', nullable: false })
    description: Record<string, any>;

    @Column({
        type: 'enum',
        enum: TicketCategory,
    })
    category: TicketCategory;

    @Column({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.OPEN,
    })
    status: TicketStatus;

    @Column({ type: 'varchar', name: 'created_by_side' })
    createdBySide: string;

    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author: UserModel;

    @ManyToOne(() => UserModel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assignee_id' })
    assignee: UserModel;

    @ManyToOne(() => CustomerModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: CustomerModel;

    @OneToMany(() => TicketLabelModel, (tl) => tl.ticket)
    ticketLabels: TicketLabelModel[];

    @OneToMany(() => CommentModel, (c) => c.ticket)
    comments: CommentModel[];

    @OneToMany(() => AttachmentModel, (a) => a.ticket)
    attachments: AttachmentModel[];
}
