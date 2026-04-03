import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketSystem1775251902195 implements MigrationInterface {
    name = 'CreateTicketSystem1775251902195'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "helpdesk"."labels" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "name" character varying NOT NULL, "color" character varying NOT NULL, CONSTRAINT "UQ_543605929e5ebe08eeeab493f60" UNIQUE ("name"), CONSTRAINT "PK_2f7886971b2dac4b79a36f65269" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_labels_name" ON "helpdesk"."labels" ("name") `);
        await queryRunner.query(`CREATE TABLE "helpdesk"."ticket_labels" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "ticket_id" uuid NOT NULL, "label_id" uuid NOT NULL, CONSTRAINT "UQ_ticket_label" UNIQUE ("ticket_id", "label_id"), CONSTRAINT "PK_9e7cb7279f374a5ee057f5818d0" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "helpdesk"."comment_mentions" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "comment_id" uuid NOT NULL, "mentioned_user_id" uuid NOT NULL, CONSTRAINT "UQ_comment_mention" UNIQUE ("comment_id", "mentioned_user_id"), CONSTRAINT "PK_e951c63f8aca289719ed28bf2c6" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "helpdesk"."comments" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "content" jsonb NOT NULL, "ticket_id" uuid NOT NULL, "author_id" uuid NOT NULL, CONSTRAINT "PK_160936d39977f78f7789e0fb787" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_comments_ticket_created" ON "helpdesk"."comments" ("ticket_id", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "helpdesk"."tickets_category_enum" AS ENUM('bug', 'feature', 'improvement')`);
        await queryRunner.query(`CREATE TYPE "helpdesk"."tickets_status_enum" AS ENUM('open', 'in_progress', 'resolved', 'closed')`);
        await queryRunner.query(`CREATE TABLE "helpdesk"."tickets" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "title" character varying NOT NULL, "description" jsonb NOT NULL, "category" "helpdesk"."tickets_category_enum" NOT NULL, "status" "helpdesk"."tickets_status_enum" NOT NULL DEFAULT 'open', "created_by_side" character varying NOT NULL, "author_id" uuid NOT NULL, "assignee_id" uuid, "customer_id" uuid NOT NULL, CONSTRAINT "PK_e522585e9439011828e606834e4" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_author" ON "helpdesk"."tickets" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_assignee" ON "helpdesk"."tickets" ("assignee_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_customer_status" ON "helpdesk"."tickets" ("customer_id", "status") `);
        await queryRunner.query(`CREATE TYPE "helpdesk"."notifications_type_enum" AS ENUM('new_ticket', 'ticket_assigned', 'status_changed', 'new_comment', 'mentioned')`);
        await queryRunner.query(`CREATE TABLE "helpdesk"."notifications" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "type" "helpdesk"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "body" character varying, "read" boolean NOT NULL DEFAULT false, "recipient_id" uuid NOT NULL, "ticket_id" uuid, "actor_id" uuid, CONSTRAINT "PK_84989adc90ebf9f1c9b7ba66f0a" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_recipient_read" ON "helpdesk"."notifications" ("recipient_id", "read", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "helpdesk"."users" ADD "timezone" character varying`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_labels" ADD CONSTRAINT "FK_a4c890bc61e8cc92ce429e878ca" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk"."tickets"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_labels" ADD CONSTRAINT "FK_ecf91c0c8152320a9bbcaffdca5" FOREIGN KEY ("label_id") REFERENCES "helpdesk"."labels"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comment_mentions" ADD CONSTRAINT "FK_9ac3fac766fa09176e5c53e4d3f" FOREIGN KEY ("comment_id") REFERENCES "helpdesk"."comments"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comment_mentions" ADD CONSTRAINT "FK_ba30d858a1b9fe7f44bf42efb5a" FOREIGN KEY ("mentioned_user_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comments" ADD CONSTRAINT "FK_be8180d9b44a05e449b85f5b773" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk"."tickets"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."tickets" ADD CONSTRAINT "FK_67714d39d16d1ea5a234b05b094" FOREIGN KEY ("author_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."tickets" ADD CONSTRAINT "FK_dff6e2b44c9b5e177114588772f" FOREIGN KEY ("assignee_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."tickets" ADD CONSTRAINT "FK_42e4343476d9c4a46fb565a5c46" FOREIGN KEY ("customer_id") REFERENCES "helpdesk"."customers"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."notifications" ADD CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d" FOREIGN KEY ("recipient_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."notifications" ADD CONSTRAINT "FK_d506dd64e3806b61e88a26714e3" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk"."tickets"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."notifications" ADD CONSTRAINT "FK_20f8b51fd9655c0b69feed5efc6" FOREIGN KEY ("actor_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "helpdesk"."notifications" DROP CONSTRAINT "FK_20f8b51fd9655c0b69feed5efc6"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."notifications" DROP CONSTRAINT "FK_d506dd64e3806b61e88a26714e3"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."notifications" DROP CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."tickets" DROP CONSTRAINT "FK_42e4343476d9c4a46fb565a5c46"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."tickets" DROP CONSTRAINT "FK_dff6e2b44c9b5e177114588772f"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."tickets" DROP CONSTRAINT "FK_67714d39d16d1ea5a234b05b094"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comments" DROP CONSTRAINT "FK_be8180d9b44a05e449b85f5b773"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comment_mentions" DROP CONSTRAINT "FK_ba30d858a1b9fe7f44bf42efb5a"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."comment_mentions" DROP CONSTRAINT "FK_9ac3fac766fa09176e5c53e4d3f"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_labels" DROP CONSTRAINT "FK_ecf91c0c8152320a9bbcaffdca5"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."ticket_labels" DROP CONSTRAINT "FK_a4c890bc61e8cc92ce429e878ca"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."users" DROP COLUMN "timezone"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_notifications_recipient_read"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."notifications"`);
        await queryRunner.query(`DROP TYPE "helpdesk"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_tickets_customer_status"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_tickets_assignee"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_tickets_author"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."tickets"`);
        await queryRunner.query(`DROP TYPE "helpdesk"."tickets_status_enum"`);
        await queryRunner.query(`DROP TYPE "helpdesk"."tickets_category_enum"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_comments_ticket_created"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."comments"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."comment_mentions"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."ticket_labels"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_labels_name"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."labels"`);
    }

}
