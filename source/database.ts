import process from "node:process";
import postgres from "postgres";
import { appConfig } from "./config.ts";
import { getPostgresMigrator } from "gruber";

export const sql = postgres(appConfig.database.url.toString());

export interface ResponseRecord<T = any> {
	id: string;
	created_at: Date;
	token: string;
	data: T;
}

// Run database migrations up/down
export async function runMigrations() {
	const migrator = getPostgresMigrator({
		sql,
		directory: new URL("./migrations/", import.meta.url),
	});

	if (process.argv.includes("--down")) await migrator.down();
	else await migrator.up();

	await sql.end();
}
