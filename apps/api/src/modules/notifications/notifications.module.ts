import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModel } from './entities/notification.model';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { UserModel } from '../users/entities/user.model';

@Module({
    imports: [TypeOrmModule.forFeature([NotificationModel, UserModel])],
    providers: [NotificationsService],
    controllers: [NotificationsController],
    exports: [NotificationsService],
})
export class NotificationsModule {}
