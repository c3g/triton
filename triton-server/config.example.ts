/*
 *
 * This is an example configuration. The application requires a similar file,
 * named 'config.ts' in the same folder as this one, in order to work.
 */

import path from 'path'

export default {
    url: 'http://localhost:3001',

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

    sftp: {
   	 server: '0.0.0.0',
   	 port: '21',
    },

    magic: {
   	 // Hercules login page url - the user logs in on this page.
   	 loginUrl: 'http://localhost:1234/login',
   	 // Api endpoint base url
   	 url: 'http://localhost:1234',
   	 // Credentials for the Triton server to call the Magic api
   	 user: '4832u4k;ljrdfs..',
   	 password: 'j4h23423lk14hj..',
    },

    freezeman: {
   	 url: 'http://127.0.0.1:8000/api',
   	 username: 'potato',
   	 password: 'potato',
    },

    client: {
   	 // Address of the triton client web application
   	 url: 'http://localhost:3000',
    },
}

