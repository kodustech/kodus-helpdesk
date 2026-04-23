import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { TicketModel } from '../../tickets/entities/ticket.model';
import { UserModel } from '../../users/entities/user.model';

@Entity('attachments')
@Index('IDX_attachments_ticket', ['ticket'])
export class AttachmentModel extends CoreModel {
    @Column({ type: 'varchar', nullable: false })
    filename: string;

    @Column({ type: 'varchar', name: 'mime_type', nullable: false })
    mimeType: string;

    @Column({ type: 'integer', nullable: false })
    size: number;

    @Column({ type: 'varchar', name: 's3_key', nullable: false })
    s3Key: string;

    @ManyToOne(() => TicketModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: TicketModel;

    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'uploaded_by_id' })
    uploadedBy: UserModel;
}
