# Triton Types Library

This library contains type definitions for the types used in the Triton API, shared between the server and the client. It ensures that types remain in sync between projects and avoids copy/pasting type definitions between projects.

**Note:** _The triton-types library needs to be built before it can be used by the client or server projects, using `npm run build`._

## Models

Types defined in the `api.ts` file are meant to be shared between the client and server and are exported by default by the project.

Types defined in `magic.ts` are meant to be used only in the server. These represent the data structures returned by the magic api.

The `index.ts` file controls which types are exported by default, and it exports the api types.

### Mapped Types

If a magic type is needed as part of an api response then we must map the magic type to an api type by extending the magic interface. This is to protect ourselves from future changes to the Magic api types, and allows us to customize magic types, if necessary, before returning them to the client.

Example:

The magic `UserDetails` is mapped to the `User` type returned by the api.

`export interface User extends Magic.UserDetails {}`

The api returns `User` type objects to the client.

# Importing the types

To use a type in the client or server project you simply import it from the triton-types project. The triton-types project exports all of the API types by default.

Example

`import { ApiReply } from '../../triton-types'`

To import a 'private' type, such as a magic type, you need to specify the path to the magic types.

Example

`import { UserDetails } from '../../triton-types/models/magic'`

To avoid having to type long import paths to the external project, the client and server projects each contain a `api-types.ts` file that imports the types from the `triton-types` project and re-exports them, hiding the fact that the types are coming from a separate project. We can simply import the types in our source code as if the types were defined in the client or server project.

Example:

`import { User } from '../api-types'`

## triton-types project setup

The triton-types project is configured as a 'types only' project - it only generates type definitions from its source files, and does not output any javascript. This is configured in the `tsconfig.json` file:

```
	"rootDir": "src",
	"declaration": true,
	"emitDeclarationOnly": true,
	"declarationDir": "./models",
```

This configuration results in type definitions being generated from the source files in 'src' and being output to the 'models' folder when the project is built.

The triton-types project is declared as a 'composite' project, which allows it to be referenced from the client and server projects.

`"composite": true`

A reference to the `triton-types` project was added to the `tsconfig.json` files in the client and server projects. This allows us to import and use the types into the client and server projects.

```
    "references": [
		{
			"path": "../triton-types"
		}
	]
```

TS keeps track of the build state of referenced 'composite' projects by generating a `tsconfig.tsbuildinfo` file. TS uses this file for incremental builds. To force a fresh rebuild of the types project you can delete the file and run build.

`tsconfig.tsbuildinfo` should not be added to git.
