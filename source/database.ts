import fs from "node:fs";
import process from "node:process";
import postgres from "postgres";
import { appConfig } from "./config.ts";
import { getPostgresMigrator } from "gruber";

export interface ResponseRecord<T = any> {
	id: string | number;
	created_at: Date;
	token: string;
	data: T;
}

// Run database migrations up/down
export async function runMigrations() {
	const sql = postgres(appConfig.database.url.toString());

	const migrator = getPostgresMigrator({
		sql,
		directory: new URL("./migrations/", import.meta.url),
	});

	if (process.argv.includes("--down")) await migrator.down();
	else await migrator.up();

	await sql.end();
}

export interface Storage {
	write(token: string, data: any): Promise<ResponseRecord>;
	close(): Promise<void>;
}

class LocalResponses implements Storage {
	url: URL;
	constructor(url: URL) {
		this.url = url;
	}

	async write(token: string, data: any): Promise<ResponseRecord> {
		await fs.promises.mkdir(this.url, { recursive: true });

		const record: ResponseRecord = {
			id: crypto.randomUUID(),
			created_at: new Date(),
			token,
			data,
		};

		const grouped = this.url.searchParams.get("group") === "token";
		const url = new URL(`./${grouped ? token : "data"}.ndjson`, this.url);

		fs.appendFileSync(url, JSON.stringify(record));

		return record;
	}
	async close(): Promise<void> {}
}

class PostgresResponses implements Storage {
	sql: postgres.Sql;
	constructor(url: URL) {
		this.sql = postgres(url.toString());
	}

	async write(token: string, data: any): Promise<ResponseRecord> {
		const [record] = await this.sql<ResponseRecord[]>`
			INSERT INTO responses ${this.sql({ token, data })}
			RETURNING id, created_at, token, data
		`;
		return record;
	}
	async close(): Promise<void> {
		await this.sql.end();
	}
}

export const database =
	appConfig.database.url.protocol === "file:"
		? new LocalResponses(appConfig.database.url)
		: new PostgresResponses(appConfig.database.url);
