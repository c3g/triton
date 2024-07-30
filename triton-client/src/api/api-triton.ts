import {
    ApiReply,
    DownloadRequestType,
    ExternalProjectID,
    TritonConstants,
    TritonCreateRequestBody,
    TritonCreateRequestResponse,
    TritonDataset,
    TritonDatasetFile,
    TritonProject,
    TritonReadset,
    TritonReadsPerSample,
    TritonRequest,
    TritonRequestResponse,
    TritonRun,
} from "./api-types"
import {
    tritonGet,
    tritonPost,
    tritonDelete,
    fetchLoginStatus,
} from "./api-fetch"

/**
 * Fetch the list of projects the user has access to.
 *
 * @returns TritonProject array
 */
export async function listProjects() {
    return await tritonGet<TritonProject[]>("list-projects")
}

/**
 * Fetch the datasets associated with one or more projects. Specify one or more
 * freezeman project ids.
 * @param externalProjectIds One or more external project id's
 * @returns TritonDataset[]
 */
export async function listDatasetsByIds(
    datasetIDs: Array<TritonDataset["id"]>,
) {
    const idList = datasetIDs.join(",")
    return await tritonGet<TritonDataset[]>(`runs-datasets?ids=${idList}`)
}

export async function listRequestsByDatasetIds(
    datasetIDs: Array<TritonDataset["id"]>,
) {
    const idList = datasetIDs.join(",")
    return await tritonGet<TritonRequest[]>(
        `list-requests?dataset_ids=${idList}`,
    )
}

export async function listRunsForProjects(
    externalProjectIds: ExternalProjectID[],
) {
    const idList = externalProjectIds.join(",")
    return await tritonGet<TritonRun[]>(
        `project-runs?external_project_ids=${idList}`,
    )
}

export async function listReadsetsForDataset(datasetID: TritonDataset["id"]) {
    return await tritonGet<TritonReadset[]>(
        `dataset-readsets?dataset_id=${datasetID}`,
    )
}

export async function listDatasetFilesForReadset(
    readsetID: TritonReadset["id"],
) {
    return await tritonGet<TritonDatasetFile[]>(
        `/readset-datasetfiles/readset_id?=${readsetID}`,
    )
}

export async function createDownloadRequest(body: TritonCreateRequestBody) {
    return await tritonPost<TritonCreateRequestResponse>(
        `download/create-request/`,
        {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
        },
    )
}

export async function getConstants() {
    return await tritonGet<TritonConstants>(`download/constants/`)
}

export async function deleteDownloadRequest(datasetID: TritonDataset["id"]) {
    return await tritonDelete<TritonRequestResponse>(
        `download/delete-request?dataset_id=${datasetID}`,
    )
}

export async function extendStagingRequest(datasetID: TritonDataset["id"]) {
    return await tritonPost<TritonRequest>(
        `download/extend-request?dataset_id=${datasetID}`,
    )
}

export async function resetPassword(
    projectID: ExternalProjectID,
    type: DownloadRequestType,
) {
    return await tritonPost<ApiReply<Record<string, never>>>(
        `download/reset-password/`,
        {
            body: JSON.stringify({ projectID, type }),
            headers: { "Content-Type": "application/json" },
        },
    )
}

export async function getReadsPerSampleForDataset(
    datasetID: TritonDataset["id"],
) {
    return await tritonGet<TritonReadsPerSample>(
        `reads-per-sample/?dataset_id=${datasetID}`,
    )
}

export default {
    fetchLoginStatus,
    listProjects,
    listRunsForProjects,
    listDatasetsByIds,
    listRequestsByDatasetIds,
    listReadsetsForDataset,
    listDatasetFilesForReadset,
    createDownloadRequest,
    getConstants,
    getReadsPerSampleForDataset,
    deleteDownloadRequest,
    extendStagingRequest,
}
