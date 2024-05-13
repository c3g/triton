import express, { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { dataHandler, errorHandler } from './handlers'
import { defaultDatabaseActions } from './actions'
import { getFreezeManAuthenticatedAPI } from '../freezeman/api'
import { DownloadRequestType, NewDownloadFile } from './download-types'
import { TritonCreateRequestBody, TritonCreateRequestResponse } from './api-types'
const router = express.Router()

// GET list request

// POST create request
router.post(
	'/create-request/',
	asyncHandler(async (req: Request, res: Response) => {
		const { projectID, datasetID, type } = req.body as TritonCreateRequestBody
		const { createRequest } = await defaultDatabaseActions()

		try {
			const freezeManAPI = await getFreezeManAuthenticatedAPI()
			const datasets = (await freezeManAPI.Dataset.list([datasetID.toString()])).data.results
			if (datasets.length === 0) {
				return errorHandler(res)(new Error(`Could not find dataset with id '${datasetID}'`))
			}
			const freezemanFiles = (await freezeManAPI.DatasetFile.list(datasets[0].files)).data.results
			const downloadFiles: NewDownloadFile[] = freezemanFiles.map((file) => {
				return { dataset_id: String(datasetID), source: file.file_path, destination: file.readset.sample_name }
			})
			const result: TritonCreateRequestResponse = await createRequest(
				{
					project_id: projectID,
					dataset_id: String(datasetID),
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
					type,
					requester: String(req.session.userDetails?.email),
				},
				downloadFiles
			)
			return dataHandler(res)(result)
		} catch (error) {
			return errorHandler(res)(error)
		}
	})
)

// POST request deletion
router.delete(
	'/delete-request/',
	asyncHandler(async (req: Request, res: Response) => {
		const datasetID = req.query.datasetID
		const type = req.query.type
		const { deleteRequest } = await defaultDatabaseActions()

		try {
			const result = await deleteRequest(String(datasetID), type as DownloadRequestType)
			dataHandler(res)(result)
		} catch (error) {
			errorHandler(res)(error)
		}
	})
)

export default router
