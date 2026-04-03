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
import { UsersService } from './users.service';
import { InviteUsersDto } from './dto/invite-users.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { UpdateTimezoneDto } from './dto/update-timezone.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../config/enums';
import { UserModel } from './entities/user.model';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles(
        UserRole.OWNER,
        UserRole.ADMIN,
        UserRole.CUSTOMER_OWNER,
        UserRole.CUSTOMER_ADMIN,
    )
    async findAll(@CurrentUser() user: UserModel) {
        return this.usersService.findAll(user);
    }

    @Post('invite')
    @Roles(
        UserRole.OWNER,
        UserRole.ADMIN,
        UserRole.CUSTOMER_OWNER,
        UserRole.CUSTOMER_ADMIN,
    )
    async invite(
        @Body() dto: InviteUsersDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.usersService.inviteUsers(
            dto.emails,
            user,
            dto.role,
            dto.customer_id,
        );
    }

    @Public()
    @Get('invite/:uuid')
    async getInviteData(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.usersService.getInviteData(uuid);
    }

    @Public()
    @Post('invite/:uuid/accept')
    async acceptInvite(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: AcceptInviteDto,
    ) {
        return this.usersService.acceptInvite(
            uuid,
            dto.name,
            dto.password,
            dto.confirm_password,
        );
    }

    @Patch('timezone')
    async updateTimezone(
        @Body() dto: UpdateTimezoneDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.usersService.updateTimezone(user.uuid, dto.timezone);
    }

    @Patch('password')
    async changePassword(
        @Body() dto: ChangePasswordDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.usersService.changePassword(
            user.uuid,
            dto.current_password,
            dto.new_password,
            dto.confirm_password,
        );
    }

    @Patch(':uuid/role')
    @Roles(
        UserRole.OWNER,
        UserRole.ADMIN,
        UserRole.CUSTOMER_OWNER,
        UserRole.CUSTOMER_ADMIN,
    )
    async changeRole(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @Body() dto: ChangeRoleDto,
        @CurrentUser() user: UserModel,
    ) {
        return this.usersService.changeRole(uuid, dto.role, user);
    }

    @Delete(':uuid')
    @Roles(
        UserRole.OWNER,
        UserRole.ADMIN,
        UserRole.CUSTOMER_OWNER,
        UserRole.CUSTOMER_ADMIN,
    )
    async remove(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @CurrentUser() user: UserModel,
    ) {
        return this.usersService.removeUser(uuid, user);
    }
}
