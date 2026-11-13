import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1794579741690 implements MigrationInterface {
    name = 'Init1794579741690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "User" ("id" text NOT NULL, "email" text NOT NULL, "name" text NOT NULL, "role" text NOT NULL DEFAULT 'member', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) NOT NULL, "emailChangedAt" TIMESTAMP(3), CONSTRAINT "User_pkey" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "User_email_key" ON "User" ("email") `);
        await queryRunner.query(`CREATE TABLE "TeamMember" ("id" text NOT NULL, "name" text NOT NULL DEFAULT '', "email" text NOT NULL, "role" text NOT NULL, "status" text NOT NULL, "invitedAt" TIMESTAMP(3), "joinedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "TeamMember_email_key" ON "TeamMember" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."TeamMember_email_key"`);
        await queryRunner.query(`DROP TABLE "TeamMember"`);
        await queryRunner.query(`DROP INDEX "public"."User_email_key"`);
        await queryRunner.query(`DROP TABLE "User"`);
    }

}
