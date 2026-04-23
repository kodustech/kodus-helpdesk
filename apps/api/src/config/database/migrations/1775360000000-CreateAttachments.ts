import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttachments1775360000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "helpdesk"."attachments" (
                "uuid" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "filename" varchar NOT NULL,
                "mime_type" varchar NOT NULL,
                "size" integer NOT NULL,
                "s3_key" varchar NOT NULL,
                "ticket_id" uuid NOT NULL,
                "uploaded_by_id" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                CONSTRAINT "PK_attachments" PRIMARY KEY ("uuid"),
                CONSTRAINT "FK_attachments_ticket" FOREIGN KEY ("ticket_id")
                    REFERENCES "helpdesk"."tickets"("uuid") ON DELETE CASCADE,
                CONSTRAINT "FK_attachments_uploaded_by" FOREIGN KEY ("uploaded_by_id")
                    REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_attachments_ticket"
            ON "helpdesk"."attachments" ("ticket_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "helpdesk"."IDX_attachments_ticket"`,
        );
        await queryRunner.query(`DROP TABLE "helpdesk"."attachments"`);
    }
}
