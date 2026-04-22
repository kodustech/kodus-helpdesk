import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserModel } from '../users/entities/user.model';
import 'multer';

@Controller('tickets/:ticketUuid/attachments')
export class AttachmentsController {
    constructor(private readonly attachmentsService: AttachmentsService) {}

    @Post()
    @UseInterceptors(FilesInterceptor('files', 5))
    async upload(
        @Param('ticketUuid', ParseUUIDPipe) ticketUuid: string,
        @UploadedFiles() files: Express.Multer.File[],
        @CurrentUser() user: UserModel,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }
        return this.attachmentsService.upload(ticketUuid, files, user);
    }

    @Get()
    async findByTicket(
        @Param('ticketUuid', ParseUUIDPipe) ticketUuid: string,
    ) {
        return this.attachmentsService.findByTicket(ticketUuid);
    }

    @Get(':uuid/download')
    async getDownloadUrl(@Param('uuid', ParseUUIDPipe) uuid: string) {
        return this.attachmentsService.getDownloadUrl(uuid);
    }

    @Delete(':uuid')
    async delete(
        @Param('uuid', ParseUUIDPipe) uuid: string,
        @CurrentUser() user: UserModel,
    ) {
        await this.attachmentsService.delete(uuid, user);
        return { message: 'Attachment deleted' };
    }
}
