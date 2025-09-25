import {
	_getRequestBearer,
	_getRequestCookie,
	assertRequestBody,
	defineRoute,
	FetchRouter,
	HTTPError,
	serveHTTP,
} from "gruber";

import { appConfig } from "./config.ts";
import { database } from "./database.ts";
import { arnie, cors, ResponseStruct } from "./lib.ts";

export const indexRoute = defineRoute({
	method: "GET",
	pathname: "/",
	handler() {
		return Response.json({
			message: "OK",
			meta: {
				name: appConfig.meta.name,
				version: appConfig.meta.version,
			},
		});
	},
});

export const healthzRoute = defineRoute({
	method: "GET",
	pathname: "/healthz",
	handler() {
		return arnie.getResponse();
	},
});

async function assertAuthorization(request: Request) {
	const value =
		_getRequestBearer(request) ??
		_getRequestCookie(request, "sator_token") ??
		"anonymous";

	if (appConfig.authz.type === "public") return value;

	if (
		appConfig.authz.type === "allow_list" &&
		!appConfig.authz.allowed_values.includes(value)
	) {
		throw HTTPError.unauthorized();
	}

	return value;
}

export const submitRoute = defineRoute({
	method: "POST",
	pathname: "/responses",
	async handler({ request }) {
		const token = await assertAuthorization(request);
		const data = await assertRequestBody(ResponseStruct, request);

		const record = await database.write(token, data);

		return Response.json(record, { status: 201 });
	},
});

export const authRoute = defineRoute({
	method: "GET",
	pathname: "/me",
	async handler({ request }) {
		return Response.json({
			token: await assertAuthorization(request),
		});
	},
});

export async function runServer() {
	const router = new FetchRouter({
		cors,
		log: true,
		routes: [indexRoute, healthzRoute, submitRoute, authRoute],
	});

	const server = await serveHTTP(appConfig.server, (req) =>
		router.getResponse(req),
	);

	arnie.start(async () => {
		await server.stop();
		await database.close();
	});
}
