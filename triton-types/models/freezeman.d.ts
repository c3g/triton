export interface FMSList<T> {
    readonly count: number
    readonly next?: string
    readonly previous?: string
    readonly results: readonly T[]
}

export type DerivedSampleID = number
export type DatasetFileID = number
export type ProjectID = number

export interface Dataset {
    readonly id: DatasetID
    readonly external_project_id: string
    readonly project_name: string
    readonly run_name: string
    readonly lane: number
    readonly files: ReadonlyArray<DatasetFile["id"]>
    readonly readset_count: number
    readonly released_status_count: number
    readonly blocked_status_count: number
    // readonly metric_report_url?: string // it might reveal details about other projects
    readonly latest_release_update?: Date
}

export type DatasetID = number

export type ReleaseFlagAvailable = 0
export type ReleaseFlagReleased = 1
export type ReleaseFlagBlocked = 2
export type ReleaseFlag =
    | ReleaseFlagAvailable
    | ReleaseFlagReleased
    | ReleaseFlagBlocked

export type ValidationFlagAvailable = 0
export type ValidationFlagPassed = 1
export type ValidationFlagFailed = 2
export type ValidationFlag =
    | ValidationFlagAvailable
    | ValidationFlagPassed
    | ValidationFlagFailed

export interface DatasetFile {
    readonly id: DatasetFileID
    readonly readset: Readset
    readonly file_path: string
    readonly size: number
    readonly release_flag: ReleaseFlag
    readonly release_flag_timestamp?: Date
    readonly validation_status: ValidationFlag
    readonly validation_status_timestamp?: Date
}

export interface Readset {
    readonly id: number
    readonly name: string
    readonly dataset: Dataset["id"]
    readonly sample_name: string
    readonly derived_sample: DerivedSampleID | null
    readonly total_size: number
}

export interface Project {
    readonly id: ProjectID
    readonly created_at: Date
    readonly updated_at: Date
    readonly deleted: boolean
    readonly name: string
    readonly principal_investigator: string
    readonly requestor_name: string
    readonly requestor_email: string
    readonly targeted_end_date: Date
    readonly status: string
    readonly external_id: string
    readonly external_name: string
    readonly comment: string
    readonly created_by: number
    readonly updated_by: number
}
