import config from "../../config"
import cron from "node-cron"
import nodemailer from "nodemailer"
import { getFreezeManAuthenticatedAPI } from "@api/freezeman/api"
import * as email from "./contact-service"
import { defaultDatabaseActions } from "@database/download/actions"
import { logger } from "@core/logger"
import { Dataset, ValidationFlag } from "../types/freezeman"
import { sendEmail } from "@notifications/emails"

export const start = async () => {
    logger.info(`Environment running: ${process.env.NODE_ENV}`)
    logger.info(
        `Notification service started to run. (${config.cron.notification})`,
    )
    const task = cron.schedule(
        config.cron.notification,
        () => {
            logger.info("Executing notification service.")
            sendLatestReleasedNotificationEmail().catch((err) =>
                logger.error(err),
            )
            sendDatasetValidationStatusUpdateEmail().catch((err) =>
                logger.error(err),
            )
        },
        { runOnInit: true },
    )

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
            const formattedData: ExtractedValidatedNotificationData[] =
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
                "A run has been validated: <br/>" +
                formattedData.map(
                    (dataset: ExtractedValidatedNotificationData) => {
                        return `<br/><br/>
                            -   Run Name: ${
                                dataset.projectAndRunInfo.run_name
                            } <br/>
                            -   Validated by: ${
                                dataset.projectAndRunInfo.validated_by
                            } <br/>
                            -   Project: ${
                                dataset.projectAndRunInfo.project_name
                            }  ${
                                dataset.projectAndRunInfo.project_id ?? ""
                            } <br/>
                            - Dataset/lane ${
                                dataset.projectAndRunInfo.lane_number
                            } status ${getValidationFlagLabel(
                                dataset.projectAndRunInfo.validation_status,
                            )} <br/>
                                ${
                                    dataset.basicCommentUserInfo?.comment !=
                                    undefined
                                        ? "- Comments: " +
                                          dataset.basicCommentUserInfo
                                              ?.comment +
                                          "<br/>"
                                        : "No comments <br/>"
                                }
                                ${
                                    dataset.basicCommentUserInfo?.comment !=
                                    undefined
                                        ? "- Comments left by: " +
                                          dataset.basicCommentUserInfo?.name +
                                          "<br/>"
                                        : ""
                                }
                                ${
                                    dataset.basicCommentUserInfo?.comment !=
                                    undefined
                                        ? "- Created at: " +
                                          dataset.basicCommentUserInfo?.created_at.split(
                                              "T",
                                          )[0] +
                                          " " +
                                          dataset.basicCommentUserInfo?.created_at.split(
                                              "T",
                                          )[1] +
                                          "<br/>"
                                        : ""
                                }

                            `
                    },
                ) +
                `
                Thank you.<br/>

                This is an automated email, do not reply back.<br/>`
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
                    const subject = `The dataset for project '${dataset.external_project_id}' (Dataset #${dataset.id}) is now ready for staging and then download.`
                    const results = await email.broadcastEmailsOfProject(
                        dataset.external_project_id,
                        async (send) => {
                            await send(
                                `${subject}`,
                                `${subject}.<br/><br/>
                                -   <b>Project ID: ${
                                    dataset.external_project_id
                                }</b><br/>
                                -   <b>Run Name: ${dataset.run_name}</b><br/>
                                -   <b>Dataset ID: ${dataset.id}</b><br/>
                                -   Dataset Lane: ${dataset.lane}<br/>
                                -   Dataset release time: ${new Date(
                                    dataset.latest_release_update,
                                ).toUTCString()} (UTC)<br/><br/>
                                Datasets can be downloaded from the MGC Data Portal.
                                To access the Data Portal, please login to your Hercules account and click on the Data Portal button on the top menu.<br/>
                                You can download the dataset via SFTP or Globus using the credentials provided during the staging process.<br/><br/>
                                If you forgot or didn't receive your credential, you can reset your password in the Data Portal.<br/>
                                If you have any issues, please contact us at ${
                                    config.mail.techSupport
                                }.<br/><br/>
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
    const extractedData: ExtractedValidatedNotificationData[] = []
    validatedDataset.forEach((item: Dataset) => {
        const runsInfo: ProjectAndRunInfo = {
            run_name: item.run_name,
            project_name: item.project_name,
            project_id: item.external_project_id,
            lane_number: item.lane,
            validation_status: item.validation_status,
            validated_by: item.validated_by ?? "",
            latest_validation_update: item.latest_validation_update,
        }
        let userCommentInfo: BasicCommentUserInfo | undefined = undefined
        if (item.archived_comments.length > 0) {
            const latestComment = item.archived_comments.reduce((a, b) => {
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
    db: any,
) => {
    if (validatedDatasets.length > 0) {
        let lastDate: string | undefined = undefined
        const subject = `A Run has been validated.`

        await sendEmail("", config.mail.toValidationNotification, subject, body)

        lastDate =
            validatedDatasets[0].projectAndRunInfo.latest_validation_update
        if (lastDate !== undefined) {
            // update the last notification date
            await db.updateLatestValidatedNotificationDate(lastDate)
        }
    }
}
