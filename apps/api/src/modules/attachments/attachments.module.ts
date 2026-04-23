import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentModel } from './entities/attachment.model';
import { TicketModel } from '../tickets/entities/ticket.model';
import { TicketActivityModel } from '../tickets/entities/ticket-activity.model';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { StorageModule } from '../storage/storage.module';
import { ActivitiesService } from '../tickets/activities.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([AttachmentModel, TicketModel, TicketActivityModel]),
        StorageModule,
    ],
    providers: [AttachmentsService, ActivitiesService],
    controllers: [AttachmentsController],
    exports: [AttachmentsService],
})
export class AttachmentsModule {}
