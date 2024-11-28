<<<<<<< Updated upstream
import { TritonDataset } from "../types/api"
=======
import { TritonDataset } from "../../../triton-types/models/api"
>>>>>>> Stashed changes

export const mockDataset: TritonDataset = {
    id: 987654,
    lane: 123546,
    external_project_id: "project-id-testing",
    project_name: "project name",
<<<<<<< Updated upstream
    run_name: "test name",
    readset_count: 19,
    released_status_count: 99,
    blocked_status_count: 64,
    latest_release_update: new Date(),
=======
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
>>>>>>> Stashed changes
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
