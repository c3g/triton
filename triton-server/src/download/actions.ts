/*
 * download.js
 *
 * This file includes everything related to the downloads database.
 */

// import util from 'util'
import path from 'path'
import config from '../../config'
import { Kysely, Transaction } from 'kysely'
import { Database, NewDownloadFile, DownloadRequestType, NewDownloadRequest, DownloadRequestID, DatasetID, Contact, REQUEST_STATUS } from './download-types'
import { createSQLite } from './sqlite-database'

export type DatabaseActions = Awaited<ReturnType<typeof createActions>>
export async function createActions(db: Kysely<Database>) {
	async function listRequestsByDatasetId(datasetId: DatasetID) {
		return await db.selectFrom('requests').where('dataset_id', '=', datasetId).selectAll().execute()
	}

	async function listRequests() {
		return await db.selectFrom('requests').selectAll().execute()
	}

	async function getRequest(datasetId: DatasetID, type: DownloadRequestType) {
		return await db
			.selectFrom('requests')
			.where('dataset_id', '=', datasetId)
			.where('type', '=', type)
			.selectAll()
			.executeTakeFirstOrThrow()
	}

	async function getRequestByID(id: DownloadRequestID) {
		return await db.selectFrom('requests').where('id', '=', id).selectAll().executeTakeFirstOrThrow()
	}

	async function createRequest(
		request: Pick<NewDownloadRequest, 'dataset_id' | 'project_id' | 'type' | 'requester'>,
		files: NewDownloadFile[]
	) {
		return await db.transaction().execute(async (trx) => {
			const values: NewDownloadRequest = {
				...request,
				status: 'REQUESTED',
				creation_date: currentDateToString(),
				should_delete: 0,
			}
			const newRequest = await trx
				.insertInto('requests')
				.values(values)
				.returningAll()
				.executeTakeFirstOrThrow()
			const insertedFiles = await insertFiles(files, trx)
			return {
				files: insertedFiles,
				request: newRequest,
			}
		})
	}

	async function deleteRequest(datasetID: DatasetID, type: DownloadRequestType) {
		return await db.updateTable('requests').set({ should_delete: 1 }).where('dataset_id', '=', datasetID).where('type', '=', type).returningAll().executeTakeFirstOrThrow()
	}

  async function deleteCancelledRequest() {
		return await db.updateTable('requests').set({ should_delete: 1 }).where('status', '=', REQUEST_STATUS.SUCCESS).where('is_cancelled', '=', 1).returningAll().execute()
	}

	async function insertFiles(files: NewDownloadFile[], trx?: Transaction<Database>) {
		if (files.length === 0) {
			throw new Error('Cannot insert 0 files')
		}
		return await (trx ?? db)
			.insertInto('files')
			.values(files)
			.onConflict((oc) =>
				oc.columns(['dataset_id', 'source']).doUpdateSet({
					destination: (eb) => eb.ref('excluded.destination'),
				})
			)
			.returningAll()
			.execute()
	}

	async function listFilesByDatasetId(datasetId: DatasetID) {
		return await db.selectFrom('files').where('dataset_id', '=', datasetId).selectAll().execute()
	}

	async function listReadyContacts(): Promise<Contact[]> {
		return await db.selectFrom('contacts').where('depth', 'is not', null).selectAll().execute()
	}
	
	async function removeContact(projectID: Contact['project_id'], type: Contact['type']): Promise<unknown> {
		return await db.deleteFrom('contacts').where('project_id', '=', projectID).where('type', '=', type).executeTakeFirstOrThrow()
	}

	async function updateNotificationDate(requestID: DownloadRequestID) {
		return await db
			.updateTable('requests')
			.set({ notification_date: currentDateToString() })
			.where('id', '=', requestID)
			.returningAll()
			.executeTakeFirstOrThrow()
	
	}

	return {
		listRequestsByDatasetId,
		listRequests,
		getRequest,
		getRequestByID,
		createRequest,
		deleteRequest,
    deleteCancelledRequest,
		insertFiles,
		listFilesByDatasetId,
		listReadyContacts,
		removeContact,
		updateNotificationDate,
	}
}

let actions: DatabaseActions | null = null
export async function defaultDatabaseActions(): Promise<DatabaseActions> {
	if (!actions) {
		const db = await createSQLite(config.paths.downloadDB /*, path.join(__dirname, './schema.sql') should already exist */)
		actions = await createActions(db)
	}

	return actions
}

/*
 * Current downloads
 *
 * Used to warn users before deleting files that are being downloaded by
 * someone else.
 */

/**
 * @type {Object.<string, number>}
 * number of files being currently downloaded for each datasetID.
 */
interface DatasetDownloads {
	[key: string]: number
}

const datasetsDownloads: DatasetDownloads = {}

export function isDatasetDownloading(datasetID: number) {
	const value = datasetsDownloads[datasetID] ?? 0
	return value > 0
}

export function setDatasetDownloading(datasetID: number, value: boolean) {
	if (datasetsDownloads[datasetID] === undefined) datasetsDownloads[datasetID] = 0

	if (value) datasetsDownloads[datasetID]++
	else datasetsDownloads[datasetID]--

	/*
	 * Avoid keeping a list of all datasets in memory,
	 * we just keep what's being currently downloaded.
	 */
	if (datasetsDownloads[datasetID] === 0) delete datasetsDownloads.datasetID
}

// Helpers

function currentDateToString() {
	return (new Date()).toISOString()
}
