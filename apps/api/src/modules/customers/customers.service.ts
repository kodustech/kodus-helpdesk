import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerModel } from './entities/customer.model';
import { UsersService } from '../users/users.service';
import { EditorAssignmentModel } from '../users/entities/editor-assignment.model';
import { UserModel } from '../users/entities/user.model';
import { UserRole } from '../../config/enums';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(CustomerModel)
        private readonly customerRepository: Repository<CustomerModel>,
        @InjectRepository(EditorAssignmentModel)
        private readonly editorAssignmentRepository: Repository<EditorAssignmentModel>,
        private readonly usersService: UsersService,
    ) {}

    async create(
        name: string,
        firstUserEmail: string,
        requestingUser: UserModel,
        site?: string,
    ) {
        const customer = this.customerRepository.create({
            name,
            site: site || null,
        });

        const savedCustomer = await this.customerRepository.save(customer);

        // Invite first user as customer_owner
        await this.usersService.inviteUsers(
            [firstUserEmail],
            requestingUser,
            UserRole.CUSTOMER_OWNER,
            savedCustomer.uuid,
        );

        return savedCustomer;
    }

    async findAll(requestingUser: UserModel): Promise<CustomerModel[]> {
        if (
            requestingUser.role === UserRole.OWNER ||
            requestingUser.role === UserRole.ADMIN
        ) {
            return this.customerRepository.find({
                order: { createdAt: 'DESC' },
            });
        }

        if (requestingUser.role === UserRole.EDITOR) {
            // Only return customers the editor is assigned to
            const assignments = await this.editorAssignmentRepository.find({
                where: { user: { uuid: requestingUser.uuid } },
                relations: ['customer'],
            });

            return assignments.map((a) => a.customer);
        }

        return [];
    }

    async findByUuid(uuid: string): Promise<CustomerModel> {
        const customer = await this.customerRepository.findOneBy({ uuid });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        return customer;
    }

    async update(uuid: string, data: Partial<CustomerModel>) {
        const customer = await this.findByUuid(uuid);

        if (data.name !== undefined) customer.name = data.name;
        if (data.site !== undefined) customer.site = data.site;

        return this.customerRepository.save(customer);
    }

    async remove(uuid: string) {
        const customer = await this.findByUuid(uuid);
        await this.customerRepository.remove(customer);
        return { message: 'Customer removed successfully' };
    }
}
