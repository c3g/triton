import cron from "node-cron"
import nodemailer from "nodemailer"
import * as email from "./contact-service"
import { getFreezeManAuthenticatedAPI } from "./freezeman/api"
import { defaultDatabaseActions } from "./download/actions"
import { logger } from "./logger"
import { Dataset, FreezemanUser, ValidationFlag } from "./freezeman/models"

export const start = () => {
    const cronExpression = "*/1 * * * *"
    logger.info(`Notification service started to run. (${cronExpression})`)
    const task = cron.schedule(cronExpression, async () => {
        logger.info("Executing notification service.")
        await sendLatestReleasedNotificationEmail()
        await sendDatasetValidationStatusUpdateEmail()
    })

    return () => {
        task.stop()
    }
}

export const sendDatasetValidationStatusUpdateEmail = async () => {
    const db = await defaultDatabaseActions()

    const freezemanApi = await getFreezeManAuthenticatedAPI()

    const lastValidationStatusUpdate = (
        await db.getLatestValidatedNotificationDate()
    ).last_validated_notification_date

    const validatedDatasets = (
        await freezemanApi.Dataset.listByValidatedStatusUpdates(
            lastValidationStatusUpdate,
        )
    ).data.results.map((dataset) => ({ ...dataset }))

    logger.debug(
        `Found ${validatedDatasets.length} datasets to potentially notify for release.`,
    )
    // the email portion of the logic
    if (validatedDatasets.length > 0) {
        let formattedData: ExtractedValidatedNotificationData[] =
            await extractValidatedDatasetsInfo(validatedDatasets)
        datasetObjectTestEmail(formattedData)
    }
}

