import { DownloadRequest, DownloadRequestType } from "@api/api-types"

export default interface DatasetCardButtonProps {
    datasetID: number
    type: DownloadRequestType
    request: DownloadRequest | undefined
    loading: boolean
}
