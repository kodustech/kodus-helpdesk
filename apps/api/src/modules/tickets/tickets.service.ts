import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TicketModel } from './entities/ticket.model';
import { TicketLabelModel } from './entities/ticket-label.model';
import { LabelModel } from './entities/label.model';
import { UserModel } from '../users/entities/user.model';
import { EditorAssignmentModel } from '../users/entities/editor-assignment.model';
import { CustomerModel } from '../customers/entities/customer.model';
import { UserRole, UserStatus, TicketStatus } from '../../config/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivitiesService } from './activities.service';

const INTERNAL_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR];
const CUSTOMER_ROLES = [
    UserRole.CUSTOMER_OWNER,
    UserRole.CUSTOMER_ADMIN,
    UserRole.CUSTOMER_EDITOR,
];

@Injectable()
export class TicketsService {
    constructor(
        @InjectRepository(TicketModel)
        private readonly ticketRepository: Repository<TicketModel>,
        @InjectRepository(TicketLabelModel)
        private readonly ticketLabelRepository: Repository<TicketLabelModel>,
        @InjectRepository(LabelModel)
        private readonly labelRepository: Repository<LabelModel>,
        @InjectRepository(UserModel)
        private readonly userRepository: Repository<UserModel>,
        @InjectRepository(EditorAssignmentModel)
        private readonly editorAssignmentRepository: Repository<EditorAssignmentModel>,
        @InjectRepository(CustomerModel)
        private readonly customerRepository: Repository<CustomerModel>,
        private readonly notificationsService: NotificationsService,
        private readonly activitiesService: ActivitiesService,
    ) {}

    async create(
        title: string,
        description: Record<string, any>,
        category: string,
        user: UserModel,
        customerId?: string,
    ): Promise<TicketModel> {
        let customerUuid: string;
        let createdBySide: string;

        if (CUSTOMER_ROLES.includes(user.role)) {
            if (!user.customer) {
                throw new BadRequestException('Customer user has no associated customer');
            }
            customerUuid = user.customer.uuid;
            createdBySide = 'client';
        } else {
            if (!customerId) {
                throw new BadRequestException('customer_id is required for management users');
            }

            if (user.role === UserRole.EDITOR) {
                const assignment = await this.editorAssignmentRepository.findOne({
                    where: {
                        user: { uuid: user.uuid },
                        customer: { uuid: customerId },
                    },
                });
                if (!assignment) {
                    throw new ForbiddenException('You are not assigned to this customer');
                }
            }

            const customer = await this.customerRepository.findOne({
                where: { uuid: customerId },
            });
            if (!customer) {
                throw new NotFoundException('Customer not found');
            }

            customerUuid = customerId;
            createdBySide = 'management';
        }

        const ticket = this.ticketRepository.create({
            title,
            description,
            category: category as any,
            status: TicketStatus.OPEN,
            createdBySide,
            author: { uuid: user.uuid } as UserModel,
            customer: { uuid: customerUuid } as CustomerModel,
        });

        const saved = await this.ticketRepository.save(ticket);
        const fullTicket = await this.findByUuid(saved.uuid);

        // Log activity
        this.activitiesService.logTicketOpened(fullTicket, user).catch(() => {});

        // Notify: new ticket from client → all management users
        if (createdBySide === 'client') {
            this.notificationsService
                .notifyNewTicket(fullTicket, user)
                .catch(() => {});
        }

        return fullTicket;
    }

