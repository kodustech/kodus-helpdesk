import {
    Entity,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { UserModel } from './user.model';
import { CustomerModel } from '../../customers/entities/customer.model';

@Entity('editor_assignments')
@Unique('UQ_editor_assignment_user_customer', ['user', 'customer'])
export class EditorAssignmentModel extends CoreModel {
    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserModel;

    @ManyToOne(() => CustomerModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: CustomerModel;
}
