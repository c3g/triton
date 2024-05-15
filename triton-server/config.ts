import path from 'path'
import 'dotenv/config'

const {
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
	ERROR_MONITORING_EMAIL = 'user@domain.com'
} = process.env

if (API_URL === undefined) {
	throw new Error('Must define API_URL environment variable')
}
if (LOGGER_LEVEL === undefined) {
	throw new Error('Must define LOGGER_LEVEL environment variable')
}
if (CLIENT_ORIGIN === undefined) {
	throw new Error('Must define CLIENT_ORIGIN environment variable')
}
if (CLIENT_PORTAL_ORIGIN === undefined) {
	throw new Error('Must define CLIENT_PORTAL_ORIGIN environment variable')
}
if (CLIENT_PORTAL_USERNAME === undefined) {
	throw new Error('Must define CLIENT_PORTAL_USERNAME environment variable')
}
if (CLIENT_PORTAL_PASSWORD === undefined) {
	throw new Error('Must define CLIENT_PORTAL_PASSWORD environment variable')
}
if (LIMS_API_URL === undefined) {
	throw new Error('Must define LIMS_API_URL environment variable')
}
if (LIMS_USERNAME === undefined) {
	throw new Error('Must define LIMS_USERNAME environment variable')
}
if (LIMS_PASSWORD === undefined) {
	throw new Error('Must define LIMS_PASSWORD environment variable')
}
if (ERROR_MONITORING_EMAIL === undefined) {
	throw new Error('Must define ERROR_MONITORING_EMAIL environment variable')
}


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

