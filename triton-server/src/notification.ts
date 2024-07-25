import cron from "node-cron"
import * as email from "./contact-service"
import { TritonDataset } from "./api/api-types"
import { getFreezeManAuthenticatedAPI } from "./freezeman/api"

const start = () => {
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

export const sendNotificationEmail = async (
    releasedDatasets: TritonDataset[],
) => {
    releasedDatasets.map(async (dataset: TritonDataset) => {
        const subject = `The following dataset #${dataset.id} for project '${dataset.external_project_id}' has been released.`
        await email.broadcastEmailsOfProject(
            dataset.external_project_id,
            async (send) => {
                await send(
                    `${subject}`,
                    `${subject}.<br/><br/>
                    The dataset can be downloaded using the Triton platform<br/>
                    Here are the information pertaining to the released dataset:<br/>
                        -   Dataset ID: ${dataset.id}<br/>
                        -   Dataset project id: ${
                            dataset.external_project_id
                        }<br/>
                        -   Dataset project name: ${dataset.project_name}<br/>
                        -   Dataset Lane: ${dataset.lane}<br/>
                        -   Readset count within the Dataset: ${
                            dataset.readset_count
                        }<br/>
                        -   Readset released status count: ${
                            dataset.released_status_count
                        }<br/>
                        -   Readset blocked status count: ${
                            dataset.blocked_status_count
                        }<br/>
                        -   Dataset latest released update date: ${formatDateAndTime(
                            dataset.latest_release_update ?? new Date(),
                        )}<br/>
                    You can now stage for download (Via Globus or SFTP) in Triton.<br/>

                    This is an automated email, do not reply back.`,
                )
            },
        )
    })
}

const formatDateAndTime = (date: Date): string => {
    const cleanedDate = new Date(date)
    return (
        cleanedDate.toLocaleDateString() +
        " " +
        cleanedDate.toLocaleTimeString()
    )
}

export default {
    start,
}
