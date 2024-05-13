// TODO Determine which fields can be optional

/**
 * Standard reply format from magic api's. All api replies return this structure.
 */
export interface MagicReply<T> {
	readonly ok: boolean // True if the request succeeded
	readonly message?: string // An error message if the request failed
	readonly data?: T // The data returned
}

/**
 * The version returned by the /version endpoint
 */
export interface ApiVersion {
	readonly version: string
}

/**
 * User details returned by /userDetails endpoint
 */
export interface UserDetails {
	readonly firstName: string
	readonly lastName: string
	readonly email: string
	readonly accountType: 'External' | 'Internal'
}

/**
 * Project user definition (see ProjectUsers)
 */
export interface ProjectUser {
	readonly firstName: string
	readonly lastName: string
	readonly email: string
	readonly roleTitle: string
	readonly jobTitle: string
}

/**
 * Project user list returned by /projectUsers endpoing
 */
export interface ProjectUsers {
	readonly projectId: string
	readonly name: string
	readonly users: readonly ProjectUser[]
}

/**
 * Internal user definition return by /internalUsers
 */
export interface InternalUser {
	readonly firstName: string
	readonly lastName: string
	readonly email: string
}

/**
 * The response type for the /internalUsers endpoint
 */
export interface InternalUsers {
	readonly users: readonly InternalUser[]
}

/**
 * The project definition for the /userProjects endpoint
 */
export interface UserProject {
	readonly projectNumber: string // This is the P000000 formatted project ID
	readonly name: string
	readonly researchArea: string
	readonly organization: string
	readonly demographic: string
	readonly sector: string
}

/**
 * The response for the /userProjects endpoint.
 * Note that the response includes the fields from UserDetails, followed by the projects.
 */
export interface UserProjects extends UserDetails {
	readonly projects: readonly UserProject[]
}
