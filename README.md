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

## Schema

You also mount your `/app/schema.json` to tell Sator how to validate your HTTP requests.
It needs to contain a valid [JSON Schema](https://json-schema.org/understanding-json-schema/about)
which will applied to any inputs.

A simple schema might look like this. Responses are objects that have a string "name" field and a numeric "age" field

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  }
}
```

So your responses might look like this:

> Sator accepts JSON or HTML Form data

```json
{ "name": "The Protagonist", "age": 42 }
```

You can do more complicated things with unions.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "type": { "const": "person" },
        "name": { "type": "string" },
        "age": { "type": "number" }
      }
    },
    {
      "type": "object",
      "properties": {
        "type": { "const": "pet" },
        "name": { "type": "string" },
        "kind": { "enum": ["cat", "dog", "rabbit"] }
      }
    }
  ]
}
```

where responses could be:

```json
{ "type": "person", "name": "The Protagonist", "age": 42 }
```

or:

```json
{ "type": "pet", "name": "Hugo", "kind": "dog" }
```

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

## Database

Sator is designed to work with a Postgres database or write to the local file system.

Use a `file:` protocol URL to tell Sator the directory you want the file(s) to be written to.
By default, it will create a `data.ndjson` file in that directory and append all responses into it.

You can also add `?group=token` onto the URL to group the responses by the authorization token that created them.

```json
{
  "database": { "url": "file:///home/protagonist/data/" }
}
```

Alternatively, you can save files to Postgres by configuring a `postgres:` URL.
You will also need to run the database migrations using the [CLI](#cli)

```json
{
  "database": { "url": "postgres:user:secret@localhost/database" }
}
```
