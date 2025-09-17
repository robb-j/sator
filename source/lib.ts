import fs from "node:fs";
import { getTerminator, Structure } from "gruber";
import { appConfig } from "./config.ts";

// TODO: migrate this hack back to Gruber
export function structureFrom(input: any) {
	if (!input || typeof input !== "object") throw new TypeError("bad schema");

	if (input.type === "object") {
		const fields: any = {};
		for (const key in input.properties) {
			fields[key] = structureFrom(input.properties[key]);
		}
		return Structure.object(fields);
	}
	if (input.oneOf) {
		return Structure.union(input.oneOf.map((v: any) => structureFrom(v)));
	}
	if (input.const) return Structure.literal(input.const);
	if (input.type === "string") return Structure.string(input.default);
	if (input.type === "number") return Structure.number(input.default);
	if (input.type === "boolean") return Structure.boolean(input.default);
	if (input.type === "null") return Structure.null();
	if (Object.keys(input).length === 0) return Structure.any();

	console.error(input);
	throw new TypeError("unknown schema");
}

// A structure to validate responses
export const ResponseStruct = structureFrom(
	JSON.parse(
		fs.readFileSync(new URL("../schema.json", import.meta.url), "utf8"),
	),
);

// Output the response schema for debugging
export function outputSchema() {
	console.log(JSON.stringify(ResponseStruct.getFullSchema(), null, 2));
}

// A Gruber Terminator to manage the shutdown process
export const arnie = getTerminator({
	timeout: appConfig.env === "development" ? 0 : 5_000,
});
