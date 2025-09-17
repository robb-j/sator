import fs from "node:fs";
import { getConfiguration, Structure } from "gruber";

const config = getConfiguration();

const pkg = JSON.parse(
	fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const struct = config.object({
	env: config.string({ variable: "NODE_ENV", fallback: "development" }),

	meta: config.object({
		name: config.string({ variable: "APP_NAME", fallback: pkg.name }),
		version: config.string({ variable: "APP_VERSION", fallback: pkg.version }),
	}),

	server: config.object({
		hostname: config.string({ variable: "HOSTNAME", fallback: "127.0.0.1" }),
		port: config.number({ variable: "PORT", fallback: 3000 }),
		url: config.string({
			variable: "SELF_URL",
			fallback: "http://localhost:3000",
		}),
		grace: config.number({ variable: "SERVER_GRACE", fallback: 10_000 }),
	}),

	database: config.object({
		url: config.url({
			variable: "DATABASE_URL",
			fallback: "postgres://user:secret@localhost:5432",
		}),
	}),

	authz: Structure.union([
		Structure.object({
			type: Structure.literal("public"),
		}),
		Structure.object({
			type: Structure.literal("allow_list"),
			allowed_values: Structure.array(Structure.string()),
		}),
	]),

	cors: config.object({
		origins: config.array(Structure.string()),
	}),
});

// Load configuration from a file and check validity
export async function loadConfig(input: string | URL) {
	const value = await config.load(input, struct);

	// production checks
	if (value.env === "development") {
		if (value.database.url.hostname === "localhost") {
			throw new Error("database.url not configured");
		}
	}

	return value;
}

// Output the current configuration
export function outputConfig() {
	console.log(config.getUsage(struct, appConfig));
}

export const appConfig = await loadConfig(
	new URL("../config.json", import.meta.url),
);
