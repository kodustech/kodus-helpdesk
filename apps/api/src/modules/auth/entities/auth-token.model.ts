import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { CoreModel } from '../../../config/database/core.model';
import { UserModel } from '../../users/entities/user.model';

@Entity('auth_tokens')
export class AuthTokenModel extends CoreModel {
    @Column({ type: 'text', name: 'refresh_token' })
    refreshToken: string;

    @Column({
        type: 'timestamp',
        name: 'expiry_date',
        default: () => 'CURRENT_TIMESTAMP',
    })
    expiryDate: Date;

    @Column({ type: 'boolean', default: false })
    used: boolean;

    @ManyToOne(() => UserModel, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserModel;
}
