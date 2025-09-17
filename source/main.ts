import "gruber/polyfill.js";

import process from "node:process";
import { outputConfig } from "./config.ts";
import { runServer } from "./server.ts";
import { outputSchema } from "./lib.ts";
import { runMigrations } from "./database.ts";

// This is the app entrypoint, its a very basic CLI
function main() {
	const [cmd] = process.argv.slice(2);

	if (cmd === "config") return outputConfig();
	if (cmd === "schema") return outputSchema();
	if (cmd === "serve") return runServer();
	if (cmd === "migrate") return runMigrations();

	console.error("Unknown command:", cmd);
	process.exit(1);
}

main();
