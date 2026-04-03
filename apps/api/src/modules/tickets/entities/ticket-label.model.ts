import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { TicketModel } from './ticket.model';
import { LabelModel } from './label.model';

@Entity('ticket_labels')
@Unique('UQ_ticket_label', ['ticket', 'label'])
export class TicketLabelModel extends CoreModel {
    @ManyToOne(() => TicketModel, (t) => t.ticketLabels, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'ticket_id' })
    ticket: TicketModel;

    @ManyToOne(() => LabelModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'label_id' })
    label: LabelModel;
}
