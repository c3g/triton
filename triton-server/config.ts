import path from 'path'
import 'dotenv/config'

export const {
	API_URL = 'http://localhost:3001',
	LOGGER_LEVEL = 'info',
	CLIENT_ORIGIN = 'http://localhost:3000',
	CLIENT_PORTAL_ORIGIN = 'http://localhost:1234',
	CLIENT_PORTAL_USERNAME = '',
	CLIENT_PORTAL_PASSWORD = '',
	LIMS_API_URL = 'http://127.0.0.1:8000/api',
	LIMS_USERNAME = '',
	LIMS_PASSWORD = '',
	SFTP_SERVER = '0.0.0.0',
	SFTP_PORT = '21',
	SFTP_DATA_PREFIX = '/data/glsftp/',
	ERROR_MONITORING_EMAIL = 'user@domain.com'
} = process.env

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

		dataPrefix: SFTP_DATA_PREFIX,
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
		loginUrl: `${CLIENT_PORTAL_ORIGIN}/login`,
		// Api endpoint base url
		url: CLIENT_PORTAL_ORIGIN,
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

