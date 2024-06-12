/**
 * The request objec used to deal with user requests for files.
 */

import { Generated, Insertable, Selectable, Updateable, ColumnType } from 'kysely'

export interface Database {
	requests: DownloadRequestRecord
	files: DownloadFileRecord
	contacts: ContactRecord
	constants: ConstantsRecord
}

/**
 * The request database object used to deal with user requests for files.
 */
export interface DownloadRequestRecord {
	readonly id: Generated<number>
	readonly status: 'REQUESTED' | 'PENDING' | 'QUEUED' | 'FAILED' | 'SUCCESS'
	readonly type: 'SFTP' | 'GLOBUS'
	readonly dataset_id: string
	readonly project_id: string

	readonly creation_date: ColumnType<string, string, never>
	readonly completion_date?: ColumnType<string, never, string>
	readonly expiry_date?: ColumnType<string, string, never>
	readonly failure_date?: ColumnType<string, string, string>

	readonly requester?: string
	readonly notification_date?: string
	readonly should_delete: 0 | 1 // default 0 (false)
}

// make sure that the correct types are used in each operation.
export type DownloadRequest = Selectable<DownloadRequestRecord>
export type NewDownloadRequest = Insertable<DownloadRequestRecord>
export type UpdateDownloadRequest = Updateable<DownloadRequestRecord>

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
export type UpdateDownloadFile = Updateable<DownloadFileRecord>

export type DownloadDatasetID = DownloadRequest['dataset_id']

interface ContactRecord {
	readonly id: Generated<number>
	readonly project_id: string
	readonly depth: string | null
	readonly status: 'NEW' | 'MODIFIED'
	readonly type: 'SFTP' | 'GLOBUS'
}
export type Contact = Selectable<ContactRecord>

interface ConstantsRecord {
	readonly id: 1
	readonly globus_project_size: number
	readonly sftp_project_size: number
}
export type Constants = Selectable<ConstantsRecord>
