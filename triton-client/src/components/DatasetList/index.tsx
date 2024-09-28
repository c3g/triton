import { Table, TableProps } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import { DatasetListProps } from "./interfaces"
import { selectDatasetsByExternalProjectID } from "@store/selectors"
import { fetchDatasets, fetchReadsets, fetchRequests } from "@store/thunks"
import { useDatasetColumns } from "@components/DatasetColumns"

export default function DatasetList({ externalProjectID }: DatasetListProps) {
    const dispatch = useAppDispatch()
    const [isFetching, setIsFetching] = useState(true)
    const datasets = useAppSelector((state) =>
        selectDatasetsByExternalProjectID(state, externalProjectID),
    )

    useEffect(() => {
        ;(async () => {
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

    const dataSource: TableProps["dataSource"] = useMemo(() => {
        return datasets.map((dataset) => ({
            key: dataset.id,
            dataset,
        }))
    }, [datasets])

    const columns = useDatasetColumns(69)

    return (
        <Table dataSource={dataSource} columns={columns} loading={isFetching} />
    )
}
