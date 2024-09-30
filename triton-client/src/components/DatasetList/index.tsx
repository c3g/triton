import { Table, TableProps } from "antd"
import { useEffect, useState } from "react"
import { useAppDispatch } from "@store/hooks"
import { DatasetListProps } from "./interfaces"
import { fetchDatasets, fetchReadsets, fetchRequests } from "@store/thunks"
import { DatasetColumnSource, useDatasetColumns } from "@components/DatasetColumns"

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
            // prefetch requests and readsets for each dataset
            await Promise.allSettled(
                datasets.map(async (dataset) => {
                    const readsets = await dispatch(fetchReadsets([dataset.id]))
                    setDataSource((prev) => prev.map((d) => d.id === dataset.id ? ({
                        ...d,
                        totalSize: d.totalSize + readsets.reduce((acc, readset) => acc + readset.total_size, 0)
                    }) : d))
                    const requests = await dispatch(fetchRequests([dataset.id]))
                    setDataSource((prev) => prev.map((d) => d.id === dataset.id ? ({
                        ...d,
                        isFetchingRequest: false,
                        activeRequest: requests[0] // only one request per dataset
                    }) : d))
                }),
            )
        })()
    }, [dispatch, externalProjectID])


    const columns = useDatasetColumns()

    return (
        <Table<DatasetColumnSource>
            dataSource={dataSource}
            columns={columns}
            rowKey={(d) => d.id}
            loading={isFetching}
        />
    )
}
