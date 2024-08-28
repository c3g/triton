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
            `Found ${releasedDatasets.length} datasets to potentially notify for release.`,
        )
        if (releasedDatasets.length > 0) {
            await sendNotificationEmail(releasedDatasets)
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
            const results = await email.broadcastEmailsOfProject(
                dataset.external_project_id,
                async (send) => {
                    await send(
                        `${subject}`,
                        `${subject}.<br/>
                    Datasets can be downloaded from the MCG Data Portal, accessible from Hercules > Data Portal.<br/><br/>
                    Here are the information pertaining to the released dataset:<br/>
                        -   <b>Project ID: ${dataset.external_project_id}</b><br/>
                        -   <b>Run Name: ${dataset.run_name}</b><br/>
                        -   <b>Dataset ID: ${dataset.id}</b><br/>
                        -   Dataset Lane: ${dataset.lane}<br/>
                        -   Dataset release time: ${new Date(dataset.latest_release_update).toUTCString()} (UTC)<br/><br/>
                    This is an automated email, do not reply back.`,
                    )
                },
            )
            if (results.some((result) => result.status === "rejected")) {
                throw new Error(
                    `Failed to send email to every recipients of project '${dataset.external_project_id}'`,
                )
            }
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
