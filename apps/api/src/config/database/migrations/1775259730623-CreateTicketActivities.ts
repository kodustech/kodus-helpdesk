import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketActivities1775259730623 implements MigrationInterface {
    name = 'CreateTicketActivities1775259730623'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "helpdesk"."ticket_activities_action_enum" AS ENUM('ticket_opened', 'ticket_assigned', 'status_changed', 'title_changed', 'description_changed', 'category_changed', 'labels_added', 'labels_removed', 'comment_added', 'comment_deleted')`);
        await queryRunner.query(`CREATE TABLE "helpdesk"."ticket_activities" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "action" "helpdesk"."ticket_activities_action_enum" NOT NULL, "metadata" jsonb, "ticket_id" uuid NOT NULL, "actor_id" uuid NOT NULL, CONSTRAINT "PK_292dc317e9c31f70851e651fd14" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_activities_ticket_created" ON "helpdesk"."ticket_activities" ("ticket_id", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_activities" ADD CONSTRAINT "FK_2715f926ba0ddd73514eb0bef61" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk"."tickets"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_activities" ADD CONSTRAINT "FK_6ceea364d29ac20cba4a38fa748" FOREIGN KEY ("actor_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_activities" DROP CONSTRAINT "FK_6ceea364d29ac20cba4a38fa748"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_activities" DROP CONSTRAINT "FK_2715f926ba0ddd73514eb0bef61"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_ticket_activities_ticket_created"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."ticket_activities"`);
        await queryRunner.query(`DROP TYPE "helpdesk"."ticket_activities_action_enum"`);
    }

}
