import { Divider, Empty, Spin } from "antd"
import { useMemo } from "react"
import { useAppSelector } from "@store/hooks"
import DatasetCard from "@components/DatasetCard"
import { DatasetListProps } from "./interfaces"

export default function DatasetList({ runName }: DatasetListProps) {
    const datasetIDs = useAppSelector(
        (state) => state.runsState.runsByName[runName]?.datasets,
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
            return datasetIDs.map((datasetID) => {
                return (
                    <DatasetCard key={datasetID} datasetID={datasetID} />
                )
            })
        }
    }, [datasetIDs])

    return (
        <table style={{ width: '100%' }}>
            {renderDatasets}
        </table>
    )
}
