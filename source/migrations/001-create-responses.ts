import { definePostgresMigration } from "gruber";

export default definePostgresMigration({
	async up(sql) {
		await sql`
			CREATE TABLE responses (
				"id" SERIAL PRIMARY KEY,
				"created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
				"token" VARCHAR(255) NOT NULL,
				"data" JSONB NOT NULL DEFAULT '{}'::JSONB
			)
		`;
	},
	async down(sql) {
		await sql`
			DROP TABLE responses
		`;
	},
});
