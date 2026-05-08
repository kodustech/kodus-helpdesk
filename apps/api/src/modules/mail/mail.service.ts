import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DEFAULT_FROM_EMAIL = 'noreply@kodus.io';
const DEFAULT_FROM_NAME = 'Kodus Helpdesk';
const RESEND_API_BASE_URL = 'https://api.resend.com';

type ResendEmailPayload = {
    from: string;
    to: string[];
    subject: string;
    html: string;
};

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly configService: ConfigService) {}

    private getApiKey(): string {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not set');
        }
        return apiKey;
    }

    private getFromAddress(): string {
        const fromEmail =
            this.configService.get<string>('MAIL_FROM_EMAIL') ||
            DEFAULT_FROM_EMAIL;
        const fromName =
            this.configService.get<string>('MAIL_FROM_NAME') ||
            DEFAULT_FROM_NAME;
        return `${fromName} <${fromEmail}>`;
    }

    private async sendEmail(payload: ResendEmailPayload): Promise<unknown> {
        const apiKey = this.getApiKey();

        const response = await axios.post(
            `${RESEND_API_BASE_URL}/emails`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        return response.data;
    }

    async sendInviteEmail(
        email: string,
        userUuid: string,
        customerName?: string,
    ): Promise<void> {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.warn(
                `RESEND_API_KEY not configured. Invite email to ${email} not sent.`,
            );
            return;
        }

        try {
            const frontendUrl = this.configService.get<string>(
                'HELPDESK_FRONTEND_URL',
                'http://localhost:3004',
            );
            const inviteLink = `${frontendUrl}/invite/${userUuid}`;

            const organizationName = customerName || 'Kodus Helpdesk';
            const subject = customerName
                ? `You've been invited to ${customerName} on Kodus Helpdesk`
                : `You've been invited to Kodus Helpdesk`;

            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to ${organizationName}!</h2>
                    <p>You've been invited to join <strong>${organizationName}</strong> on Kodus Helpdesk.</p>
                    <p>Click the button below to accept your invitation and set up your account:</p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${inviteLink}"
                           style="background-color: #0070f3; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Accept Invitation
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p style="color: #666; word-break: break-all;">${inviteLink}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #999; font-size: 12px;">
                        If you did not expect this invitation, you can ignore this email.
                    </p>
                </div>
            `;

            await this.sendEmail({
                from: this.getFromAddress(),
                to: [email],
                subject,
                html,
            });

            this.logger.log(`Invite email sent to ${email}`);
        } catch (error) {
            this.logger.error(
                `Error sending invite email to ${email}:`,
                error,
            );
        }
    }
}
