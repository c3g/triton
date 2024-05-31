// Models used by the client API.

import { DownloadFile, DownloadRequest, DownloadRequestType } from './downloads'
import { Dataset, DatasetFile, Readset } from './freezeman'
import * as Magic from './magic'

/**
 * The standard reply sent for all api requests.
 *
 * If the `ok` flag it true then the request succeeded and the `data` field
 * contains the requested data.
 *
 * If the `ok` flag is false then `message` contains an error message and
 * `stack` contains a stack trace, if available.
 */
export interface ApiReply<T> {
	readonly ok: boolean
	readonly data?: T
	readonly message?: string
	readonly stack?: readonly string[]
}

/**
 * User details
 */
export interface User extends Magic.UserDetails {}

/**
 * Data returned by is-logged-in api endpoint.
 * The user details are only included if the user is logged in.
 */
export interface IsLoggedInData {
	readonly isLoggedIn: boolean
	readonly user?: User
}

/**
 * Project definition for use in the Triton client.
 *
 * Triton is an extension of Hercules, and should display Hercules project
 * names and use Hercules project ID's.
 *
 * The freezeman project ID and name is optional, as not all datasets are associated
 * with a freezeman project. Runs launched from Clarity are not associated with
 * a freezeman project, just the Hercules project.
 *
 * All datasets are associated with Hercules projects.
 */
export type FMSProjectID = number
export type ExternalProjectID = string
export interface TritonProject {
	readonly fms_id?: FMSProjectID // freezeman project id (if there is an associated fms project)
	readonly fms_name?: string // freezeman project name

	readonly external_id: ExternalProjectID // Magic project id
	readonly external_name: string // Magic project name
}

export interface TritonDataset extends Omit<Dataset, 'files'> {
	requests: DownloadRequest[]
}

export interface TritonRun {
	external_project_id: ExternalProjectID // Project this run belongs to
	name: string // Run name (from datasets)
	runDate: Date // Date run was performed (TODO since we don't have that yet)
	datasets: number[] // The list of dataset ID's associated with this run

	// In the future it would be nice to have some statistics
	readsetCount: number // The total number of readsets in the run
	availableReadsetsCount: number // The number of readsets which are staged for download
}


export interface TritonReadset extends Readset {}

export interface TritonDatasetFile {
	datasetFile: DatasetFile
	downloadFile: DownloadFile
}

export interface TritonCreateRequestBody {
	projectID: ExternalProjectID,
	datasetID: number,
	type: DownloadRequestType
}
export interface TritonCreateRequestResponse {
	files: DownloadFile[];
	request: DownloadRequest
}