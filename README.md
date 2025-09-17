# sator

> Named for [Sator](https://purl.r0b.io/sator)

Sator is a tiny HTTP server for accepting authenticated HTML form data,
validating it using JSON Schema and saving it to a database.

It is designed to be ran as a container that is configured through environment variables and configuration files.

## Configuration

There are two files, `/app/config.json` and `/app/schema.json` that configure how the server works.

You can use the `/app/config.json` file or environment variables to set these values:

| name            | type     | flag | variable     | fallback                              |
| --------------- | -------- | ---- | ------------ | ------------------------------------- |
| database.url    | url      | ~    | DATABASE_URL | postgres://user:secret@localhost:5432 |
| env             | string   | ~    | NODE_ENV     | development                           |
| meta.name       | string   | ~    | APP_NAME     | sator                                 |
| meta.version    | string   | ~    | APP_VERSION  | 0.0.0                                 |
| server.grace    | number   | ~    | SERVER_GRACE | 10000                                 |
| server.hostname | string   | ~    | HOSTNAME     | 127.0.0.1                             |
| server.port     | number   | ~    | PORT         | 3000                                  |
| server.url      | string   | ~    | SELF_URL     | http://localhost:3000                 |
| cors.origins    | string[] | ~    | ~            | []                                    |

You also mount your `/app/schema.json` to tell Sator how to validate your HTTP requests.
It needs to contain a valid [JSON Schema](https://json-schema.org/understanding-json-schema/about)
which will applied to any inputs.

## Endpoints

```bash
# Check the service is running and get deployment information
curl http://sator.example.com/

# Check the service health
curl http://sator.example.com/healthz

# Submit a response
cat response.json | curl -H "Content-Type: application/json" -X POST --data-binary @- http://sator.example.com/responses

# Check authorization
curl -H "Authorization: bearer top_secret" http://sator.example.com/me
```

## Authorization

There are currently two authentication strategies, `public` and `allow_list`.

When you submit a response, Sator looks for an `Authorization: bearer {token}` header, or a `sator_token` cookie on the request.
The value from that is set as the token field in the database.

When set to `public` any token will be allowed to submit requests,

```json
{
  "authz": { "type": "public" }
}
```

When set to `allow_list` only the allowed tokens can be used to create responses.

```json
{
  "authz": {
    "type": "allow_list",
    "allowed_values": ["top_secret"]
  }
}
```
