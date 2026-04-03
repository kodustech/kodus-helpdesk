import { Entity, Column, Index } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';

@Entity('labels')
@Index('IDX_labels_name', ['name'], { unique: true })
export class LabelModel extends CoreModel {
    @Column({ type: 'varchar', nullable: false, unique: true })
    name: string;

    @Column({ type: 'varchar', nullable: false })
    color: string;
}
