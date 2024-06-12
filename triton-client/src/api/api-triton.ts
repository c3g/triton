import {
	ApiReply,
	ExternalProjectID,
	IsLoggedInData,
	TritonConstants,
	TritonCreateRequestBody,
	TritonCreateRequestResponse,
	TritonDataset,
	TritonDatasetFile,
	TritonProject,
	TritonReadset,
  TritonRequestResponse,
	TritonRun,
} from './api-types'
import { tritonGet, tritonPost, tritonDelete, TRITON_API_BASE_URL } from './api-fetch'

/**
 * Asks the Triton server if the user is logged in.
 *
 * If the user is logged in, the server returns the user details.
 *
 * If the user is not logged in, the server returns a 401 error and includes
 * a redirect link that the client can use to redirect to the hercules login page.
 * @returns IsLoggedInData
 */
export async function fetchLoginStatus(): Promise<IsLoggedInData> {
	try {
		// Note, we have to include credentials. This tells the browser to send any cookies we
		// have received from the triton server with the request. We have to
		// do this because the server cookie is from a different origin than the client's origin and
		// fetch won't include cross origin cookies by default. The cookie contains a session id
		// for the user, if a session has been created for them already.

		// We have to use fetch here (instead of tritonGet) to be able to handle the 401 response.
		const response = await fetch(TRITON_API_BASE_URL + 'user/is-logged-in', { credentials: 'include' })
		if (response.ok) {
			const reply = (await response.json()) as ApiReply<IsLoggedInData>
			if (reply.ok && reply.data) {
				return reply.data
			}
		} else {
			if (response.status === 401) {
				const login = await response.json()
				if (login.url) {
					window.location = login.url
				}
			}
		}
	} catch (err) {
		console.error('Unable to fetch login status', err)
	}

	return { isLoggedIn: false }
}

/**
 * Fetch the list of projects the user has access to.
 *
 * @returns TritonProject array
 */
export async function listProjects() {
	return await tritonGet<TritonProject[]>('list-projects')
}

/**
 * Fetch the datasets associated with one or more projects. Specify one or more
 * freezeman project ids.
 * @param externalProjectIds One or more external project id's
 * @returns TritonDataset[]
 */
export async function listDatasetsByIds(datasetIDs: Array<TritonDataset['id']>) {
	const idList = datasetIDs.join(',')
	return await tritonGet<TritonDataset[]>(`runs-datasets?ids=${idList}`)
}

export async function listRunsForProjects(externalProjectIds: ExternalProjectID[]){
	const idList = externalProjectIds.join(',')
	return await tritonGet<TritonRun[]>(`project-runs?external_project_ids=${idList}`)
}

export async function listReadsetsForDataset(datasetID: TritonDataset['id']) {
	return await tritonGet<TritonReadset[]>(`dataset-readsets?dataset_id=${datasetID}`)
}

export async function listDatasetFilesForReadset(readsetID: TritonReadset['id']) {
	return await tritonGet<TritonDatasetFile[]>(`/readset-datasetfiles/readset_id?=${readsetID}`)
}

export async function createDownloadRequest(body: TritonCreateRequestBody) {
	return await tritonPost<TritonCreateRequestResponse>(
		`download/create-request/`,
		{
			body: JSON.stringify(body),
			headers: { "Content-Type": "application/json", }
		}
	)
}

export async function getConstants() {
	return await tritonGet<TritonConstants>(`download/constants/`)
}

export async function deleteDownloadRequest(datasetID: TritonDataset['id']) {
  return await tritonDelete<TritonRequestResponse>(`download/delete-request?dataset_id=${datasetID}`)
}

export default {
	fetchLoginStatus,
	listProjects,
	listRunsForProjects,
	listDatasetsByIds,
	listReadsetsForDataset,
	listDatasetFilesForReadset,
	createDownloadRequest,
	getConstants,
  deleteDownloadRequest,
}
