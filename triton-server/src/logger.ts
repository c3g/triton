import pino from 'pino'

import asyncHandler from 'express-async-handler'
import Express from 'express'

export const logger = pino({
	transport: {
		// We recommend against using pino-pretty in production and highly recommend installing pino-pretty as a development dependency.
		// - https://github.com/pinojs/pino-pretty#programmatic-integration
		target: 'pino-pretty',
	},
	level: 'warn',
})

export const httpLogger = asyncHandler(async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
	res.on('finish', () => {
		const {
			method = '',
			headers: { host = '', origin = '' },
			url = '',
			cookies = {},
		} = req
		const { statusCode = 0, statusMessage = '' } = res

		const obj = {
			request: {
				method,
				headers: { host, origin },
				url,
				cookies,
			},
			response: { statusCode, statusMessage },
		}
		const message = `${method ?? 'undefined'} ${url} ${statusCode} ${statusMessage}`

		if (statusCode < 400) {
			logger.info(obj, message)
		} else if (statusCode === 500) {
			logger.error(obj, message)
		} else {
			logger.warn(obj, message)
		}
	})
	next()
})
