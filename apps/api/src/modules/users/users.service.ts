import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserModel } from './entities/user.model';
import { EditorAssignmentModel } from './entities/editor-assignment.model';
import { CustomerModel } from '../customers/entities/customer.model';
import { MailService } from '../mail/mail.service';
import {
    UserRole,
    UserStatus,
    AuthType,
} from '../../config/enums';
import {
    canManageRole,
    canRemoveUser,
    canChangeRole,
} from '../auth/helpers/permission.helper';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(UserModel)
        private readonly userRepository: Repository<UserModel>,
        @InjectRepository(EditorAssignmentModel)
        private readonly editorAssignmentRepository: Repository<EditorAssignmentModel>,
        private readonly dataSource: DataSource,
        private readonly mailService: MailService,
    ) {}

    async findAll(requestingUser: UserModel): Promise<UserModel[]> {
        const query = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.customer', 'customer')
            .where('user.status != :removed', {
                removed: UserStatus.REMOVED,
            });

        if (
            requestingUser.role === UserRole.OWNER ||
            requestingUser.role === UserRole.ADMIN
        ) {
            // See all users
        } else if (
            requestingUser.role === UserRole.CUSTOMER_OWNER ||
            requestingUser.role === UserRole.CUSTOMER_ADMIN
        ) {
            // See only users in their workspace
            query.andWhere('customer.uuid = :customerId', {
                customerId: requestingUser.customer?.uuid,
            });
        } else {
            // Editor and customer-editor: empty list (they don't manage users)
            return [];
        }

        return query.getMany();
    }

    async findByUuid(uuid: string): Promise<UserModel> {
        const user = await this.userRepository.findOne({
            where: { uuid },
            relations: ['customer'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email: string): Promise<UserModel | null> {
        return this.userRepository.findOne({
            where: { email },
            relations: ['customer'],
        });
    }

    async inviteUsers(
        emails: string[],
        invitedBy: UserModel,
        role: UserRole,
        customerId?: string,
    ): Promise<{ created: UserModel[]; skipped: string[] }> {
        this.logger.log(
            `[INVITE] Started — emails: [${emails.join(', ')}], role: ${role}, customerId: ${customerId || 'none'}, invitedBy: ${invitedBy.email}`,
        );

        // Validate permissions
        if (!canManageRole(invitedBy, role, customerId)) {
            this.logger.warn(
                `[INVITE] Permission denied — ${invitedBy.email} (${invitedBy.role}) cannot invite role ${role}`,
            );
            throw new ForbiddenException(
                'You do not have permission to invite users with this role',
            );
        }

        let customer: CustomerModel | null = null;
        if (customerId) {
            customer = await this.dataSource
                .getRepository(CustomerModel)
                .findOneBy({ uuid: customerId });

            if (!customer) {
                this.logger.warn(
                    `[INVITE] Customer not found: ${customerId}`,
                );
                throw new NotFoundException('Customer not found');
            }
            this.logger.log(
                `[INVITE] Customer resolved: ${customer.name} (${customer.uuid})`,
            );
        }

        // Check which emails already exist in kodus-ai public.users
        let kodusUsers: { uuid: string; email: string }[] = [];
        try {
            kodusUsers = await this.dataSource.query(
                `SELECT uuid, email FROM public.users WHERE email = ANY($1)`,
                [emails],
            );
            this.logger.log(
                `[INVITE] Kodus cloud users found: ${kodusUsers.length > 0 ? kodusUsers.map((u) => u.email).join(', ') : 'none'}`,
            );
        } catch (err: any) {
            // public.users table might not exist (e.g., in isolated dev)
            this.logger.warn(
                `[INVITE] Could not query public.users — ${err.message}. Assuming all users are local`,
            );
        }

        const kodusEmailMap = new Map(
            kodusUsers.map((u) => [u.email.toLowerCase(), u.uuid]),
        );

        const created: UserModel[] = [];
        const skipped: string[] = [];

        for (const email of emails) {
            const normalizedEmail = email.toLowerCase().trim();

            // Check if user already exists in helpdesk
            const existing = await this.userRepository.findOneBy({
                email: normalizedEmail,
            });
            if (existing) {
                this.logger.log(
                    `[INVITE] Skipped ${normalizedEmail} — already exists (status: ${existing.status})`,
                );
                skipped.push(normalizedEmail);
                continue;
            }

            const kodusUuid = kodusEmailMap.get(normalizedEmail);
            const isCloud = !!kodusUuid;

            this.logger.log(
                `[INVITE] Creating user ${normalizedEmail} — type: ${isCloud ? 'cloud' : 'local'}, status: ${isCloud ? 'active' : 'pending'}`,
            );

            const user = this.userRepository.create({
                email: normalizedEmail,
                role,
                status: kodusUuid ? UserStatus.ACTIVE : UserStatus.PENDING,
                authType: kodusUuid ? AuthType.CLOUD : AuthType.LOCAL,
                externalUserUuid: kodusUuid || null,
                customer: customer || null,
            });

            const savedUser = await this.userRepository.save(user);
            created.push(savedUser);
            this.logger.log(
                `[INVITE] User saved: ${savedUser.uuid} (${normalizedEmail})`,
            );

            // Send invite email only for local users
            if (!kodusUuid) {
                this.logger.log(
                    `[INVITE] Sending invite email to ${normalizedEmail} (uuid: ${savedUser.uuid})`,
                );
                try {
                    await this.mailService.sendInviteEmail(
                        normalizedEmail,
                        savedUser.uuid,
                        customer?.name,
                    );
                    this.logger.log(
                        `[INVITE] Email sent successfully to ${normalizedEmail}`,
                    );
                } catch (err: any) {
                    this.logger.error(
                        `[INVITE] Email FAILED for ${normalizedEmail}: ${err.message}`,
                        err.stack,
                    );
                }
            } else {
                this.logger.log(
                    `[INVITE] Skipping email for ${normalizedEmail} — cloud user (auto-activated)`,
                );
            }
        }

        this.logger.log(
            `[INVITE] Done — created: ${created.length}, skipped: ${skipped.length}`,
        );
        return { created, skipped };
    }

    async getInviteData(uuid: string) {
        const user = await this.userRepository.findOne({
            where: { uuid, status: UserStatus.PENDING },
            relations: ['customer'],
        });

        if (!user) {
            throw new NotFoundException('Invite not found or already accepted');
        }

        return {
            uuid: user.uuid,
            email: user.email,
            customerName: user.customer?.name || null,
        };
    }

    async acceptInvite(
        uuid: string,
        name: string,
        password: string,
        confirmPassword: string,
    ) {
        if (password !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const user = await this.userRepository.findOne({
            where: { uuid, status: UserStatus.PENDING },
        });

        if (!user) {
            throw new NotFoundException('Invite not found or already accepted');
        }

        user.name = name;
        user.password = await bcrypt.hash(password, 10);
        user.status = UserStatus.ACTIVE;

        await this.userRepository.save(user);

        return { message: 'Invite accepted successfully' };
    }

    async updateTimezone(userUuid: string, timezone: string) {
        const user = await this.findByUuid(userUuid);
        user.timezone = timezone;
        await this.userRepository.save(user);
        return { message: 'Timezone updated successfully', timezone };
    }

    async changePassword(
        userUuid: string,
        currentPassword: string,
        newPassword: string,
        confirmPassword: string,
    ) {
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('Passwords do not match');
        }

        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.uuid = :uuid', { uuid: userUuid })
            .getOne();

        if (!user || !user.password) {
            throw new NotFoundException('User not found');
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);

        return { message: 'Password changed successfully' };
    }

    async changeRole(
        targetUuid: string,
        newRole: UserRole,
        requestingUser: UserModel,
    ) {
        const targetUser = await this.findByUuid(targetUuid);

        if (!canChangeRole(requestingUser, targetUser, newRole)) {
            throw new ForbiddenException(
                'You do not have permission to change this user\'s role',
            );
        }

        targetUser.role = newRole;
        await this.userRepository.save(targetUser);

        return targetUser;
    }

    async removeUser(targetUuid: string, requestingUser: UserModel) {
        const targetUser = await this.findByUuid(targetUuid);

        if (!canRemoveUser(requestingUser, targetUser)) {
            throw new ForbiddenException(
                'You do not have permission to remove this user',
            );
        }

        targetUser.status = UserStatus.REMOVED;
        await this.userRepository.save(targetUser);

        return { message: 'User removed successfully' };
    }
}
