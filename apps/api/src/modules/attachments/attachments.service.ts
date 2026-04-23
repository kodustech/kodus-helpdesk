import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttachmentModel } from './entities/attachment.model';
import { TicketModel } from '../tickets/entities/ticket.model';
import { UserModel } from '../users/entities/user.model';
import { StorageService } from '../storage/storage.service';
import { ActivitiesService } from '../tickets/activities.service';
import 'multer';

const MAX_FILES_PER_TICKET = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
];

@Injectable()
export class AttachmentsService {
    constructor(
        @InjectRepository(AttachmentModel)
        private readonly attachmentRepository: Repository<AttachmentModel>,
        @InjectRepository(TicketModel)
        private readonly ticketRepository: Repository<TicketModel>,
        private readonly storageService: StorageService,
        private readonly activitiesService: ActivitiesService,
    ) {}

    async upload(
        ticketUuid: string,
        files: Express.Multer.File[],
        user: UserModel,
    ): Promise<AttachmentModel[]> {
        const ticket = await this.ticketRepository.findOne({
            where: { uuid: ticketUuid },
        });
        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        // Check existing attachment count
        const existingCount = await this.attachmentRepository.count({
            where: { ticket: { uuid: ticketUuid } },
        });

        if (existingCount + files.length > MAX_FILES_PER_TICKET) {
            throw new BadRequestException(
                `Maximum ${MAX_FILES_PER_TICKET} files per ticket. Currently ${existingCount} file(s) attached.`,
            );
        }

        // Validate each file
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                throw new BadRequestException(
                    `File "${file.originalname}" exceeds the 10MB limit`,
                );
            }
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                throw new BadRequestException(
                    `File type "${file.mimetype}" is not allowed`,
                );
            }
        }

        // Upload all files to S3 and save records
        const attachments: AttachmentModel[] = [];

        for (const file of files) {
            const { key, size } = await this.storageService.upload(
                file.buffer,
                file.mimetype,
                file.originalname,
                `tickets/${ticketUuid}`,
            );

            const attachment = this.attachmentRepository.create({
                filename: file.originalname,
                mimeType: file.mimetype,
                size,
                s3Key: key,
                ticket: { uuid: ticketUuid } as TicketModel,
                uploadedBy: { uuid: user.uuid } as UserModel,
            });

            attachments.push(await this.attachmentRepository.save(attachment));
        }

        // Log activity
        this.activitiesService
            .logAttachmentUploaded(
                { uuid: ticketUuid },
                files.map((f) => f.originalname),
                user,
            )
            .catch(() => {});

        return attachments;
    }

    async findByTicket(ticketUuid: string): Promise<
        (AttachmentModel & { url: string })[]
    > {
        const attachments = await this.attachmentRepository.find({
            where: { ticket: { uuid: ticketUuid } },
            relations: ['uploadedBy'],
            order: { createdAt: 'ASC' },
        });

        return Promise.all(
            attachments.map(async (attachment) => ({
                ...attachment,
                url: await this.storageService.getPresignedUrl(
                    attachment.s3Key,
                ),
            })),
        );
    }

    async getDownloadUrl(
        attachmentUuid: string,
    ): Promise<{ url: string; filename: string }> {
        const attachment = await this.attachmentRepository.findOne({
            where: { uuid: attachmentUuid },
        });

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        const url = await this.storageService.getPresignedDownloadUrl(
            attachment.s3Key,
            attachment.filename,
        );

        return { url, filename: attachment.filename };
    }

    async delete(attachmentUuid: string, user: UserModel): Promise<void> {
        const attachment = await this.attachmentRepository.findOne({
            where: { uuid: attachmentUuid },
            relations: ['uploadedBy', 'ticket'],
        });

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        // Only the uploader or management roles can delete
        const isOwner = attachment.uploadedBy.uuid === user.uuid;
        const isManagement = ['owner', 'admin', 'editor'].includes(user.role);

        if (!isOwner && !isManagement) {
            throw new ForbiddenException(
                'You do not have permission to delete this attachment',
            );
        }

        // Get ticket reference before removing
        const ticketUuid = attachment.ticket
            ? attachment.ticket.uuid
            : undefined;

        await this.storageService.delete(attachment.s3Key);
        await this.attachmentRepository.remove(attachment);

        // Log activity
        if (ticketUuid) {
            this.activitiesService
                .logAttachmentDeleted(
                    { uuid: ticketUuid },
                    attachment.filename,
                    user,
                )
                .catch(() => {});
        }
    }
}
