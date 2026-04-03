import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateTicketAssigneeDto } from './dto/update-ticket-assignee.dto';
import { AddLabelsDto } from './dto/add-labels.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../config/enums';
import { UserModel } from '../users/entities/user.model';

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Post()
    async create(
        @Body() dto: CreateTicketDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.ticketsService.create(
            dto.title,
            dto.description,
            dto.category,
            user,
            dto.customer_id,
        );
    }

    @Get()
    async findAll(
        @CurrentUser() user: UserModel,
        @Query('status') status?: string,
        @Query('customer_id') customer_id?: string,
        @Query('assignee_id') assignee_id?: string,
        @Query('category') category?: string,
    ) {
        return this.ticketsService.findAll(user, {
            status,
            customer_id,
            assignee_id,
            category,
        });
    }

    @Get(':uuid')
    async findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.ticketsService.findByUuid(uuid);
    }

    @Patch(':uuid')
    async update(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: UpdateTicketDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.ticketsService.update(uuid, dto, user);
    }

    @Patch(':uuid/status')
    async updateStatus(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: UpdateTicketStatusDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.ticketsService.updateStatus(uuid, dto.status, user);
    }

    @Patch(':uuid/assignee')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
    async updateAssignee(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: UpdateTicketAssigneeDto,
    ) {
        return this.ticketsService.updateAssignee(uuid, dto.assignee_id);
    }

    @Post(':uuid/labels')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
    async addLabels(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: AddLabelsDto,
    ) {
        return this.ticketsService.addLabels(uuid, dto.label_ids);
    }

    @Delete(':uuid/labels/:labelUuid')
    @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR)
    async removeLabel(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Param('labelUuid', ParseUUIDPipe) labelUuid: string,
    ) {
        await this.ticketsService.removeLabel(uuid, labelUuid);
        return { message: 'Label removed from ticket' };
    }

    @Get(':uuid/mentionable-users')
    async getMentionableUsers(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @CurrentUser() user: UserModel,
    ) {
        return this.ticketsService.getMentionableUsers(uuid, user);
    }
}
