import { Divider, Empty, Spin } from "antd"
import { useEffect, useMemo, useState } from "react"
import { useAppDispatch, useAppSelector } from "@store/hooks"
import DatasetCard from "@components/DatasetCard"
import { DatasetListProps } from "./interfaces"
import { selectDatasetsByExternalProjectID } from "@store/selectors"
import { fetchDatasets, fetchReadsets, fetchRequests } from "@store/thunks"

export default function DatasetList({ externalProjectID }: DatasetListProps) {
    const dispatch = useAppDispatch()
    const [isFetching, setIsFetching] = useState(true)
    const datasets = useAppSelector((state) => selectDatasetsByExternalProjectID(state, externalProjectID))

    useEffect(() => {
        ; (async () => {
            const datasets = await dispatch(fetchDatasets(externalProjectID))
            // prefetch requests and readsets for each dataset
            await dispatch(fetchRequests(datasets.map((dataset) => dataset.id)))
            for (const dataset of datasets) {
                await dispatch(fetchReadsets(dataset.id))
            }
            setIsFetching(false)
        })()
    }, [dispatch, externalProjectID])

    const renderDatasets = useMemo(() => {
        if (isFetching) return [<Spin key={"spin"} />]
        else if (datasets.length === 0)
            return [
                <Empty
                    key={"empty"}
                    description={
                        "There are no sample data available for request."
                    }
                />,
            ]
        else if (datasets.length > 0) {
            return datasets
                .sort(
                    (a, b) =>
                        (a.lane ?? 0) -
                        (b.lane ?? 0),
                )
                .map((dataset, index) => {
                    return (
                        <>
                            <DatasetCard
                                key={dataset.id}
                                datasetID={dataset.id}
                            />
                            {index < datasets.length - 1 ? (
                                <Divider style={{ margin: "0.5rem 0" }} />
                            ) : null}
                        </>
                    )
                })
        }

        return []
    }, [datasets])

    return (
        <div
            className="data-sets-container"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
            }}
        >
            {renderDatasets}
        </div>
    )
}
