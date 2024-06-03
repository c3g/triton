/* eslint-disable @typescript-eslint/restrict-template-expressions */
/*
 * request-service.ts
 */
/* eslint-disable no-console */

import config from '../config'
import { logger } from './logger'
import { defaultDatabaseActions } from './download/actions'

export function start() {
    logger.info('[requests] Starting service...')
    const intervalID = setInterval(() => {
        void tick()
    }, config.request_service.tick_frequency)
    void tick()

    const stop = () => {
        logger.info('[requests] Stopping service...')
        clearInterval(intervalID)
    }

    async function tick() {
        const db = await defaultDatabaseActions()

        await db.deleteCancelledRequest() // Convert all cancelled requests to ready for deletion once they are fully staged.
    }

    return stop
}

export default {
    start,
}