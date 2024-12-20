/*
 * handlers.js
 */
import { Response } from "express"
import { logger } from "@core/logger"

export const errorHandler =
    (res: Response) =>
    (err: any, errorCode = 500) => {
        const result = {
            ok: false,
            message: err?.toString(),
            stack: err?.stack?.split("\n"),
            meta: undefined,
            data: undefined,
        }
        if (err?.meta !== undefined) result.meta = err?.meta
        if (err?.response?.body !== undefined) result.data = err?.response.body
        res.statusCode = errorCode
        res.json(result)
        res.end()
        logger.error(result)
    }

export const okHandler = (res: Response) => () => {
    res.json({ ok: true, data: null })
    res.end()
}

export const dataHandler = (res: Response) => (data: any) => {
    res.json({ ok: true, data })
    res.end()
}
