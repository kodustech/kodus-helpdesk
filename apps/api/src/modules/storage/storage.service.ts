import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly s3: S3Client;
    private readonly bucket: string;

    constructor(private readonly configService: ConfigService) {
        const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
        const forcePathStyle =
            this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') ===
            'true';

        this.s3 = new S3Client({
            region:
                this.configService.get<string>('AWS_REGION') || 'us-east-2',
            credentials: {
                accessKeyId:
                    this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey:
                    this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
                    '',
            },
            ...(endpoint && { endpoint }),
            forcePathStyle,
        });

        this.bucket =
            this.configService.get<string>('AWS_BUCKET_NAME') ||
            'kodus-helpdesk';
    }

    async upload(
        file: Buffer,
        mimeType: string,
        originalName: string,
        folder: string,
    ): Promise<{ key: string; size: number }> {
        const ext = originalName.includes('.')
            ? originalName.substring(originalName.lastIndexOf('.'))
            : '';
        const key = `${folder}/${randomUUID()}${ext}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file,
                ContentType: mimeType,
            }),
        );

        return { key, size: file.length };
    }

    async delete(key: string): Promise<void> {
        await this.s3.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );
    }

    async getPresignedUrl(
        key: string,
        expiresInSeconds = 3600,
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return getSignedUrl(this.s3, command, {
            expiresIn: expiresInSeconds,
        });
    }

    async getPresignedDownloadUrl(
        key: string,
        filename: string,
        expiresInSeconds = 3600,
    ): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${filename}"`,
        });

        return getSignedUrl(this.s3, command, {
            expiresIn: expiresInSeconds,
        });
    }
}
