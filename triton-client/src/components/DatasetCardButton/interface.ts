import { DownloadRequestType } from "@api/api-types"

export default interface DatasetCardButtonProps {
    datasetID: number
    type: DownloadRequestType
}
