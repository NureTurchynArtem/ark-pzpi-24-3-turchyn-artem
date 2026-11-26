import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1795337295582 implements MigrationInterface {
  name = 'InitSchema1795337295582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."locale" AS ENUM('uk', 'en')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(100) NOT NULL, "full_name" character varying(128) NOT NULL, "role_id" integer NOT NULL, "locale" "public"."locale" NOT NULL DEFAULT 'uk', "time_zone" character varying(64) NOT NULL DEFAULT 'Europe/Kyiv', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_users_email" UNIQUE ("email"), CONSTRAINT "pk_users" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_role_id" ON "users" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "code" character varying(32) NOT NULL, "name_uk" character varying(64) NOT NULL, "name_en" character varying(64) NOT NULL, CONSTRAINT "uq_roles_code" UNIQUE ("code"), CONSTRAINT "pk_roles" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "actions" ("id" SERIAL NOT NULL, "code" character varying(64) NOT NULL, "name_uk" character varying(128) COLLATE "uk-x-icu" NOT NULL, "name_en" character varying(128) COLLATE "en-x-icu" NOT NULL, "risk_level" "public"."risk_level" NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_actions_code" UNIQUE ("code"), CONSTRAINT "pk_actions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."parameter_type" AS ENUM('INTEGER', 'NUMBER', 'STRING', 'BOOLEAN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "action_parameters" ("id" SERIAL NOT NULL, "action_id" integer NOT NULL, "code" character varying(32) NOT NULL, "name_uk" character varying(64) NOT NULL, "name_en" character varying(64) NOT NULL, "type" "public"."parameter_type" NOT NULL, "unit" character varying(16), "min_value" double precision, "max_value" double precision, "is_required" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_action_parameters_action_code" UNIQUE ("action_id", "code"), CONSTRAINT "chk_action_parameters_range" CHECK ("min_value" IS NULL OR "max_value" IS NULL OR "min_value" <= "max_value"), CONSTRAINT "pk_action_parameters" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "user_id" integer, "operation" character varying(64) NOT NULL, "entity_type" character varying(32) NOT NULL, "entity_id" integer, "details" character varying(500), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "pk_audit_logs" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_status" AS ENUM('ACTIVE', 'REVOKED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "devices" ("id" SERIAL NOT NULL, "serial_number" character varying(32) NOT NULL, "name" character varying(64) NOT NULL, "owner_id" integer, "key_hash" character(64) NOT NULL, "status" "public"."device_status" NOT NULL DEFAULT 'ACTIVE', "firmware_version" character varying(16), "last_seen_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_devices_key_hash" UNIQUE ("key_hash"), CONSTRAINT "uq_devices_serial_number" UNIQUE ("serial_number"), CONSTRAINT "pk_devices" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_devices_owner_id" ON "devices" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "device_id" integer, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ended_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "chk_sessions_period" CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at"), CONSTRAINT "pk_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_device_id" ON "sessions" ("device_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_sessions_user_id" ON "sessions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."command_status" AS ENUM('CREATED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'DISPATCHED', 'EXECUTED', 'FAILED', 'CANCELLED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "commands" ("id" SERIAL NOT NULL, "session_id" integer NOT NULL, "action_id" integer NOT NULL, "idempotency_key" character varying(64) NOT NULL, "request_text" character varying(500), "status" "public"."command_status" NOT NULL DEFAULT 'CREATED', "result_code" character varying(32), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_commands_idempotency_key" UNIQUE ("idempotency_key"), CONSTRAINT "pk_commands" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_commands_status_created_at" ON "commands" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_commands_action_id" ON "commands" ("action_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_commands_session_id" ON "commands" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "command_parameters" ("command_id" integer NOT NULL, "parameter_id" integer NOT NULL, "value" character varying(255) NOT NULL, CONSTRAINT "pk_command_parameters" PRIMARY KEY ("command_id", "parameter_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."device_event_type" AS ENUM('BUTTON_SHORT', 'BUTTON_DOUBLE', 'BUTTON_LONG', 'TOUCH_TAP', 'TOUCH_HOLD', 'ENCODER_TURN', 'COMMAND_RESULT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "device_events" ("id" SERIAL NOT NULL, "device_id" integer NOT NULL, "event_uid" character varying(64) NOT NULL, "seq" integer NOT NULL, "type" "public"."device_event_type" NOT NULL, "value" integer, "command_id" integer, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_device_events_device_event_uid" UNIQUE ("device_id", "event_uid"), CONSTRAINT "chk_device_events_seq" CHECK ("seq" >= 0), CONSTRAINT "pk_device_events" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_device_events_device_seq" ON "device_events" ("device_id", "seq") `,
    );
    await queryRunner.query(
      `CREATE TABLE "action_roles" ("action_id" integer NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_95ce2373ef052ea0128b3d8e8f2" PRIMARY KEY ("action_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47ad813b67723ce8d64790603c" ON "action_roles" ("action_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_194261eb5855b514230cb64890" ON "action_roles" ("role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "fk_users_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_parameters" ADD CONSTRAINT "fk_action_parameters_action" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "fk_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "fk_devices_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "fk_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "fk_sessions_device" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" ADD CONSTRAINT "fk_commands_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" ADD CONSTRAINT "fk_commands_action" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "command_parameters" ADD CONSTRAINT "fk_command_parameters_command" FOREIGN KEY ("command_id") REFERENCES "commands"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "command_parameters" ADD CONSTRAINT "fk_command_parameters_parameter" FOREIGN KEY ("parameter_id") REFERENCES "action_parameters"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_events" ADD CONSTRAINT "fk_device_events_device" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_events" ADD CONSTRAINT "fk_device_events_command" FOREIGN KEY ("command_id") REFERENCES "commands"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_roles" ADD CONSTRAINT "fk_action_roles_action" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_roles" ADD CONSTRAINT "fk_action_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "action_roles" DROP CONSTRAINT "fk_action_roles_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_roles" DROP CONSTRAINT "fk_action_roles_action"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_events" DROP CONSTRAINT "fk_device_events_command"`,
    );
    await queryRunner.query(
      `ALTER TABLE "device_events" DROP CONSTRAINT "fk_device_events_device"`,
    );
    await queryRunner.query(
      `ALTER TABLE "command_parameters" DROP CONSTRAINT "fk_command_parameters_parameter"`,
    );
    await queryRunner.query(
      `ALTER TABLE "command_parameters" DROP CONSTRAINT "fk_command_parameters_command"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" DROP CONSTRAINT "fk_commands_action"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" DROP CONSTRAINT "fk_commands_session"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "fk_sessions_device"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "fk_sessions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "fk_devices_owner"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "fk_audit_logs_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "action_parameters" DROP CONSTRAINT "fk_action_parameters_action"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "fk_users_role"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_194261eb5855b514230cb64890"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47ad813b67723ce8d64790603c"`,
    );
    await queryRunner.query(`DROP TABLE "action_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_device_events_device_seq"`,
    );
    await queryRunner.query(`DROP TABLE "device_events"`);
    await queryRunner.query(`DROP TYPE "public"."device_event_type"`);
    await queryRunner.query(`DROP TABLE "command_parameters"`);
    await queryRunner.query(`DROP INDEX "public"."idx_commands_session_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_commands_action_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_commands_status_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "commands"`);
    await queryRunner.query(`DROP TYPE "public"."command_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_sessions_device_id"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_devices_owner_id"`);
    await queryRunner.query(`DROP TABLE "devices"`);
    await queryRunner.query(`DROP TYPE "public"."device_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_entity"`);
    await queryRunner.query(`DROP INDEX "public"."idx_audit_logs_created_at"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "action_parameters"`);
    await queryRunner.query(`DROP TYPE "public"."parameter_type"`);
    await queryRunner.query(`DROP TABLE "actions"`);
    await queryRunner.query(`DROP TYPE "public"."risk_level"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_role_id"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."locale"`);
  }
}
