import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../config/enums';
import { UserModel } from '../users/entities/user.model';

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Post()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async create(
        @Body() dto: CreateCustomerDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.customersService.create(
            dto.name,
            dto.first_user_email,
            user,
            dto.site,
        );
    }

    @Get()
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
    async findAll(@CurrentUser() user: UserModel) {
        return this.customersService.findAll(user);
    }

    @Get(':uuid')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
    async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.customersService.findByUuid(uuid);
    }

    @Patch(':uuid')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async update(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: UpdateCustomerDto,
    ) {
        return this.customersService.update(uuid, dto);
    }

    @Delete(':uuid')
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async remove(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.customersService.remove(uuid);
    }
}
