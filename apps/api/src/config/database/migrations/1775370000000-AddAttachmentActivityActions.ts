import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttachmentActivityActions1775370000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "helpdesk"."ticket_activities_action_enum" ADD VALUE IF NOT EXISTS 'attachment_uploaded'`,
        );
        await queryRunner.query(
            `ALTER TYPE "helpdesk"."ticket_activities_action_enum" ADD VALUE IF NOT EXISTS 'attachment_deleted'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres does not support removing values from enums
        // A full recreate would be needed, but these values are safe to leave
    }
}
