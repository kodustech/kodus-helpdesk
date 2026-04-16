import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type CustomerIoEmailPayload = {
    transactional_message_id: string | number;
    to: string;
    from?: string;
    subject?: string;
    message_data?: Record<string, unknown>;
    identifiers?: Record<string, string | number>;
};

const CUSTOMERIO_INVITE_TRANSACTIONAL_ID = 13;

const DEFAULT_FROM_EMAIL = 'noreply@kodus.io';
const DEFAULT_FROM_NAME = 'Kodus Helpdesk';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly configService: ConfigService) {}

    private getRequiredString(envKey: string): string {
        const value = this.configService.get<string>(envKey);
        if (!value) {
            throw new Error(`${envKey} is not set`);
        }
        return value;
    }

    private getCustomerIoApiToken(): string {
        return this.getRequiredString('API_CUSTOMERIO_APP_API_TOKEN');
    }

    private getCustomerIoBaseUrl(): string {
        return (
            this.configService.get<string>('API_CUSTOMERIO_BASE_URL') ||
            'https://api.customer.io'
        );
    }

    private getFromAddress(): string {
        const fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL');
        if (!fromEmail) {
            return `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`;
        }
        const fromName = this.configService.get<string>('MAIL_FROM_NAME');
        return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    }

    private applyFromAddress(
        payload: CustomerIoEmailPayload,
    ): CustomerIoEmailPayload {
        const fromAddress = this.getFromAddress();
        if (fromAddress) {
            payload.from = fromAddress;
        }

        return payload;
    }

    private buildIdentifiers(
        email: string,
    ): CustomerIoEmailPayload['identifiers'] {
        return { email };
    }

    private async sendCustomerIoEmail(
        payload: CustomerIoEmailPayload,
    ): Promise<unknown> {
        const apiToken = this.getCustomerIoApiToken();
        const baseUrl = this.getCustomerIoBaseUrl();

        const response = await axios.post(`${baseUrl}/v1/send/email`, payload, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    }

    async sendInviteEmail(
        email: string,
        userUuid: string,
        customerName?: string,
    ): Promise<void> {
        const apiToken = this.configService.get<string>(
            'API_CUSTOMERIO_APP_API_TOKEN',
        );
        if (!apiToken) {
            this.logger.warn(
                `API_CUSTOMERIO_APP_API_TOKEN not configured. Invite email to ${email} not sent.`,
            );
            return;
        }

        try {
            const frontendUrl = this.configService.get<string>(
                'HELPDESK_FRONTEND_URL',
                'http://localhost:3004',
            );
            const inviteLink = `${frontendUrl}/invite/${userUuid}`;

            const transactionalMessageId = CUSTOMERIO_INVITE_TRANSACTIONAL_ID;

            const payload: CustomerIoEmailPayload = {
                transactional_message_id: transactionalMessageId,
                to: email,
                subject: customerName
                    ? `You've been invited to ${customerName} on Kodus Helpdesk`
                    : `You've been invited to Kodus Helpdesk`,
                identifiers: this.buildIdentifiers(email),
                message_data: {
                    organizationName: customerName || 'Kodus Helpdesk',
                    invitingUser: {
                        email: 'admin',
                    },
                    teamName: customerName || 'Kodus Helpdesk',
                    invitedUser: {
                        name: email.split('@')[0],
                        invite: inviteLink,
                    },
                },
            };

            await this.sendCustomerIoEmail(this.applyFromAddress(payload));
            this.logger.log(`Invite email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Error sending invite email to ${email}:`, error);
        }
    }
}
