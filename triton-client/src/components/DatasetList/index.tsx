import { Divider, Empty, Spin } from "antd"
import { useMemo } from "react"
import { useAppSelector } from "@store/hooks"
import DatasetCard from "@components/DatasetCard"
import { DatasetListProps } from "./interfaces"

export default function DatasetList({ runName }: DatasetListProps) {
    const datasetIDs = useAppSelector(
        (state: any) => state.runsState.runsByName[runName]?.datasets,
    )

    const renderDatasets = useMemo(() => {
        if (datasetIDs === undefined) return <Spin />
        if (datasetIDs.length === 0)
            return (
                <Empty
                    description={
                        "There are no sample data available for request."
                    }
                />
            )
        if (datasetIDs.length > 0) {
            return datasetIDs.map((datasetID, index) => {
                return (
                    <>
                        <DatasetCard key={datasetID} datasetID={datasetID} />
                        {index < datasetIDs.length - 1 ? (
                            <Divider style={{ margin: "0.5rem 0" }} />
                        ) : null}
                    </>
                )
            })
        }
    }, [datasetIDs])

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
