import { Table, TableProps } from "antd"
import { useCallback, useEffect, useState } from "react"
import { useAppDispatch } from "@store/hooks"
import { DatasetListProps } from "./interfaces"
import { fetchDatasets, fetchReadsets, fetchRequests } from "@store/thunks"
import { DatasetColumnSource, useDatasetColumns } from "@components/DatasetColumns"
import { TritonDataset, TritonRequest } from "@api/api-types"

export default function DatasetList({ externalProjectID }: DatasetListProps) {
    const dispatch = useAppDispatch()
    const [isFetching, setIsFetching] = useState(true)
    const [dataSource, setDataSource] = useState<NonNullable<TableProps<DatasetColumnSource>["dataSource"]>>([])

    useEffect(() => {
        ; (async () => {
            const datasets = await dispatch(fetchDatasets(externalProjectID))
            setDataSource(datasets.map((dataset) => ({
                id: dataset.id,
                lane: dataset.lane,
                external_project_id: dataset.external_project_id,
                latest_release_update: dataset.latest_release_update,
                isFetchingRequest: true,
                totalSize: 0 // size of 0 indicates that the size is not yet fetched
            })))
            setIsFetching(false)
            const readsets = await dispatch(fetchReadsets(datasets.map((dataset) => dataset.id)))
            const requests = await dispatch(fetchRequests(datasets.map((dataset) => dataset.id)))
            const totalSizeByDatasets = readsets.reduce<Record<TritonDataset["id"], number>>((acc, readset) => {
                acc[readset.dataset] = (acc[readset.dataset] || 0) + readset.total_size
                return acc
            }, {})
            const activeRequestByDatasets = requests.reduce<Record<TritonDataset["id"], TritonRequest | undefined>>((acc, request) => {
                acc[request.dataset_id] = request
                return acc
            }, {})
            setDataSource((prev) => prev.map((d) => ({
                ...d,
                isFetchingRequest: false,
                totalSize: totalSizeByDatasets[d.id] || 0,
                activeRequest: activeRequestByDatasets[d.id]
            })))
        })()
    }, [dispatch, externalProjectID])


    const updateDataset = useCallback(async (datasetID: TritonDataset["id"]) => {
        // only update request for now since readsets are not updated
        setDataSource((prev) => prev.map((d) => d.id === datasetID ? ({
            ...d,
            isFetchingRequest: true
        }) : d))
        const requests = await dispatch(fetchRequests([datasetID]))
        setDataSource((prev) => prev.map((d) => d.id === datasetID ? ({
            ...d,
            isFetchingRequest: false,
            activeRequest: requests.length > 0 ? requests[0] : undefined // only one request per dataset
        }) : d))
    }, [])
    const columns = useDatasetColumns(updateDataset)

    return (
        <Table<DatasetColumnSource>
            dataSource={dataSource}
            columns={columns}
            rowKey={(d) => d.id}
            loading={isFetching}
        />
    )
}
