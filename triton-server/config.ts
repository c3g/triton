import path from 'path'
import 'dotenv/config'

const TRITON_ENVIRONMENTS = {
	API_URL: '',
	LOGGER_LEVEL: 'info',
	CLIENT_ORIGIN: '',
	CLIENT_PORTAL_LOGIN: '',
	CLIENT_PORTAL_API_URL: '',
	CLIENT_PORTAL_USERNAME: '',
	CLIENT_PORTAL_PASSWORD: '',
	LIMS_API_URL: '',
	LIMS_USERNAME: '',
	LIMS_PASSWORD: '',
	SFTP_SERVER: '',
	SFTP_PORT: '',
	ERROR_MONITORING_EMAIL: '',
	TRITON_HTTPS_PROXY: '',
	DATABASE_PATH: '',
}

const missingEnvVars: string[] = []
for (const key of Object.keys(TRITON_ENVIRONMENTS) as Array<keyof typeof TRITON_ENVIRONMENTS>) {
	const value = process.env[key]
	if (value === undefined) {
		if (!TRITON_ENVIRONMENTS[key]) {
			missingEnvVars.push(key)
		}
	} else {
		TRITON_ENVIRONMENTS[key] = value
	}
}
if (missingEnvVars.length > 0) {
	throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`)
}

export default {
	url: TRITON_ENVIRONMENTS.API_URL,

	logger: {
		level: TRITON_ENVIRONMENTS.LOGGER_LEVEL,
	},

	paths: {
		downloadDB: TRITON_ENVIRONMENTS.DATABASE_PATH,
	},

	mail: {
		errorMonitoring: TRITON_ENVIRONMENTS.ERROR_MONITORING_EMAIL,
	},

	sftp: {
		server: TRITON_ENVIRONMENTS.SFTP_SERVER,
		port: TRITON_ENVIRONMENTS.SFTP_PORT,
	},

	client_portal: {
		httpsProxy: TRITON_ENVIRONMENTS.TRITON_HTTPS_PROXY,
		// Hercules login page url - the user logs in on this page.
		loginUrl: TRITON_ENVIRONMENTS.CLIENT_PORTAL_LOGIN,
		// Api endpoint base url
		url: TRITON_ENVIRONMENTS.CLIENT_PORTAL_API_URL,
		// Credentials for the Triton server to call the Magic api
		user: TRITON_ENVIRONMENTS.CLIENT_PORTAL_USERNAME,
		password: TRITON_ENVIRONMENTS.CLIENT_PORTAL_PASSWORD,
	},

	lims: {
		url: TRITON_ENVIRONMENTS.LIMS_API_URL,
		username: TRITON_ENVIRONMENTS.LIMS_USERNAME,
		password: TRITON_ENVIRONMENTS.LIMS_PASSWORD,
	},

	client: {
		// Address of the triton client web application
		url: TRITON_ENVIRONMENTS.CLIENT_ORIGIN,
	},

	request_service: {
		tick_frequency: 30000 /* miliseconds */,
	},
}
