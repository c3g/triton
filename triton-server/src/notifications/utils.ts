import { TritonDataset } from "../types/api"

export const mockDataset: TritonDataset = {
    id: 987654,
    lane: 123546,
    external_project_id: "project-id-testing",
    project_name: "project name",
    run_name: "test name",
    readset_count: 19,
    released_status_count: 99,
    blocked_status_count: 64,
    latest_release_update: new Date(),
}

export const formatDateAndTime = (date: Date): string => {
    const cleanedDate = new Date(date)
    return (
        cleanedDate.toLocaleDateString() +
        " " +
        cleanedDate.toLocaleTimeString()
    )
}
