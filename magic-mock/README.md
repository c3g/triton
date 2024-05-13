# Magic Mock

Mock Hercules to allow Triton to run independently from the actual Hercules API.

## Getting Started

In order to use the magic mock server

1. Run `npm install`
1. Put this in your `config.ts` in `triton/triton-server/`:
    ```ts
        {
            ...,
            magic: {
                loginUrl: 'http://localhost:1234/login',
                url: 'http://localhost:1234',
                ...
            },
            ...
        }
    ```
1. Tweak the `data.ts` to your liking. This is a database mock of Hercules.
1. Run `npm start`
