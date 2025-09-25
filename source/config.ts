import fs from "node:fs";
import process from "node:process";
import { getConfiguration, preventExtraction, Structure } from "gruber";

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
		url: config.url({
			variable: "SELF_URL",
			fallback: "http://localhost:3000",
		}),
		grace: config.number({ variable: "SERVER_GRACE", fallback: 10_000 }),
	}),

	database: config.object({
		url: config.url({
			variable: "DATABASE_URL",
			fallback: new URL("../data/", import.meta.url),
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
	if (fs.existsSync(".env")) process.loadEnvFile(".env");

	const value = await config.load(input, struct);

	// production checks
	if (value.env === "production") {
		if (value.database.url.hostname === "localhost") {
			throw new Error("database.url not configured");
		}
	}

	return preventExtraction(value);
}

// Output the current configuration
export function outputConfig() {
	console.log(config.getUsage(struct, appConfig));
}

export const appConfig = await loadConfig(
	new URL("../config.json", import.meta.url),
);
