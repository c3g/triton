import { DownloadFile, NewDownloadFile } from '../../../../triton-types/models/downloads'
import { DatabaseActions, createActions as createDatabaseActions } from '../../download/actions'
import { createSQLite } from '../../download/sqlite-database'
import path from 'path'

describe('download actions tests', () => {
	async function createTempDB() {
		const database = await createSQLite(':memory:', path.join(__dirname, '../../download/schema.sql'))
		return await createDatabaseActions(database)
	}

	const requestA: Parameters<DatabaseActions['createRequest']>[0] = {
		dataset_id: '1',
		project_id: 'projectID',
		type: 'HTTP',
		requester: 'The Requester!',
	}
	const newFiles: Parameters<DatabaseActions['insertFiles']>[0] = [
		{
			dataset_id: '1',
			source: 'source/1',
			destination: 'destination/1',
		},
		{
			dataset_id: '1',
			source: 'source/2',
			destination: 'destination/2',
		},
	]
	const files: DownloadFile[] = newFiles.map((newFile, idx) => ({ ...newFile, id: idx + 1 }))

	it('test create db from scratch', async () => {
		await expect(createTempDB()).resolves.not.toThrow()
	})

	describe('File Actions', () => {
		describe('insertFiles', () => {
			it('test empty insertFiles', async () => {
				const db = await createTempDB()
				await expect(db.insertFiles([])).rejects.toThrow(new Error('Cannot insert 0 files'))
				await expect(db.listFilesByDatasetId(files[0].dataset_id)).resolves.toHaveLength(0)
			})
			it('test valid insertFiles', async () => {
				const db = await createTempDB()
				await expect(db.insertFiles(newFiles)).resolves.toEqual(files)
				await expect(db.listFilesByDatasetId(files[0].dataset_id)).resolves.toEqual(files)
			})
			it('test conflicting insertFiles', async () => {
				const db = await createTempDB()
				await db.insertFiles([newFiles[0]])

				const conflictingFile: NewDownloadFile = {
					dataset_id: '1',
					source: 'source/1',
					destination: 'other_destination/1',
				}
				await expect(db.insertFiles([conflictingFile])).resolves.toContainEqual({ ...conflictingFile, id: 1 })
				await expect(db.listFilesByDatasetId(conflictingFile.dataset_id)).resolves.toEqual(
					expect.arrayContaining([expect.objectContaining({ destination: conflictingFile.destination })])
				)
			})
		})
	})

	describe('Request Actions', () => {
		describe('createRequest', () => {
			it('test createRequest with empty files', async () => {
				const db = await createTempDB()
				await expect(db.createRequest(requestA, [])).rejects.toThrow(new Error('Cannot insert 0 files'))
				await expect(db.getRequest(requestA.dataset_id)).rejects.toThrow(new Error('no result'))
			})
			it('test single createRequest', async () => {
				const db = await createTempDB()
				const result = await db.createRequest(requestA, newFiles)
				expect(result.request).toMatchObject(requestA)
				expect(result.files).toEqual(files)

				await expect(db.listRequestsByDatasetId(requestA.dataset_id)).resolves.toHaveLength(1)
				await expect(db.getRequest(requestA.dataset_id)).resolves.toMatchObject(requestA)
				await expect(db.getRequestByID(result.request.id)).resolves.toMatchObject(requestA)
				await expect(db.listFilesByDatasetId(result.request.dataset_id)).resolves.toEqual(files)
			})
			it('test two request for same dataset id', async () => {
				const db = await createTempDB()

				await db.createRequest(requestA, files)

				const requestB: Parameters<DatabaseActions['createRequest']>[0] = {
					dataset_id: '1',
					project_id: 'projectID',
					type: 'GLOBUS',
					requester: 'The Requester!',
				}
				await expect(db.createRequest(requestB, newFiles)).resolves.toMatchObject({ request: requestB, files })
				await expect(db.listRequestsByDatasetId(requestB.dataset_id)).resolves.toHaveLength(2)
				await expect(db.listFilesByDatasetId(requestA.dataset_id)).resolves.toEqual(files)
			})
			it('test two request for same dataset id and same type', async () => {
				const db = await createTempDB()
				await db.createRequest(requestA, newFiles)

				await expect(db.createRequest(requestA, newFiles)).rejects.toThrow(
					new Error('UNIQUE constraint failed: requests.type, requests.dataset_id')
				)
				await expect(db.listRequestsByDatasetId(requestA.dataset_id)).resolves.toHaveLength(1)
			})
		})

		describe('deleteRequest', () => {
			it('test valid deleteRequest', async () => {
				const db = await createTempDB()
				const createResult = await db.createRequest(requestA, newFiles)

				const deleteResult = await db.deleteRequest(requestA.dataset_id)
				expect(deleteResult).toMatchObject({ ...createResult.request, should_delete: 1 })

				await expect(db.getRequest(createResult.request.dataset_id)).resolves.toMatchObject(deleteResult)
			})
			it('test invalid deleteRequest', async () => {
				const db = await createTempDB()
				await expect(db.deleteRequest('1234')).rejects.toThrow(new Error('no result'))
			})
		})
	})
})
