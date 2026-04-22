import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentModel } from './entities/attachment.model';
import { TicketModel } from '../tickets/entities/ticket.model';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AttachmentModel, TicketModel]),
        StorageModule,
    ],
    providers: [AttachmentsService],
    controllers: [AttachmentsController],
    exports: [AttachmentsService],
})
export class AttachmentsModule {}
