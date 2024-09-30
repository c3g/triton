import { TritonDataset } from "@api/api-types"
import { dataSize } from "@common/functions"
import { useAppSelector } from "@store/hooks"
import { selectReadsetsByDatasetID } from "@store/selectors"
import { useMemo } from "react"

export interface SizeProps {
    datasetID: TritonDataset["id"]
}

export function DatasetSize({ datasetID }: SizeProps) {
    const readsetsByDatasetID = useAppSelector((state) =>
        selectReadsetsByDatasetID(state, datasetID),
    )
    const totalSize = useMemo(
        () => readsetsByDatasetID.reduce((total, r) => total + r.total_size, 0),
        [readsetsByDatasetID],
    )

    return <>{dataSize(totalSize).join(" ")}</>
}
