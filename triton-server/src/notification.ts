import cron from "node-cron"
import nodemailer from "nodemailer"
import * as email from "./contact-service"
import { getFreezeManAuthenticatedAPI } from "./freezeman/api"
import { defaultDatabaseActions } from "./download/actions"
import { logger } from "./logger"
import { Dataset } from "./freezeman/models"

export const start = () => {
    const cronExpression = "0 * * * *"
    logger.info(`Notification service started to run. (${cronExpression})`)
    const task = cron.schedule(cronExpression, async () => {
        logger.info("Executing notification service.")

        const db = await defaultDatabaseActions()
        // this db action fails silently if the table does not exist
        const lastReleaseDate = (await db.getLatestReleaseNotificationDate())
            .last_released_notification_date

        const freezemanApi = await getFreezeManAuthenticatedAPI()

        const releasedDatasets = (
            await freezemanApi.Dataset.listByReleasedUpdates(lastReleaseDate)
        ).data.results.map((dataset) => ({ ...dataset }))

        logger.debug(
            `Found ${releasedDatasets.length} released datasets to potentially notify.`,
        )
        if (releasedDatasets.length > 0) {
            sendNotificationEmail(releasedDatasets)
        }
    })

    return () => {
        task.stop()
    }
}

export const sendNotificationEmail = async (releasedDatasets: Dataset[]) => {
    const db = await defaultDatabaseActions()
    releasedDatasets.sort(
        (a, b) =>
            new Date(a.latest_release_update).getTime() -
            new Date(b.latest_release_update).getTime(),
    )
    let lastDate: string | undefined = undefined
    for (const dataset of releasedDatasets) {
        if (dataset.released_status_count > 0) {
            const subject = `Dataset #${dataset.id} for project '${dataset.external_project_id}' has been released.`
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
                        -   Dataset latest released update date: ${dataset.latest_release_update} (UTC)<br/>

                    You can now stage it for download by signing in to Hercules and clicking on Data Portal.</a>.<br/>
                    This is an automated email, do not reply back.`,
                    )
                },
            )
        }

        // although datasets are sorted by date, we only want to
        // update the last date if the date is different
        if (lastDate && dataset.latest_release_update !== lastDate) {
            await db.updateLatestReleaseNotificationDate(lastDate)
        }
        lastDate = dataset.latest_release_update
    }
    if (lastDate !== undefined) {
        // update the last notification date
        await db.updateLatestReleaseNotificationDate(lastDate)
    }
}

export const sendNotificationEmailTest = async (
    datasets: Dataset[] = [mockDataset],
) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // other mailer can be used but right now default is gmail
        auth: {
            user: "yourGmailForTesting",
            pass: "app password",
        },
    })
    datasets.map((dataset) => {
        const mailOptions = {
            from: "yourGmail if gmail is being used",
            to: "theRecipient",
            subject: "Sending Email using Node.js",
            text: `The dataset can be downloaded using the Triton platform
                    Here are the information pertaining to the released dataset:
                        -   Dataset ID: ${dataset.id}
                        -   Dataset project id: ${dataset.external_project_id}
                        -   Dataset project name: ${dataset.project_name}
                        -   Dataset Lane: ${dataset.lane}
                        -   Readset count within the Dataset: ${
                            dataset.readset_count
                        }
                        -   Readset released status count: ${
                            dataset.released_status_count
                        }
                        -   Readset blocked status count: ${
                            dataset.blocked_status_count
                        }
                        -   Dataset latest released update date: ${dataset.latest_release_update}
                    You can now stage for download (Via Globus or SFTP) in Triton.

                    Thank you
                    From the Triton Tech team
                    This is an automated email, do not reply back.`,
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log("Email sent: " + info.response)
            }
        })
    })
}

const mockDataset: Dataset = {
    id: 987654,
    lane: 123546,
    external_project_id: "project-id-testing",
    project_name: "project name",
    run_name: "test name",
    readset_count: 19,
    released_status_count: 99,
    blocked_status_count: 64,
    latest_release_update: new Date().toISOString(),
    files: [],
}
