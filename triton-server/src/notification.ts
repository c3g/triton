import config from "../config"
import cron from "node-cron"
import nodemailer from "nodemailer"
import { getFreezeManAuthenticatedAPI } from "./freezeman/api"
import { defaultDatabaseActions } from "./download/actions"
import { logger } from "./logger"
import { Dataset, ValidationFlag } from "./freezeman/models"
import { sendEmail } from "./download/email"

export const start = async () => {
    const cronExpression = "*/15 * * * *"
    logger.info(`Environment running: ${process.env.NODE_ENV}`)
    logger.info(`Notification service started to run. (${cronExpression})`)
    const task = cron.schedule(cronExpression, () => {
        logger.debug("Executing notification service.")
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

        // the email portion of the logic

        if (validatedDatasets.length > 0) {
            logger.info(
                `Found ${validatedDatasets.length} datasets to notify for validation.`,
            )

            let formattedData: ExtractedValidatedNotificationData[] =
                await extractValidatedDatasetsInfo(validatedDatasets)

            formattedData.map((dataset: ExtractedValidatedNotificationData) => {
                if (
                    dataset.basicCommentUserInfo?.user_id &&
                    !ids.includes(dataset.basicCommentUserInfo?.user_id)
                ) {
                    ids.push(dataset.basicCommentUserInfo?.user_id)
                }
            })

            if (ids.length > 0) {
                ;(await freezemanApi.Users.getUsersByIds(ids)).data.results.map(
                    (freezemanUser) => {
                        formattedData.map(
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

            const body =
                "<b>A run has been validated:</b> <br/>" +
                formattedData.map(
                    (dataset: ExtractedValidatedNotificationData) => {
                        return `<br/><br/>
                            - <b>Run Name:</b> ${dataset.projectAndRunInfo.run_name} <br/>
                            - <b>Validated by:</b> ${dataset.projectAndRunInfo.validated_by} <br/>
                            - <b>Project:</b> ${dataset.projectAndRunInfo.project_name}  ${dataset.projectAndRunInfo.project_id ?? ""} <br/>
                            - <b>Dataset/lane ${dataset.projectAndRunInfo.lane_number} status</b> ${getValidationFlagLabel(dataset.projectAndRunInfo.validation_status)} <br/>
                                ${dataset.basicCommentUserInfo?.comment != undefined ? "- <b>Comments: </b>" + dataset.basicCommentUserInfo?.comment + "<br/>" : "No comments <br/>"}
                                ${dataset.basicCommentUserInfo?.comment != undefined ? "- <b>Comments left by: </b>" + dataset.basicCommentUserInfo?.name + "<br/>" : ""}
                                ${dataset.basicCommentUserInfo?.comment != undefined ? "- <b>Created at: </b>" + dataset.basicCommentUserInfo?.created_at.split("T")[0] + " " + dataset.basicCommentUserInfo?.created_at.split("T")[1] + "<br/>" : ""}

                            ----------------------`
                    },
                ) +
                `

                <br/>Thank you.<br/>

                This is an automated email, do not reply back.<br/>` // await sendTestEmail(body)
            await sendValidationEmail(formattedData, body)
        } else {
            logger.debug(
                `Found ${validatedDatasets.length} datasets to notify for validation.`,
            )
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
            let latestComment = item.archived_comments.reduce((a, b) => {
                return new Date(a.created_at) > new Date(b.created_at) ? a : b
            })
            userCommentInfo = {
                comment: latestComment.comment,
                created_at: latestComment.created_at,
                user_id: latestComment.created_by,
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
) => {
    if (validatedDatasets.length > 0) {
        const db = await defaultDatabaseActions()

        const subject = `A Run has been validated.`

        await sendEmail("", config.mail.toValidationNotification, subject, body)

        const lastDate = validatedDatasets
            .map((x) => x.projectAndRunInfo.latest_validation_update)
            .sort(compareTimestamp)[validatedDatasets.length - 1]
        await db.updateLatestValidatedNotificationDate(lastDate)
    }
}

/**
 *
 * @param {string} a ISO 8601 timestamp (UTC)
 * @param {string} b ISO 8601 timestamp (UTC)
 * @returns {-1 | 0 | 1}
 */
function compareTimestamp(a: string, b: string): -1 | 0 | 1 {
    // remove the last character which should be 'Z'
    a = a.slice(0, -1)
    b = b.slice(0, -1)
    if (a > b) {
        return 1
    } else if (a < b) {
        return -1
    } else {
        return 0
    }
}
