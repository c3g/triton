import { defaultDatabaseActions } from "@database/download/actions"
import { getFreezeManAuthenticatedAPI } from "./api"
import {
    TritonDataset,
    TritonRequest,
    TritonDatasetFile,
    TritonReadset,
    TritonRun,
} from "../../types/api"
import { FileType } from "../../../../triton-types/models/api"
import { logger } from "@core/logger"
import { FILE_TYPE_TO_REGEXP } from "@api/utils"

export async function listRunsByExternalProjectId(
    externalProjectIds: string[],
): Promise<TritonRun[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const datasetsResponse =
        await freezemanApi.Dataset.listByExternalProjectIds(externalProjectIds)
    const datasets = datasetsResponse.data.results.filter(
        (dataset) => dataset.released_status_count > 0,
    )
    const datasetsByRunIDAndProjectID = datasets.reduce<{
        [projectID: string]: { [runName: string]: typeof datasets }
    }>((runsByProjectID, dataset) => {
        const runName = dataset.run_name
        const externalProjectID = dataset.external_project_id
        const run = (runsByProjectID[externalProjectID] ??= {})
        const datasetIDs = (run[runName] ??= [])
        datasetIDs.push(dataset)
        return runsByProjectID
    }, {})

    const tritonRuns: TritonRun[] = []
    for (const externalProjectID in datasetsByRunIDAndProjectID) {
        for (const runName in datasetsByRunIDAndProjectID[externalProjectID]) {
            const date = new Date()
            const datasets =
                datasetsByRunIDAndProjectID[externalProjectID][runName]
            tritonRuns.push({
                external_project_id: externalProjectID,
                name: runName,
                runDate: date,
                datasets: datasets.map((d) => d.id),
                readsetCount: datasets.reduce(
                    (total, d) => total + d.readset_count,
                    0,
                ),
                availableReadsetsCount: datasets.reduce(
                    (total, d) => total + d.released_status_count,
                    0,
                ),
            })
        }
    }

    return tritonRuns
}

export async function listDatasetsByIds(
    datasetIds: string[],
): Promise<TritonDataset[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const datasetsResponse = await freezemanApi.Dataset.list(
        datasetIds.map((id) => parseInt(id)),
    )
    const tritonDatasets = datasetsResponse.data.results.map((d) => {
        const dataset: TritonDataset = {
            ...d,
            sizes: {
                FASTQ: 0,
                BAM: 0,
                CRAM: 0,
            },
        }
        if (dataset.files) {
            // avoid sending unnecessary data
            delete dataset.files
        }
        return dataset
    })

    const fileTypes: FileType[] = ["FASTQ", "BAM", "CRAM"]

    for (const tritonDataset of tritonDatasets) {
        const datasetFiles = await freezemanApi.DatasetFile.listByDatasetIds([
            tritonDataset.id,
        ])
        for (const datasetFile of datasetFiles.data.results) {
            const fileTypesIndex = fileTypes.findIndex((type) => {
                FILE_TYPE_TO_REGEXP[type].test(datasetFile.file_path)
            })
            if (fileTypesIndex === -1) {
                logger.warn(
                    `Unknown file type for file path ${datasetFile.file_path}`,
                )
            } else {
                tritonDataset.sizes[fileTypes[fileTypesIndex]] +=
                    datasetFile.size
            }
        }
    }

    return tritonDatasets
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

export async function listReadsetsByDataset(
    datasetId: TritonDataset["id"],
): Promise<TritonReadset[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const readsetsResponse = await freezemanApi.Readset.listByDatasetIds([
        datasetId,
    ])
    const readsets = [...readsetsResponse.data.results] // it's a readonly array
    return readsets
}

export async function listDatasetFilesByDataset(
    datasetId: TritonDataset["id"],
): Promise<TritonDatasetFile[]> {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    const datasetFiles = (
        await freezemanApi.DatasetFile.listByDatasetIds([datasetId])
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
