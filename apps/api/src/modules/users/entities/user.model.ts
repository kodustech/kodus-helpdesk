import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { CoreModel } from '../../../config/database/core.model';
import { UserRole } from '../../../config/enums/user-role.enum';
import { UserStatus } from '../../../config/enums/user-status.enum';
import { AuthType } from '../../../config/enums/auth-type.enum';
import { CustomerModel } from '../../customers/entities/customer.model';

@Entity('users')
@Index('IDX_users_email', ['email'], { unique: true })
@Index('IDX_users_customer_status', ['customer', 'status'])
export class UserModel extends CoreModel {
    @Column({ type: 'varchar', unique: true })
    email: string;

    @Exclude({ toPlainOnly: true })
    @Column({ type: 'varchar', nullable: true, select: false })
    password: string;

    @Column({ type: 'varchar', nullable: true })
    name: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.EDITOR,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.PENDING,
    })
    status: UserStatus;

    @Column({
        type: 'enum',
        enum: AuthType,
        default: AuthType.LOCAL,
        name: 'auth_type',
    })
    authType: AuthType;

    @Column({ type: 'varchar', nullable: true, name: 'external_user_uuid' })
    externalUserUuid: string;

    @ManyToOne(() => CustomerModel, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'customer_id' })
    customer: CustomerModel;
}
