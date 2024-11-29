import { TritonDataset } from "../types/api"

export const mockDataset: TritonDataset = {
    id: 987654,
    lane: 123546,
    external_project_id: "project-id-testing",
    project_name: "project name",
    run_name: "run name",
    readset_count: 19,
    released_status_count: 99,
    blocked_status_count: 64,
    latest_release_update: new Date().toDateString(),
    archived_comments: [],
    latest_validation_update: new Date().toDateString(),
    validation_status: 1,
    released_by: "hello",
    validated_by: "potato",
}

export const formatDateAndTime = (date?: Date): string => {
    const cleanedDate = date ?? new Date()
    if (!date) {
        const hours = new Date().getHours() - 1
        cleanedDate.setHours(hours)
    }
    return (
        cleanedDate.toLocaleDateString() +
        "T" +
        cleanedDate.toLocaleTimeString().split(" ")[0]
    )
}
