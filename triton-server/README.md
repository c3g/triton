# Getting Started

## Configuration

A `config.example.ts` is provided to serve as an example config.

## Magic/Hercules Mock

You can use a the `magic-mock` server under the `magic-mock` folder at the root directory to work with a mock server of Hercules instead of an actual Hercules server.

The `magic-mock` by default uses `http://localhost:1234` as its base url. Therefore, you have to set `magic.url` to `http://localhost:1234` and `client_portal.loginUrl` to `http://localhost:1234/login` in order to use the mock.

## Run the server

```sh
npm start
```

Runs the server in the development mode.
It uses nodeman, so it reloads automatically after changes.
