/**
 * API endpoints
 *
 * This is the collection of endpoints for the api provided to the client by the server.
 * All api endpoints begin with '/api'
 */

import express from "express"
import asyncHandler from "express-async-handler"
import { getUserDetails, isUserAuthenticated } from "../magic/magic_api"
import {
    ApiReply,
    IsLoggedInData,
    TritonDataset,
    TritonDatasetFile,
    TritonProject,
    TritonReadset,
    TritonRequest,
    TritonRun,
    User,
} from "./api-types"
import {
    listDatasetFilesByDataset,
    listDatasetsByIds,
    listReadsetsByDataset,
    listRequests,
    listRunsByExternalProjectId,
} from "./datasets"
import { listUserProjects } from "./project"

const router = express.Router()

function okReply<T>(data: T): ApiReply<T> {
    return {
        ok: true,
        data,
    }
}

function errorReply(error: Error): ApiReply<unknown> {
    return {
        ok: false,
        message: error.message,
    }
}

/**
 * user/is-logged-in
 *
 * The frontend calls this to see if the user is currently logged in
 * to Magic.
 *
 * We use the userId and token stored in the user's session to check.
 */
router.get(
    "/user/is-logged-in",
    asyncHandler(async (req, res) => {
        let isLoggedIn = false
        let user: User | undefined

        if (req.session.credentials !== undefined) {
            const { userId, token } = req.session.credentials
            // TODO The server middleware has already checked that the user is authenticated,
            // so this call is redundant.
            isLoggedIn = await isUserAuthenticated(userId, token)
            if (isLoggedIn) {
                const userDetails = await getUserDetails(userId, token)
                user = userDetails
            }
        }
        res.json(okReply<IsLoggedInData>({ isLoggedIn, user }))
    }),
)

router.get(
    "/list-projects/",
    asyncHandler(async (req, res) => {
        if (req.session.credentials) {
            const { userId, token } = req.session.credentials
            const projects = await listUserProjects(userId, token)
            res.json(okReply<TritonProject[]>(projects))
        } else {
            res.sendStatus(401)
        }
    }),
)
router.get(
    "/project-runs/",
    asyncHandler(async (req, res) => {
        const idParam = req.query.external_project_ids as string
        const projectIds = idParam.split(",")

        // At least one project ID must be specified
        if (projectIds.length === 0) {
            res.status(400).send(
                "external_project_ids must contain at least one hercules project ID",
            )
            return
        }

        const runs = await listRunsByExternalProjectId(projectIds)
        res.json(okReply<TritonRun[]>(runs))
    }),
)
router.get(
    "/runs-datasets/",
    asyncHandler(async (req, res) => {
        const idParam = req.query.ids as string
        const ids = idParam.split(",")

        // At least one project ID must be specified
        if (ids.length === 0) {
            res.status(400).send(
                "external_project_ids must contain at least one hercules project ID",
            )
            return
        }

        const datasets = await listDatasetsByIds(ids)
        res.json(okReply<TritonDataset[]>(datasets))
    }),
)

router.get(
    "/list-requests/",
    asyncHandler(async (req, res) => {
        const idParam = req.query.dataset_ids as string
        const ids = idParam.split(",")

        // At least one project ID must be specified
        if (ids.length === 0) {
            res.status(400).send(
                "external_project_ids must contain at least one hercules project ID",
            )
            return
        }

        const requests = await listRequests(ids.map((id) => Number(id)))
        res.json(okReply<TritonRequest[]>(requests))
    }),
)

router.get(
    "/dataset-readsets/",
    asyncHandler(async (req, res) => {
        const idParam = Number(req.query.dataset_id)
        const readsets = await listReadsetsByDataset(idParam)
        res.json(okReply<TritonReadset[]>(readsets))
    }),
)

router.get(
    "/dataset-datasetfiles/",
    asyncHandler(async (req, res) => {
        const idParam = Number(req.query.dataset_id)
        const datasetFiles = await listDatasetFilesByDataset(idParam)
        res.json(okReply<TritonDatasetFile[]>(datasetFiles))
    }),
)

export default router
