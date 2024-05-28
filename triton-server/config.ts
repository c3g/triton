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
	ERROR_MONITORING_EMAIL: ''
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

const {
	API_URL,
	LOGGER_LEVEL,
	CLIENT_ORIGIN,
	CLIENT_PORTAL_LOGIN,
	CLIENT_PORTAL_API_URL,
	CLIENT_PORTAL_USERNAME,
	CLIENT_PORTAL_PASSWORD,
	LIMS_API_URL,
	LIMS_USERNAME,
	LIMS_PASSWORD,
	SFTP_SERVER,
	SFTP_PORT,
	ERROR_MONITORING_EMAIL,
} = TRITON_ENVIRONMENTS

export default {
	url: API_URL,

	logger: {
		level: LOGGER_LEVEL,
	},

	paths: {
		data: path.join(__dirname, 'data'),
		database: path.join(__dirname, 'data', 'app.db'),
		downloadDB: path.join(__dirname, 'data', 'downloads.db'),

		workCompleteFile: path.join(__dirname, 'data', 'work-complete.json'),
	},

	mail: {
		errorMonitoring: ERROR_MONITORING_EMAIL,
	},

	sftp: {
		server: SFTP_SERVER,
		port: SFTP_PORT,
	},

	client_portal: {
		// Hercules login page url - the user logs in on this page.
		loginUrl: CLIENT_PORTAL_LOGIN,
		// Api endpoint base url
		url: CLIENT_PORTAL_API_URL,
		// Credentials for the Triton server to call the Magic api
		user: CLIENT_PORTAL_USERNAME,
		password: CLIENT_PORTAL_PASSWORD,
	},

	lims: {
		url: LIMS_API_URL,
		username: LIMS_USERNAME,
		password: LIMS_PASSWORD,
	},

	client: {
		// Address of the triton client web application
		url: CLIENT_ORIGIN,
	},
}

