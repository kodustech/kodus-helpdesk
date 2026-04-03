import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { TicketModel } from './ticket.model';
import { UserModel } from '../../users/entities/user.model';
import { CommentMentionModel } from './comment-mention.model';

@Entity('comments')
@Index('IDX_comments_ticket_created', ['ticket', 'createdAt'])
export class CommentModel extends CoreModel {
    @Column({ type: 'jsonb', nullable: false })
    content: Record<string, any>;

    @ManyToOne(() => TicketModel, (t) => t.comments, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ticket_id' })
    ticket: TicketModel;

    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author: UserModel;

    @OneToMany(() => CommentMentionModel, (m) => m.comment)
    mentions: CommentMentionModel[];
}
