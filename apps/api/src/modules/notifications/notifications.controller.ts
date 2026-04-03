import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserModel } from '../users/entities/user.model';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) {}

    @Get()
    async findAll(
        @CurrentUser() user: UserModel,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.notificationsService.findByUser(
            user.uuid,
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0,
        );
    }

    @Get('unread-count')
    async getUnreadCount(@CurrentUser() user: UserModel) {
        const count = await this.notificationsService.getUnreadCount(user.uuid);
        return { count };
    }

    @Patch(':uuid/read')
    async markAsRead(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @CurrentUser() user: UserModel,
    ) {
        await this.notificationsService.markAsRead(uuid, user.uuid);
        return { message: 'Notification marked as read' };
    }

    @Patch('read-all')
    async markAllAsRead(@CurrentUser() user: UserModel) {
        await this.notificationsService.markAllAsRead(user.uuid);
        return { message: 'All notifications marked as read' };
    }
}
