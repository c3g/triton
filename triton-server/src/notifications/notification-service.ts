import cron from "node-cron"
import { TritonDataset } from "../types/api"
import { getFreezeManAuthenticatedAPI } from "@api/freezeman/api"
import { sendNotificationEmail } from "./emails"

export const start = () => {
    console.info("Notification service started to run.")
    const task = cron.schedule("0 * * * *", async () => {
        console.info("Notification service is running at an hourly pace.")

        let releasedDatasets: TritonDataset[] = []

        const freezemanApi = await getFreezeManAuthenticatedAPI()

        const datasetsResponse =
            await freezemanApi.Dataset.listByReleasedUpdates()

        releasedDatasets = datasetsResponse.data.results.map((dataset) => {
            return {
                external_project_id: dataset.external_project_id,
                id: dataset.id,
                lane: dataset.lane,
                readset_count: dataset.readset_count,
                released_status_count: dataset.released_status_count,
                run_name: dataset.run_name,
                latest_release_update: dataset.latest_release_update,
                blocked_status_count: dataset.blocked_status_count,
                project_name: dataset.project_name,
            }
        })

        sendNotificationEmail(releasedDatasets)
    })
    task.start()

    return () => {
        task.stop()
    }
}
