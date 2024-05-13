import { getUserProjects } from '../magic/magic_api'
import { TritonProject } from './api-types'

/**
 * Get the list of projects for the logged in user.
 *
 * First, we ask Magic for the list of Magic projects linked to the user, then
 * we ask Freezeman for the list of Freezeman projects that match the Magic projects
 * by external id.
 *
 * A list of TritonProject objects is returned.
 *
 * @param userId   Magic user id
 * @param userToken Magic user token
 * @returns TritonProject[]
 */
export async function listUserProjects(userId: string, userToken: string): Promise<TritonProject[]> {
	const magicProjects = await getUserProjects(userId, userToken)

	return magicProjects.projects.map((userProject) => {
		const tritonProject: TritonProject = {
			external_id: userProject.projectNumber,
			external_name: userProject.name,
		}
		return tritonProject
	})
}
