import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1775139387515 implements MigrationInterface {
    name = 'CreateInitialTables1775139387515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "helpdesk"."customers" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "name" character varying NOT NULL, "site" character varying, CONSTRAINT "PK_a41cc8fde9ac3d9bcb91412c596" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TYPE "helpdesk"."users_role_enum" AS ENUM('owner', 'admin', 'editor', 'customer_owner', 'customer_admin', 'customer_editor')`);
        await queryRunner.query(`CREATE TYPE "helpdesk"."users_status_enum" AS ENUM('pending', 'active', 'removed')`);
        await queryRunner.query(`CREATE TYPE "helpdesk"."users_auth_type_enum" AS ENUM('local', 'cloud')`);
        await queryRunner.query(`CREATE TABLE "helpdesk"."users" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "email" character varying NOT NULL, "password" character varying, "name" character varying, "role" "helpdesk"."users_role_enum" NOT NULL DEFAULT 'editor', "status" "helpdesk"."users_status_enum" NOT NULL DEFAULT 'pending', "auth_type" "helpdesk"."users_auth_type_enum" NOT NULL DEFAULT 'local', "external_user_uuid" character varying, "customer_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_951b8f1dfc94ac1d0301a14b7e1" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE INDEX "IDX_users_customer_status" ON "helpdesk"."users" ("customer_id", "status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "helpdesk"."users" ("email") `);
        await queryRunner.query(`CREATE TABLE "helpdesk"."editor_assignments" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "user_id" uuid NOT NULL, "customer_id" uuid NOT NULL, CONSTRAINT "UQ_editor_assignment_user_customer" UNIQUE ("user_id", "customer_id"), CONSTRAINT "PK_63ea57f89c36f6d94ed90a86c50" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`CREATE TABLE "helpdesk"."auth_tokens" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "refresh_token" text NOT NULL, "expiry_date" TIMESTAMP NOT NULL DEFAULT now(), "used" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, CONSTRAINT "PK_b971958648768e4d71d5371a48c" PRIMARY KEY ("uuid"))`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."users" ADD CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b" FOREIGN KEY ("customer_id") REFERENCES "helpdesk"."customers"("uuid") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."editor_assignments" ADD CONSTRAINT "FK_9c1c543db74cc8e2284f17f967b" FOREIGN KEY ("user_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."editor_assignments" ADD CONSTRAINT "FK_43c6d4b845092dca521f64d3cf0" FOREIGN KEY ("customer_id") REFERENCES "helpdesk"."customers"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."auth_tokens" ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "helpdesk"."users"("uuid") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "helpdesk"."auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."editor_assignments" DROP CONSTRAINT "FK_43c6d4b845092dca521f64d3cf0"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."editor_assignments" DROP CONSTRAINT "FK_9c1c543db74cc8e2284f17f967b"`);
        await queryRunner.query(`ALTER TABLE "helpdesk"."users" DROP CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."auth_tokens"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."editor_assignments"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "helpdesk"."IDX_users_customer_status"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."users"`);
        await queryRunner.query(`DROP TYPE "helpdesk"."users_auth_type_enum"`);
        await queryRunner.query(`DROP TYPE "helpdesk"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "helpdesk"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "helpdesk"."customers"`);
    }

}
