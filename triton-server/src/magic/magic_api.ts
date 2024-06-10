import { AxiosInstance, AxiosRequestConfig } from 'axios'
import { MagicReply, ProjectUsers, UserDetails, UserProjects } from './magic-types'
import getAuthorizedAxios from './magic_axios'

/**
 * A utility function that checks the "ok" status of a reply, where the "ok" value
 * can be either a boolean or "true" | "false".
 * @param reply
 * @returns
 */
function isReplyOkay(reply: MagicReply<any>) {
	// There is (or at least was) some confusion about the 'ok' property of a magic reply.
	// It is supposed to be a boolean, but the api is returning a string set to "true" or "false"
	// TODO Check if this is still the case, and get rid of this function if it is no longer needed.
	return reply.ok && reply.data !== undefined
}

/**
 * A utility function for adding userID and userToken params to get requests.
 * @param userID
 * @param userToken
 * @returns
 */
function userParams(userID: string, userToken: string) {
	return {
		params: {
			userID,
			userToken,
		},
	}
}

/**
 * Verify that the user with the given id and token is still logged in to magic.
 * @param axios
 * @param userID
 * @param userToken
 * @returns
 */
async function checkUserAuthenticated(axios: AxiosInstance, userID: string, userToken: string): Promise<boolean> {
	const response = await axios.get<MagicReply<boolean>>('/userAuthenticated/', userParams(userID, userToken))
	const reply = response.data

	if (isReplyOkay(reply)) {
		return reply.data ?? false // TODO test api and make sure this is a boolean value
	} else {
		throw new Error(`API ERROR: ${reply.message ?? 'no error message'}`)
	}
}

/**
 * Make an api request to magic, using an authorized axios instance.
 *
 * Note: This function assumes that the user is still logged in to magic, counting
 * on the server middleware to verify the user's login status before any api calls
 * get made to Magic.
 * @param userID
 * @param userToken
 * @param axiosConfig
 * @returns
 */
async function getMagic<T>(axiosConfig: AxiosRequestConfig) {
	const axiosInstance = await getAuthorizedAxios()
	const response = await axiosInstance.request<MagicReply<T>>(axiosConfig)
	const magicReply = response.data
	if (magicReply.ok) {
		if (magicReply.data !== undefined) {
			return magicReply.data
		} else {
			throw new Error('API: magic reply was okay but data was not in the reply')
		}
	} else {
		throw new Error(
			`API: api request ${axiosConfig.baseURL ?? ''}${axiosConfig.url ?? ''} failed: ${response.data.message ?? 'no error message'}`
		)
	}
}

/**
 * Get the Magic projects the user is allowed to access.
 * @param userID
 * @param userToken
 * @returns
 */
export const getUserProjects = async (userID: string, userToken: string) => {
	return await getMagic<UserProjects>({
		method: 'get',
		url: '/userProjects/',
		params: {
			userID,
		},
	})
}

/**
 * Get user details (name, email, etc.)
 * @param userID
 * @param userToken
 * @returns
 */
export const getUserDetails = async (userID: string, userToken: string) => {
	return await getMagic<UserDetails>({
		method: 'get',
		url: '/userDetails/',
		params: {
			userID,
		},
	})
}

/**
 * Get the list of users who have access to a specific project.
 * @param userID
 * @param userToken
 * @param projectId
 * @returns
 */
export const getProjectUsers = async (projectId: string) => {
	return await getMagic<ProjectUsers>({
		method: 'get',
		url: '/projectUsers/',
		params: {
			projectId,
		},
	})
}

/**
 * Verify that the specified user is still logged in to Magic.
 *
 * This is used by the server to check the user's session info.
 * @param userID
 * @param userToken
 * @returns
 */
export const isUserAuthenticated = async (userID: string, userToken: string) => {
	const axiosInstance = await getAuthorizedAxios()
	const isAuthenticated = await checkUserAuthenticated(axiosInstance, userID, userToken)
	return isAuthenticated
}
