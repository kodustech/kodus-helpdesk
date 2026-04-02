import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly apiToken: string;
    private readonly frontendUrl: string;
    private readonly fromEmail: string;
    private readonly fromName: string;

    constructor(private readonly configService: ConfigService) {
        this.apiToken = this.configService.get<string>('MAILSEND_API_TOKEN');
        this.frontendUrl = this.configService.get<string>(
            'HELPDESK_FRONTEND_URL',
            'http://localhost:3000',
        );
        this.fromEmail = this.configService.get<string>(
            'MAIL_FROM_EMAIL',
            'noreply@kodus.io',
        );
        this.fromName = this.configService.get<string>(
            'MAIL_FROM_NAME',
            'Kodus Helpdesk',
        );
    }

    async sendInviteEmail(
        email: string,
        userUuid: string,
        customerName?: string,
    ): Promise<void> {
        const inviteLink = `${this.frontendUrl}/invite/${userUuid}`;

        const subject = customerName
            ? `You've been invited to ${customerName} on Kodus Helpdesk`
            : `You've been invited to Kodus Helpdesk`;

        const html = this.buildInviteTemplate(inviteLink, customerName);

        await this.sendEmail(email, subject, html);
    }

    private async sendEmail(
        to: string,
        subject: string,
        html: string,
    ): Promise<void> {
        if (!this.apiToken) {
            this.logger.warn(
                `MAILSEND_API_TOKEN not configured. Email to ${to} not sent.`,
            );
            this.logger.debug(`Subject: ${subject}`);
            return;
        }

        try {
            const response = await fetch(
                'https://api.mailersend.com/v1/email',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiToken}`,
                    },
                    body: JSON.stringify({
                        from: {
                            email: this.fromEmail,
                            name: this.fromName,
                        },
                        to: [{ email: to }],
                        subject,
                        html,
                    }),
                },
            );

            if (!response.ok) {
                const errorBody = await response.text();
                this.logger.error(
                    `Failed to send email to ${to}: ${response.status} ${errorBody}`,
                );
            } else {
                this.logger.log(`Invite email sent to ${to}`);
            }
        } catch (error) {
            this.logger.error(`Error sending email to ${to}:`, error);
        }
    }

    private buildInviteTemplate(
        inviteLink: string,
        customerName?: string,
    ): string {
        const heading = customerName
            ? `You've been invited to join <strong>${customerName}</strong> on Kodus Helpdesk`
            : `You've been invited to join <strong>Kodus Helpdesk</strong>`;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #101019; font-family: 'DM Sans', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #101019; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #181825; border-radius: 12px; padding: 40px;">
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <h1 style="color: #f8b76d; font-size: 24px; margin: 0;">Kodus Helpdesk</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #cdcddf; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">
                            <p style="margin: 0 0 16px 0;">${heading}.</p>
                            <p style="margin: 0 0 16px 0;">Click the button below to set up your account and get started.</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-bottom: 24px;">
                            <a href="${inviteLink}" style="display: inline-block; background-color: #f8b76d; color: #101019; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Accept Invite
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #f3f3f780; font-size: 13px; border-top: 1px solid #30304b; padding-top: 20px;">
                            <p style="margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }
}
