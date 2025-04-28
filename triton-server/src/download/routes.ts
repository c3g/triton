import express, { Request, Response } from "express"
import asyncHandler from "express-async-handler"
import { dataHandler, errorHandler } from "./handlers"
import { defaultDatabaseActions } from "./actions"
import { getFreezeManAuthenticatedAPI } from "../freezeman/api"
import { NewDownloadFile } from "./download-types"
import {
    TritonCreateRequestBody,
    TritonCreateRequestResponse,
} from "./api-types"
import path from "path"
import { sendEmailDebug } from "./email"

const router = express.Router()

// GET list request

// POST create request
router.post(
    "/create-request/",
    asyncHandler(async (req: Request, res: Response) => {
        const { projectID, datasetID, type } =
            req.body as TritonCreateRequestBody
        const { createRequest } = await defaultDatabaseActions()

        try {
            const freezeManAPI = await getFreezeManAuthenticatedAPI()
            const datasets = (
                await freezeManAPI.Dataset.list([datasetID.toString()])
            ).data.results
            if (datasets.length === 0) {
                return errorHandler(res)(
                    new Error(`Could not find dataset with id '${datasetID}'`),
                )
            }
            const dataset = datasets[0]
            const freezemanFiles = (
                await freezeManAPI.DatasetFile.listByDatasetId(dataset.id)
            ).data.results
            const downloadFiles: NewDownloadFile[] = freezemanFiles.map(
                (file) => {
                    const fileName = path.basename(file.file_path)
                    return {
                        dataset_id: String(datasetID),
                        source: file.file_path,
                        destination: fileName,
                    }
                },
            )
            const result: TritonCreateRequestResponse = await createRequest(
                {
                    project_id: projectID,
                    dataset_id: String(datasetID),
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                    type,
                    requester: String(req.session.userDetails?.email),
                },
                downloadFiles,
            )
            sendEmailDebug(
                "Triton Request Created",
                `Request created for dataset ${datasetID} with type ${type} for project ${projectID}`,
            )
            return dataHandler(res)(result)
        } catch (error) {
            return errorHandler(res)(error)
        }
    }),
)

router.post(
    "/extend-request/",
    asyncHandler(async (req: Request, res: Response) => {
        const datasetID = req.query.dataset_id
        const { extendRequest } = await defaultDatabaseActions()
        try {
            const result = await extendRequest(String(datasetID))
            sendEmailDebug(
                "Triton Request Extended",
                `Request extended for dataset ${datasetID}`,
            )
            dataHandler(res)(result)
        } catch (error) {
            errorHandler(res)(error)
        }
    }),
)

// DELETE request deletion
router.delete(
    "/delete-request/",
    asyncHandler(async (req: Request, res: Response) => {
        const datasetID = req.query.dataset_id
        const { deleteRequest } = await defaultDatabaseActions()
        try {
            const result = await deleteRequest(String(datasetID))
            sendEmailDebug(
                "Triton Request Deleted",
                `Request deleted for dataset ${datasetID}`,
            )

            dataHandler(res)(result)
        } catch (error) {
            errorHandler(res)(error)
        }
    }),
)

router.get(
    "/constants/",
    asyncHandler(async (req: Request, res: Response) => {
        const { getConstants } = await defaultDatabaseActions()
        const result = await getConstants()
        dataHandler(res)(result)
    }),
)

router.post(
    "/reset-password/",
    asyncHandler(async (req: Request, res: Response) => {
        const { projectID, type } = req.body
        try {
            const { resetContactPassword } = await defaultDatabaseActions()
            await resetContactPassword(projectID, type)
            sendEmailDebug(
                "Triton Password Reset",
                `Password reset for project ${projectID} with type ${type}`,
            )
            dataHandler(res)({})
        } catch (error) {
            errorHandler(res)(error)
        }
    }),
)

export default router