    async getStats(user: UserModel): Promise<{
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
        total: number;
    }> {
        const qb = this.ticketRepository
            .createQueryBuilder('ticket')
            .select('ticket.status', 'status')
            .addSelect('COUNT(*)', 'count');

        // Role-based filtering (same as findAll)
        if (CUSTOMER_ROLES.includes(user.role)) {
            if (!user.customer) {
                return { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
            }
            qb.where('ticket.customer_id = :custId', { custId: user.customer.uuid });
        } else if (user.role === UserRole.EDITOR) {
            const assignments = await this.editorAssignmentRepository.find({
                where: { user: { uuid: user.uuid } },
                relations: ['customer'],
            });
            const customerIds = assignments.map((a) => a.customer.uuid);
            if (customerIds.length === 0) {
                return { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
            }
            qb.where('ticket.customer_id IN (:...customerIds)', { customerIds });
        }

        qb.groupBy('ticket.status');

        const results = await qb.getRawMany();
        const stats = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };

        for (const row of results) {
            const count = parseInt(row.count, 10);
            if (row.status in stats) {
                (stats as any)[row.status] = count;
            }
            stats.total += count;
        }

        return stats;
    }

    async findAll(
        user: UserModel,
        filters?: {
            status?: string;
            customer_id?: string;
            assignee_id?: string;
            category?: string;
        },
    ): Promise<TicketModel[]> {
        const qb = this.ticketRepository
            .createQueryBuilder('ticket')
            .leftJoinAndSelect('ticket.author', 'author')
            .leftJoinAndSelect('ticket.assignee', 'assignee')
            .leftJoinAndSelect('ticket.customer', 'customer')
            .leftJoinAndSelect('ticket.ticketLabels', 'ticketLabels')
            .leftJoinAndSelect('ticketLabels.label', 'label');

        // Role-based filtering
        if (CUSTOMER_ROLES.includes(user.role)) {
            if (!user.customer) return [];
            qb.andWhere('ticket.customer = :custId', { custId: user.customer.uuid });
        } else if (user.role === UserRole.EDITOR) {
            const assignments = await this.editorAssignmentRepository.find({
                where: { user: { uuid: user.uuid } },
                relations: ['customer'],
            });
            const customerIds = assignments.map((a) => a.customer.uuid);
            if (customerIds.length === 0) return [];
            qb.andWhere('ticket.customer IN (:...customerIds)', { customerIds });
        }
        // Owner/Admin see all

        // Apply filters
        if (filters?.status) {
            const statuses = filters.status.split(',');
            qb.andWhere('ticket.status IN (:...statuses)', { statuses });
        }
        if (filters?.customer_id) {
            qb.andWhere('ticket.customer = :filtCustId', { filtCustId: filters.customer_id });
        }
        if (filters?.assignee_id) {
            qb.andWhere('ticket.assignee = :filtAssId', { filtAssId: filters.assignee_id });
        }
        if (filters?.category) {
            qb.andWhere('ticket.category = :filtCat', { filtCat: filters.category });
        }

        // Sort: open/in_progress first (by createdAt DESC), then resolved/closed
        qb.addOrderBy(
            `CASE WHEN ticket.status IN ('open', 'in_progress') THEN 0 ELSE 1 END`,
            'ASC',
        );
        qb.addOrderBy('ticket.createdAt', 'DESC');

        return qb.getMany();
    }

    async findByUuid(uuid: string): Promise<TicketModel> {
        const ticket = await this.ticketRepository.findOne({
            where: { uuid },
            relations: [
                'author',
                'assignee',
                'customer',
                'ticketLabels',
                'ticketLabels.label',
            ],
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        return ticket;
    }

    async update(
        uuid: string,
        data: { title?: string; description?: Record<string, any>; category?: string },
        user: UserModel,
    ): Promise<TicketModel> {
        const ticket = await this.findByUuid(uuid);

        // Description can only be edited by the side that created the ticket
        if (data.description) {
            const isInternal = INTERNAL_ROLES.includes(user.role);
            const canEdit =
                (isInternal && ticket.createdBySide === 'management') ||
                (!isInternal && ticket.createdBySide === 'client');

            if (!canEdit) {
                throw new ForbiddenException(
                    'Only the side that created the ticket can edit the description',
                );
            }
        }

        // Log activity for changes
        if (data.title && data.title !== ticket.title) {
            this.activitiesService
                .logTitleChanged(ticket, ticket.title, data.title, user)
                .catch(() => {});
        }
        if (data.description) {
            this.activitiesService
                .logDescriptionChanged(ticket, user)
                .catch(() => {});
        }
        if (data.category && data.category !== ticket.category) {
            this.activitiesService
                .logCategoryChanged(ticket, ticket.category, data.category, user)
                .catch(() => {});
        }

        if (data.title) ticket.title = data.title;
        if (data.description) ticket.description = data.description;
        if (data.category) ticket.category = data.category as any;

        await this.ticketRepository.save(ticket);
        return this.findByUuid(uuid);
    }

    async updateStatus(
        uuid: string,
        status: TicketStatus,
        user: UserModel,
    ): Promise<TicketModel> {
        const ticket = await this.findByUuid(uuid);
        const oldStatus = ticket.status;
        ticket.status = status;
        await this.ticketRepository.save(ticket);
        const updated = await this.findByUuid(uuid);

        if (oldStatus !== status) {
            // Log activity
            this.activitiesService
                .logStatusChanged(updated, oldStatus, status, user)
                .catch(() => {});

            // Notify status change
            this.notificationsService
                .notifyStatusChange(updated, oldStatus, status, user)
                .catch(() => {});
        }

        return updated;
    }

    async updateAssignee(
        uuid: string,
        assigneeId: string,
        actor: UserModel,
    ): Promise<TicketModel> {
        const ticket = await this.findByUuid(uuid);

        const assignee = await this.userRepository.findOne({
            where: { uuid: assigneeId },
        });
        if (!assignee) {
            throw new NotFoundException('Assignee user not found');
        }
        if (!INTERNAL_ROLES.includes(assignee.role)) {
            throw new BadRequestException('Assignee must be a management team member');
        }

        ticket.assignee = assignee;
        await this.ticketRepository.save(ticket);
        const updated = await this.findByUuid(uuid);

        // Log activity
        this.activitiesService
            .logAssigned(updated, assignee, actor)
            .catch(() => {});

        // Notify assignee
        this.notificationsService
            .notifyAssigned(updated, assignee, actor)
            .catch(() => {});

        return updated;
    }

    async addLabels(uuid: string, labelIds: string[], actor: UserModel): Promise<TicketModel> {
        const ticket = await this.findByUuid(uuid);

        const labels = await this.labelRepository.find({
            where: { uuid: In(labelIds) },
        });
        if (labels.length !== labelIds.length) {
            throw new NotFoundException('One or more labels not found');
        }

        const addedNames: string[] = [];
        for (const label of labels) {
            const existing = await this.ticketLabelRepository.findOne({
                where: {
                    ticket: { uuid: ticket.uuid },
                    label: { uuid: label.uuid },
                },
            });
            if (!existing) {
                const tl = this.ticketLabelRepository.create({
                    ticket: { uuid: ticket.uuid } as TicketModel,
                    label: { uuid: label.uuid } as LabelModel,
                });
                await this.ticketLabelRepository.save(tl);
                addedNames.push(label.name);
            }
        }

        if (addedNames.length) {
            this.activitiesService
                .logLabelsAdded(ticket, addedNames, actor)
                .catch(() => {});
        }

        return this.findByUuid(uuid);
    }

    async removeLabel(ticketUuid: string, labelUuid: string, actor: UserModel): Promise<void> {
        const tl = await this.ticketLabelRepository.findOne({
            where: {
                ticket: { uuid: ticketUuid },
                label: { uuid: labelUuid },
            },
            relations: ['label'],
        });
        if (!tl) {
            throw new NotFoundException('Label not found on this ticket');
        }

        const labelName = tl.label?.name || 'Unknown';
        await this.ticketLabelRepository.remove(tl);

        this.activitiesService
            .logLabelsRemoved({ uuid: ticketUuid } as TicketModel, labelName, actor)
            .catch(() => {});
    }

    async getMentionableUsers(
        ticketUuid: string,
        user: UserModel,
    ): Promise<Pick<UserModel, 'uuid' | 'name' | 'email' | 'role'>[]> {
        const ticket = await this.findByUuid(ticketUuid);
        const customerUuid = ticket.customer.uuid;

        let users: UserModel[];

        if (CUSTOMER_ROLES.includes(user.role)) {
            // Client can mention: their customer team (active) + all management users (active)
            const customerTeam = await this.userRepository.find({
                where: { customer: { uuid: customerUuid }, status: UserStatus.ACTIVE },
            });
            const managementTeam = await this.userRepository
                .createQueryBuilder('user')
                .where('user.role IN (:...roles)', { roles: INTERNAL_ROLES })
                .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
                .getMany();
            users = [...customerTeam, ...managementTeam];
        } else {
            // Management can mention: management team (active) + this ticket's customer team (active)
            const managementTeam = await this.userRepository
                .createQueryBuilder('user')
                .where('user.role IN (:...roles)', { roles: INTERNAL_ROLES })
                .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
                .getMany();
            const customerTeam = await this.userRepository.find({
                where: { customer: { uuid: customerUuid }, status: UserStatus.ACTIVE },
            });
            users = [...managementTeam, ...customerTeam];
        }

        // Deduplicate by uuid
        const seen = new Set<string>();
        return users
            .filter((u) => {
                if (seen.has(u.uuid)) return false;
                seen.add(u.uuid);
                return true;
            })
            .map((u) => ({
                uuid: u.uuid,
                name: u.name,
                email: u.email,
                role: u.role,
            }));
    }
}