export const sendLatestReleasedNotificationEmail = async () => {
    const db = await defaultDatabaseActions()

    const freezemanApi = await getFreezeManAuthenticatedAPI()

    const lastReleasedStatusUpdate = (
        await db.getLatestReleaseNotificationDate()
    ).last_released_notification_date

    const releasedDatasets = (
        await freezemanApi.Dataset.listByReleasedUpdates(
            lastReleasedStatusUpdate,
        )
    ).data.results.map((dataset) => ({ ...dataset }))

    logger.debug(
        `Found ${releasedDatasets.length} datasets to potentially notify for release.`,
    )
    // the email portion of the logic
    if (releasedDatasets.length > 0) {
        let formattedData: ExtractedValidatedNotificationData[] =
            await extractValidatedDatasetsInfo(releasedDatasets)
        datasetObjectTestEmail(formattedData)
    }

    releasedDatasets.sort(
        (a, b) =>
            new Date(a.latest_release_update).getTime() -
            new Date(b.latest_release_update).getTime(),
    )
    let lastDate: string | undefined = undefined
    for (const dataset of releasedDatasets) {
        if (dataset.released_status_count > 0) {
            const subject = `Dataset #${dataset.id} for project '${dataset.external_project_id}' is ready for staging for download.`
            const results = await email.broadcastEmailsOfProject(
                dataset.external_project_id,
                async (send) => {
                    await send(
                        `${subject}`,
                        `${subject}.<br/><br/>
                        -   <b>Project ID: ${dataset.external_project_id}</b><br/>
                        -   <b>Run Name: ${dataset.run_name}</b><br/>
                        -   <b>Dataset ID: ${dataset.id}</b><br/>
                        -   Dataset Lane: ${dataset.lane}<br/>
                        -   Dataset release time: ${new Date(dataset.latest_release_update).toUTCString()} (UTC)<br/><br/>
                        Datasets can be downloaded from the MCG Data Portal.
                        To access the Data Portal, please login to your Hercules account and click on the Data Portal button on the top menu.<br/>
                        Datasets can be downloaded using SFTP or Globus using the credential provided to you during the staging process.<br/><br/>
                        If you forgot or didn't receive your credential, you can reset your password in the Data Portal.<br/>
                        If you have any issues please contact us at hercules@mcgill.ca.<br/><br/>
                        Thank you.<br/>`,
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

export const datasetObjectTestEmail = (
    datasets: ExtractedValidatedNotificationData[],
) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // other mailer can be used but right now default is gmail
        auth: {
            user: "sebastianamouzegar@gmail.com",
            pass: "tlba fptj scli xfdy",
        },
    })
    let body =
        "A run has been validated:" +
        datasets.map((dataset: ExtractedValidatedNotificationData) => {
            return `
                    -   Run Name: ${dataset.projectAndRunInfo.run_name}
                    -   Validated by: Name of Lab user that validated the run ${dataset.projectAndRunInfo.project_name}
                    -   Project: ${dataset.projectAndRunInfo.project_name}  ${dataset.projectAndRunInfo.project_id ?? ""}
                    - Dataset/lane ${dataset.projectAndRunInfo.lane_number} status ${dataset.projectAndRunInfo.validationStatus}
                        - Comments left by ${dataset.basicCommentUserInfo?.name}
                        - Comment : ${dataset.basicCommentUserInfo?.comment}
                        - Created at : ${dataset.basicCommentUserInfo?.created_at}
                    `
        }) +
        `Thank you.

        "This is an automated email, do not reply back.`

    const mailOptions = {
        from: "sebastianamouzegar@gmail.com",
        to: "sebastian.amouzegar@computationalgenomics.ca",
        subject: "Sending Email using Node.js",
        text: body,
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        } else {
            console.log("Email sent: " + info.response)
        }
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
    archived_comments: [],
    validation_status: 0,
    validated_by: 64,
}

// this should also do the api call to get the basic info from the user
const extractValidatedDatasetsInfo = async (validatedDataset: Dataset[]) => {
    const freezemanApi = await getFreezeManAuthenticatedAPI()
    let extractedData: ExtractedValidatedNotificationData[] = []
    validatedDataset.map((item: Dataset) => {
        let runsInfo: ProjectAndRunInfo
        let userCommentInfo: BasicCommentUserInfo | undefined = undefined
        runsInfo = {
            run_name: item.run_name,
            project_name: item.project_name,
            project_id: item.external_project_id,
            lane_number: item.lane,
            validationStatus: item.validation_status,
            validated_by: item.validated_by ?? 64,
        }
        if (item.archived_comments.length > 0) {
            userCommentInfo = {
                comment: item.archived_comments[0].comment,
                created_at: item.archived_comments[0].created_at,
                user_id: item.archived_comments[0].created_by,
            }
        }
        extractedData.push({
            basicCommentUserInfo: userCommentInfo,
            projectAndRunInfo: runsInfo,
        })
    })
    let ids: number[]
    extractedData.map(async (dataset: ExtractedValidatedNotificationData) => {
        if (
            dataset.projectAndRunInfo.validated_by &&
            dataset.basicCommentUserInfo?.user_id
        ) {
            ids.push(dataset.basicCommentUserInfo?.user_id)
            ids.push(dataset.projectAndRunInfo.validated_by)
        }
        if (ids.length > 0) {
            await freezemanApi.Users.getUsersByIds(ids).then((response) => {
                response.data.map((user: FreezemanUser) => {
                    if (dataset.basicCommentUserInfo?.user_id === user.id) {
                        dataset.basicCommentUserInfo.name =
                            user.first_name + " " + user.last_name
                    }
                    if (dataset.projectAndRunInfo?.validated_by === user.id) {
                        dataset.projectAndRunInfo.name =
                            user.first_name + " " + user.last_name
                    }
                })
            })
        }
    })

    return extractedData
}

interface BasicCommentUserInfo {
    user_id: number
    created_at: string
    comment: string
    name?: string
}

interface ProjectAndRunInfo {
    run_name: string
    lane_number: number
    validated_by?: number
    name?: string
    project_name: string
    validationStatus: ValidationFlag
    project_id?: string
}

interface ExtractedValidatedNotificationData {
    projectAndRunInfo: ProjectAndRunInfo
    basicCommentUserInfo?: BasicCommentUserInfo
}
