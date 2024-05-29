/**
 * The request objec used to deal with user requests for files.
 */

import { Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface Database {
	requests: DownloadRequestRecord
	files: DownloadFileRecord
	contacts: ContactRecord
}

/**
 * The request database object used to deal with user requests for files.
 */
export interface DownloadRequestRecord {
	readonly id: Generated<number>
	readonly status: 'REQUESTED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'QUEUED'
	readonly type: 'HTTP' | 'SFTP' | 'GLOBUS'
	readonly dataset_id: string
	readonly project_id: string

	readonly creation_date: string
	readonly completion_date?: string
	readonly expiry_date?: string
	readonly failure_date?: string

	readonly requester?: string
	readonly notification_date?: string
	readonly should_delete: 0 | 1 // default 0 (false)
}

// make sure that the correct types are used in each operation.
export type DownloadRequest = Selectable<DownloadRequestRecord>
export type NewDownloadRequest = Insertable<DownloadRequestRecord>
export type DownloadRequestUpdate = Updateable<DownloadRequestRecord>

export type DownloadRequestStatus = DownloadRequest['status']
export type DownloadRequestType = DownloadRequest['type']
export type DownloadRequestID = DownloadRequest['id']

/**
 * A file database object contained in a request.
 */
interface DownloadFileRecord {
	readonly id: Generated<number>
	readonly dataset_id: string
	readonly source: string
	readonly destination: string
}

export type DownloadFile = Selectable<DownloadFileRecord>
export type NewDownloadFile = Insertable<DownloadFileRecord>
export type DownloadFileUpdate = Updateable<DownloadFileRecord>

export type DatasetID = DownloadRequest['dataset_id']

interface ContactRecord {
	readonly id: Generated<number>
	readonly project_id: string
	readonly depth: string | null
	readonly status: 'NEW' | 'MODIFIED'
	readonly type: 'SFTP' | 'GLOBUS'
}
export type Contact = Selectable<ContactRecord>