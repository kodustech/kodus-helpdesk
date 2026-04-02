import { Entity, Column, OneToMany } from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';

@Entity('customers')
export class CustomerModel extends CoreModel {
    @Column({ type: 'varchar', nullable: false })
    name: string;

    @Column({ type: 'varchar', nullable: true })
    site: string;
}
