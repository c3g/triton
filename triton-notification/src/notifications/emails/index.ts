/*
 * email.ts
 */
import cron from "node-cron"
import { logger } from "../../../../triton-server/src/core/logger"
import {
    sendLatestReleasedEmail,
    sendDatasetValidationStatusUpdateEmail,
} from "../notification-service"

export const start = () => {
    const hourlyCronExpression = "0 * * * *"
    logger.info(
        `Notification service started to run. (${hourlyCronExpression})`,
    )
    const notificationTask = cron.schedule(hourlyCronExpression, async () => {
        logger.info("Executing notification service.")
        await sendLatestReleasedEmail()
        await sendDatasetValidationStatusUpdateEmail()
    })
    notificationTask.start()

    return () => {
        notificationTask.stop()
    }
}
