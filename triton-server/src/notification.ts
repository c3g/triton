import config from "../config"
import cron from "node-cron"
import nodemailer from "nodemailer"
import * as email from "./contact-service"
import { getFreezeManAuthenticatedAPI } from "./freezeman/api"
import { defaultDatabaseActions } from "./download/actions"
import { logger } from "./logger"
import { Dataset, ValidationFlag } from "./freezeman/models"
import { sendEmail } from "./download/email"

export const start = async () => {
    const cronExpression = "0 * * * *"
    logger.info(`Notification service started to run. (${cronExpression})`)
    const task = cron.schedule(cronExpression, () => {
        logger.info("Executing notification service.")
        sendLatestReleasedNotificationEmail()
        sendDatasetValidationStatusUpdateEmail()
    })

    return () => {
        task.stop()
    }
}

export const sendDatasetValidationStatusUpdateEmail = async () => {
    const db = await defaultDatabaseActions()
    const ids: number[] = []

    const freezemanApi = await getFreezeManAuthenticatedAPI()

    const lastValidationStatusUpdate = (
        await db.getLatestValidatedNotificationDate()
    )?.last_validated_notification_date

    if (lastValidationStatusUpdate) {
        const validatedDatasets = (
            await freezemanApi.Dataset.listByValidatedStatusUpdates(
                lastValidationStatusUpdate,
            )
        ).data.results.map((dataset) => ({ ...dataset }))
        logger.debug(`Found ${validatedDatasets.length} datasets.`)
        // the email portion of the logic

        if (validatedDatasets.length > 0) {
            let formattedData: ExtractedValidatedNotificationData[] =
                await extractValidatedDatasetsInfo(validatedDatasets)

            formattedData.forEach(
                (dataset: ExtractedValidatedNotificationData) => {
                    if (
                        dataset.basicCommentUserInfo?.user_id &&
                        !ids.includes(dataset.basicCommentUserInfo?.user_id)
                    ) {
                        ids.push(dataset.basicCommentUserInfo?.user_id)
                    }
                },
            )
            if (ids.length > 0) {
                ;(await freezemanApi.Users.getUsersByIds(ids)).data.results.map(
                    (freezemanUser) => {
                        formattedData.forEach(
                            (user: ExtractedValidatedNotificationData) => {
                                if (
                                    user.basicCommentUserInfo?.user_id ===
                                        freezemanUser.id &&
                                    user.basicCommentUserInfo?.user_id
                                ) {
                                    user.basicCommentUserInfo.name =
                                        freezemanUser.first_name +
                                        " " +
                                        freezemanUser.last_name
                                }
                            },
                        )
                    },
                )
            }
            let body =
                "A run has been validated:" +
                formattedData.forEach(
                    (dataset: ExtractedValidatedNotificationData) => {
                        return `
                            -   Run Name: ${dataset.projectAndRunInfo.run_name}
                            -   Validated by: ${dataset.projectAndRunInfo.validated_by}
                            -   Project: ${dataset.projectAndRunInfo.project_name}  ${dataset.projectAndRunInfo.project_id ?? ""}
                            - Dataset/lane ${dataset.projectAndRunInfo.lane_number} status ${getValidationFlagLabel(dataset.projectAndRunInfo.validation_status)}
                                ${dataset.basicCommentUserInfo?.comment != undefined ? "- Comments: " + dataset.basicCommentUserInfo?.comment : "No comments"}
                                ${dataset.basicCommentUserInfo?.comment != undefined ? "- Comments left by: " + dataset.basicCommentUserInfo?.name : ""}
                                ${dataset.basicCommentUserInfo?.comment != undefined ? "- Created at: " + dataset.basicCommentUserInfo?.created_at.split("T")[0] + " " + dataset.basicCommentUserInfo?.created_at.split("T")[1] : ""}

                            `
                    },
                ) +
                `
                Thank you.

                This is an automated email, do not reply back.`
            // await sendTestEmail(body)
            await sendValidationEmail(formattedData, body, db)
        }
    }
}

export const sendLatestReleasedNotificationEmail = async () => {
    const db = await defaultDatabaseActions()

    const freezemanApi = await getFreezeManAuthenticatedAPI()

    const lastReleasedStatusUpdate = (
        await db.getLatestReleaseNotificationDate()
    )?.last_released_notification_date

    if (lastReleasedStatusUpdate) {
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
                                If you have any issues, please contact us at ${config.mail.techSupport}.<br/><br/>
                                Thank you.<br/>`,
                            )
                        },
                    )
                    if (
                        results.some((result) => result.status === "rejected")
                    ) {
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
    }
}

export const sendTestEmail = (body: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // other mailer can be used but right now default is gmail
        auth: {
            user: "sebastianamouzegar@gmail.com",
            pass: "tlba fptj scli xfdy",
        },
    })

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
    archived_comments: [],
    validation_status: 0,
    validated_by: 64,
    latest_validation_update: new Date().toISOString(),
}

const getValidationFlagLabel = (status: number) => {
    switch (status) {
        case 0:
            return "Available"
        case 1:
            return "Passed"
        case 2:
            return "Failed"
        default:
            break
    }
}

// this should also do the api call to get the basic info from the user
const extractValidatedDatasetsInfo = async (validatedDataset: Dataset[]) => {
    let extractedData: ExtractedValidatedNotificationData[] = []
    validatedDataset.forEach((item: Dataset) => {
        let runsInfo: ProjectAndRunInfo
        let userCommentInfo: BasicCommentUserInfo | undefined = undefined
        runsInfo = {
            run_name: item.run_name,
            project_name: item.project_name,
            project_id: item.external_project_id,
            lane_number: item.lane,
            validation_status: item.validation_status,
            validated_by: item.validated_by ?? "",
            latest_validation_update: item.latest_validation_update,
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
    validated_by?: string | number
    name?: string
    project_name: string
    validation_status: ValidationFlag
    latest_validation_update: string
    project_id?: string
}

interface ExtractedValidatedNotificationData {
    projectAndRunInfo: ProjectAndRunInfo
    basicCommentUserInfo?: BasicCommentUserInfo
}

export const sendValidationEmail = async (
    validatedDatasets: ExtractedValidatedNotificationData[],
    body: string,
    db: any,
) => {
    if (validatedDatasets.length > 0) {
        let lastDate: string | undefined = undefined
        for (const dataset of validatedDatasets) {
            if (dataset.projectAndRunInfo.validation_status > 0) {
                const subject = `A Run has been validated.`
                await sendEmail(
                    "",
                    "sequencing-runs@computationalgenomics.ca",
                    subject,
                    body,
                )
            }

            // although datasets are sorted by date, we only want to
            // update the last date if the date is different
            if (
                lastDate &&
                dataset.projectAndRunInfo.latest_validation_update !== lastDate
            ) {
                await db.updateLatestValidatedNotificationDate(lastDate)
            }
            lastDate = dataset.projectAndRunInfo.latest_validation_update
        }
        if (lastDate !== undefined) {
            // update the last notification date
            await db.updateLatestValidatedNotificationDate(lastDate)
        }
    }
}
