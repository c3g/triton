import { defaultDatabaseActions } from "../download/actions"
import { getFreezeManAuthenticatedAPI } from "../freezeman/api"
import {
    TritonDataset,
    TritonRequest,
    TritonDatasetFile,
    TritonReadset,
    ExternalProjectID,
} from "./api-types"

export async function listDatasetsByIds(
    datasetIds: string[],
): Promise<TritonDataset[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const datasetsResponse = await freezemanApi.Dataset.list(datasetIds)
    return datasetsResponse.data.results.map((d) => d)
}

export async function listDatasetsByExternalProjectID(
    externalProjectIDs: ExternalProjectID[],
): Promise<TritonDataset[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const datasetsResponse =
        await freezemanApi.Dataset.listByExternalProjectIds(externalProjectIDs)
    return datasetsResponse.data.results.map((d) => d)
}

export async function listRequests(
    datasetIds: Array<TritonDataset["id"]>,
): Promise<TritonRequest[]> {
    const { listRequestByDatasetId } = await defaultDatabaseActions()
    return (
        await Promise.all(
            datasetIds.map(
                async (datasetId) =>
                    await listRequestByDatasetId(datasetId.toString()),
            ),
        )
    ).reduce<TritonRequest[]>((requests, request) => {
        if (request) {
            requests.push(request)
        }
        return requests
    }, [])
}

export async function listReadsetsByDatasets(
    datasetIDs: Array<TritonDataset["id"]>,
): Promise<readonly TritonReadset[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const readsetsResponse =
        await freezemanApi.Readset.listByDatasetIDs(datasetIDs)
    return readsetsResponse.data.results
}

export async function listDatasetFilesByDataset(
    datasetId: TritonDataset["id"],
): Promise<TritonDatasetFile[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const datasetFiles = (
        await freezemanApi.DatasetFile.listByDatasetId(datasetId)
    ).data.results

    const { listFilesByDatasetId } = await defaultDatabaseActions()
    const downloadFiles = await listFilesByDatasetId(`${datasetId}`)

    const tritonDatasetFiles: Record<
        string,
        Partial<TritonDatasetFile> | undefined
    > = {}
    for (const datasetFile of datasetFiles) {
        const tritonDatasetFile = (tritonDatasetFiles[datasetFile.file_path] ??=
            {})
        tritonDatasetFile.datasetFile = datasetFile
    }
    for (const downloadFile of downloadFiles) {
        const tritonDatasetFile = (tritonDatasetFiles[downloadFile.source] ??=
            {})
        tritonDatasetFile.downloadFile = downloadFile
    }

    return Object.values(tritonDatasetFiles).reduce<TritonDatasetFile[]>(
        (tritonDatasetFiles, tritonDatasetFile) => {
            if (
                tritonDatasetFile?.datasetFile !== undefined &&
                tritonDatasetFile?.downloadFile !== undefined
            ) {
                tritonDatasetFiles.push({
                    datasetFile: tritonDatasetFile.datasetFile,
                    downloadFile: tritonDatasetFile.downloadFile,
                })
            }
            return tritonDatasetFiles
        },
        [],
    )
}
