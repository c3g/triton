import cron from "node-cron"
import nodemailer from "nodemailer"
import * as email from "./contact-service"
import { TritonDataset } from "./api/api-types"
import { getFreezeManAuthenticatedAPI } from "./freezeman/api"
import { defaultDatabaseActions } from "./download/actions"
import { logger } from "./logger"
import dayjs, { Dayjs } from "dayjs"
import config from "../config"

interface UpdatedTritonDataset
    extends Omit<TritonDataset, "latest_release_update"> {
    latest_release_update: Dayjs
}

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

        const datasets = (
            await freezemanApi.Dataset.listByReleasedUpdates(
                formatDateAndTime(dayjs(lastReleaseDate)),
            )
        ).data.results

        const updatedDatasets = datasets.reduce<UpdatedTritonDataset[]>(
            (datasets, dataset) => {
                if (dataset.latest_release_update) {
                    datasets.push({
                        external_project_id: dataset.external_project_id,
                        id: dataset.id,
                        lane: dataset.lane,
                        readset_count: dataset.readset_count,
                        released_status_count: dataset.released_status_count,
                        run_name: dataset.run_name,
                        latest_release_update: dayjs(
                            dataset.latest_release_update,
                        ),
                        blocked_status_count: dataset.blocked_status_count,
                        project_name: dataset.project_name,
                    })
                }
                return datasets
            },
            [],
        )

        logger.debug(
            `Found ${updatedDatasets.length} released datasets to potentially notify.`,
        )
        if (updatedDatasets.length > 0) {
            sendNotificationEmail(updatedDatasets)
        }
    })

    return () => {
        task.stop()
    }
}

export const sendNotificationEmail = async (
    updatedDatasets: UpdatedTritonDataset[],
) => {
    const db = await defaultDatabaseActions()
    updatedDatasets.sort((a, b) =>
        a.latest_release_update.diff(b.latest_release_update),
    )
    let lastDate: Dayjs | undefined = undefined
    for (const dataset of updatedDatasets) {
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
                        -   Dataset latest released update date: ${formatDateAndTime(dataset.latest_release_update)}<br/>

                    You can now stage for download through our data portal: <a href="${config.client.url}">${config.client.url}</a>.<br/>
                    This is an automated email, do not reply back.`,
                    )
                },
            )
        }

        // although datasets are sorted by date, we only want to
        // update the last date if the date is different
        if (lastDate && !dataset.latest_release_update.isSame(lastDate)) {
            await db.updateLatestReleaseNotificationDate(
                formatDateAndTime(lastDate),
            )
        }
        lastDate = dataset.latest_release_update
    }
    if (lastDate !== undefined) {
        // update the last notification date
        await db.updateLatestReleaseNotificationDate(
            formatDateAndTime(lastDate),
        )
    }
}

export const sendNotificationEmailTest = async (
    datasets: UpdatedTritonDataset[] = [mockDataset],
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
                        -   Dataset latest released update date: ${formatDateAndTime(dataset.latest_release_update)}
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

const mockDataset: UpdatedTritonDataset = {
    id: 987654,
    lane: 123546,
    external_project_id: "project-id-testing",
    project_name: "project name",
    run_name: "test name",
    readset_count: 19,
    released_status_count: 99,
    blocked_status_count: 64,
    latest_release_update: dayjs(),
}

const formatDateAndTime = (date: Dayjs): string => {
    return date.format("YYYY-MM-DDTHH:mm:ss")
}
