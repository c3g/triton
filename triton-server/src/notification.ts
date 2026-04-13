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
    const task = cron.schedule(
        cronExpression,
        () => {
            logger.debug("Executing notification service.")
            sendDatasetValidationStatusUpdateEmail()
        },
        { runOnInit: true },
    )

    return () => {
        task.stop()
    }
}

export const sendDatasetValidationStatusUpdateEmail = async () => {
    const db = await defaultDatabaseActions()

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

            const formattedData =
                extractValidatedDatasetsInfo(validatedDatasets)

            const basicCommentUserInfoByUserId: Record<
                number,
                BasicCommentUserInfo[]
            > = {}
            for (const dataset of formattedData) {
                for (const commentInfo of dataset.basicCommentUserInfos) {
                    if (!basicCommentUserInfoByUserId[commentInfo.user_id]) {
                        basicCommentUserInfoByUserId[commentInfo.user_id] = []
                    }
                    basicCommentUserInfoByUserId[commentInfo.user_id].push(
                        commentInfo,
                    )
                }
            }

            const userIDs = Object.keys(basicCommentUserInfoByUserId).map(
                (id) => parseInt(id),
            )
            if (userIDs) {
                const users = await freezemanApi.Users.getUsersByIds(userIDs)
                for (const freezemanUser of users.data.results) {
                    const commentInfos =
                        basicCommentUserInfoByUserId[freezemanUser.id]
                    for (const commentInfo of commentInfos) {
                        commentInfo.name = `${freezemanUser.first_name} ${freezemanUser.last_name}`
                    }
                }
            }

            const body: string[] = []
            body.push("<b>A run has been validated:</b>")
            body.push("<br/>")
            for (const dataset of formattedData) {
                body.push("<br/>")
                body.push(
                    `<b>Run Name:</b> ${dataset.projectAndRunInfo.run_name}`,
                )
                body.push("<br/>")
                body.push(
                    `<b>Validated by:</b> ${dataset.projectAndRunInfo.validated_by}`,
                )
                body.push("<br/>")
                body.push(
                    `<b>Project:</b> ${dataset.projectAndRunInfo.project_name}  ${dataset.projectAndRunInfo.project_id ?? ""}`,
                )
                body.push("<br/>")
                body.push(
                    `<b>Lane ${dataset.projectAndRunInfo.lane_number} status:</b> ${getValidationFlagLabel(dataset.projectAndRunInfo.validation_status)}`,
                )
                body.push("<br/>")
                if (dataset.basicCommentUserInfos.length > 0) {
                    body.push(`<b>Comments:</b>`)
                    for (const commentInfo of dataset.basicCommentUserInfos) {
                        body.push("<br/>")
                        body.push(`&emsp;- ${commentInfo.comment} <br/>`)
                        body.push(
                            `&emsp;&emsp;<b>Left by: </b> ${commentInfo.name} <br/>`,
                        )
                        const time = new Date(
                            commentInfo.created_at,
                        ).toLocaleString("en-CA", {
                            timeZone: "America/Montreal",
                        })
                        body.push(`&emsp;&emsp;<b>Created at: </b> ${time}`)
                    }
                }
                body.push("<br/>")
            }
            body.push(
                "<br/>",
                "Thank you.",
                "<br/>",
                "This is an automated email, do not reply back.",
            )
            body.push("<br/>")

            // sendTestEmail(body.join("\n"))
            await sendValidationEmail(formattedData, body.join("\n"))
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
const extractValidatedDatasetsInfo = (
    validatedDataset: Dataset[],
): ExtractedValidatedNotificationData[] => {
    return validatedDataset.map((item: Dataset) => {
        const runsInfo: ProjectAndRunInfo = {
            run_name: item.run_name,
            project_name: item.project_name,
            project_id: item.external_project_id,
            lane_number: item.lane,
            validation_status: item.validation_status,
            validated_by: item.validated_by ?? "",
            latest_validation_update: item.latest_validation_update,
        }

        const userCommentInfos: BasicCommentUserInfo[] = item.archived_comments
            .map((comment) => ({
                comment: comment.comment,
                created_at: comment.created_at,
                user_id: comment.created_by,
            }))
            .sort((a, b) => compareTimestamp(a.created_at, b.created_at))

        return {
            basicCommentUserInfos: userCommentInfos,
            projectAndRunInfo: runsInfo,
        }
    })
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
    basicCommentUserInfos: BasicCommentUserInfo[]
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
