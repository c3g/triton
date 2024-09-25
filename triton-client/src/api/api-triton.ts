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
    TritonRequest,
    TritonRequestResponse,
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
 * Fetch the datasets associated with a project.
 * @param externalProjectID external project id
 * @returns TritonDataset[]
 */
export async function listDatasetsByExternalProjectID(
    externalProjectID: ExternalProjectID,
) {
    return await tritonGet<TritonDataset[]>(
        `runs-datasets/?external_project_ids=${externalProjectID}/`,
    )
}

export async function listRequestsByDatasetIds(
    datasetIDs: Array<TritonDataset["id"]>,
) {
    const idList = datasetIDs.join(",")
    return await tritonGet<TritonRequest[]>(
        `list-requests?dataset_ids=${idList}`,
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

export default {
    fetchLoginStatus,
    listProjects,
    listDatasetsByExternalProjectID,
    listRequestsByDatasetIds,
    listReadsetsForDataset,
    listDatasetFilesForReadset,
    createDownloadRequest,
    getConstants,
    deleteDownloadRequest,
    extendStagingRequest,
}
