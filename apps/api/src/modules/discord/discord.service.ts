import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DiscordService {
    private readonly logger = new Logger(DiscordService.name);
    private readonly webhookUrl: string | undefined;
    private readonly frontendUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.webhookUrl = this.configService.get<string>(
            'DISCORD_WEBHOOK_URL',
        );
        this.frontendUrl =
            this.configService.get<string>('HELPDESK_FRONTEND_URL') ||
            'http://localhost:3004';
    }

    async notifyNewClientTicket(ticket: {
        uuid: string;
        title: string;
        category: string;
        customer: { name: string };
        author: { name?: string; email: string };
    }): Promise<void> {
        if (!this.webhookUrl) {
            this.logger.warn(
                'DISCORD_WEBHOOK_URL not configured, skipping notification',
            );
            return;
        }

        const ticketUrl = `${this.frontendUrl}/tickets?open=${ticket.uuid}`;
        const authorName = ticket.author.name || ticket.author.email;

        const embed = {
            title: '🎫 New Support Ticket',
            color: 0xf8b76d,
            fields: [
                {
                    name: 'Customer',
                    value: ticket.customer.name,
                    inline: true,
                },
                {
                    name: 'Opened by',
                    value: authorName,
                    inline: true,
                },
                {
                    name: 'Category',
                    value: ticket.category.toUpperCase(),
                    inline: true,
                },
                {
                    name: 'Title',
                    value: ticket.title,
                },
                {
                    name: 'Link',
                    value: `[Open ticket](${ticketUrl})`,
                },
            ],
            timestamp: new Date().toISOString(),
        };

        try {
            await axios.post(this.webhookUrl, { embeds: [embed] });
        } catch (err: any) {
            this.logger.error(
                `Failed to send Discord notification: ${err.message}`,
            );
        }
    }
}
