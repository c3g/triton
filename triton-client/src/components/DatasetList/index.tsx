import { Table, TableProps } from "antd"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { DatasetListProps } from "./interfaces"
import { selectDatasetsByExternalProjectID } from "@store/selectors"
import { fetchDatasets, fetchReadsets, fetchRequests } from "@store/thunks"
import { useDatasetColumns } from "@components/DatasetColumns"
import { TritonDataset } from "@api/api-types"

export default function DatasetList({ externalProjectID }: DatasetListProps) {
    const dispatch = useAppDispatch()
    const [isFetching, setIsFetching] = useState(true)
    const datasets = useAppSelector((state) =>
        selectDatasetsByExternalProjectID(state, externalProjectID),
    )

    useEffect(() => {
        ; (async () => {
            const datasets = await dispatch(fetchDatasets(externalProjectID))
            setIsFetching(false)
            // prefetch requests and readsets for each dataset
            await Promise.allSettled(
                datasets.map(async (dataset) => {
                    await dispatch(fetchReadsets([dataset.id]))
                    await dispatch(fetchRequests([dataset.id]))
                }),
            )
        })()
    }, [dispatch, externalProjectID])

    const dataSource: NonNullable<TableProps<TritonDataset>["dataSource"]> =
        datasets
    const columns = useDatasetColumns(69)

    return (
        <Table<TritonDataset>
            dataSource={dataSource}
            columns={columns}
            rowKey={(d) => d.id}
            loading={isFetching}
        />
    )
}
