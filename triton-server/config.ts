/*
 *
 * This is an example configuration. The application requires a similar file,
 * named 'config.ts' in the same folder as this one, in order to work.
 */

import path from 'path'
import 'dotenv/config'

export const {
	LOGGER_LEVEL = 'info',
	CLIENT_ORIGIN = 'http://localhost:3000',
	CLIENT_PORTAL_ORIGIN = 'http://localhost:1234',
	CLIENT_PORTAL_USERNAME = 'wxGFi8MjHlakuaQ-ls99Rw..',
	CLIENT_PORTAL_PASSWORD = 'eW4yvfLHi5nlRNn8EJlsPg..',
	LIMS_API_URL = 'http://127.0.0.1:8000/api',
	LIMS_USERNAME = 'potato',
	LIMS_PASSWORD = 'potato',
} = process.env

export default {
	url: 'http://localhost:3001',

	logger: {
		level: LOGGER_LEVEL,
	},

	paths: {
		data: path.join(__dirname, 'data'),
		database: path.join(__dirname, 'data', 'app.db'),
		downloadDB: path.join(__dirname, 'data', 'downloads.db'),

		workCompleteFile: path.join(__dirname, 'data', 'work-complete.json'),

		dataPrefix: '/data/glsftp/',
	},

	clarity: {
		baseURL: 'https://bravotestapp.genome.mcgill.ca',
		url: 'https://bravotestapp.genome.mcgill.ca/api/v2',
		database: {
			host: '127.0.0.1',
			user: 'rgregoir',
			password: 'secret',
			database: 'ClarityLIMS',
		},
	},

	mail: {
		from: 'no-reply@domain.com',
		errorMonitoring: 'user@domain.com',
	},

	nodemailer: {
		service: 'gmail',
		auth: {
			user: 'email@gmail.com',
			pass: 'secret',
		},
	},

	sftp: {
		server: '0.0.0.0',
		port: '21',
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

