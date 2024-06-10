/**
 * CONFIG
 *
 * This config file holds configuration fields that depend on the current runtime environment
 * (dev, qc, prod).
 *
 * The environment is indicated by the process.env.NODE_ENV variable, which is one of 'development' or
 * 'production'. This flag is built into the app by create-react-app when the app is built.
 * See: https://create-react-app.dev/docs/adding-custom-environment-variables
 *
 * We will have to add another flag for QC at some point, but for now only dev and prod are
 * supported. This may require us to define a custom REACT_APP_xxx environment variable instead
 * of using NODE_ENV.
 */

export interface ClientConfig {
	// The base endpoint for the triton api, eg 'https://biobank.genome.mcgill.ca/triton/api/' (<< not the real url!)
	apiBaseUrl: URL
}

// Get the config that matches the environment
function getConfig(): ClientConfig {
	switch (
	process.env.NODE_ENV // NODE_ENV is added to the app at build time by create-react-app
	) {
		case 'development':
			return {
				apiBaseUrl: new URL('http://localhost:3001/api/'),
			}
		default:
			return {
				apiBaseUrl: new URL(`${process.env.REACT_APP_SERVER_ORIGIN}api/`),
			}
	}
}

// Export the config that matches the current build environment.
const CONFIG = getConfig()
console.info(`CONFIG: ${JSON.stringify(CONFIG)}`)
export default CONFIG
