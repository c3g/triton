import { getProjectUsers, getUserDetails, getUserProjects, isUserAuthenticated } from './magic_api'

/**
 * A few quick tests for testing the magic api.
 * Note that these are live tests, not unit tests.
 */

// To run this test you need to log in to Hercules UAT, then grab your user name
// and token from the link in the Data Portal button and paste them here.
const USER_ID = '<your triton user name>'
const USER_TOKEN = '<your auth token>'

async function doTest(): Promise<void> {
	const isAuthenticated = await isUserAuthenticated(USER_ID, USER_TOKEN)
	console.log(isAuthenticated ? 'authenticated' : 'not authenticated')

	const userDetails = await getUserDetails(USER_ID, USER_TOKEN)
	console.log(userDetails)

	const userProjects = await getUserProjects(USER_ID, USER_TOKEN)
	console.log(userProjects)

	if (userProjects.projects.length > 0) {
		const project = userProjects.projects[0]
		const projectUsers = await getProjectUsers(USER_ID, USER_TOKEN, project.projectNumber)
		console.log(JSON.stringify(projectUsers))
	} else {
		console.log('No projects, so no project users')
	}
}

doTest()
	.then(() => console.log('DONE'))
	.catch((err) => console.error(err))
