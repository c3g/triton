#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Module dependencies.
 */

import * as http from 'http'
import { Express } from 'express'
import server from '../src/server'
import { initializeFreezemanAPIAuthorization } from './freezeman/authToken'
import { defaultDatabaseActions } from './download/actions'

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production'

/*
 * Spawn server
 */

const centralPort = process.env.PORT ?? '3001'

startup()

function startup() {
	startServer().catch((err) => {
		console.error('Server startup failed', err)
		throw err
	})
}

async function startServer() {
	// Create express server
	try {
		const { getConstants } = await defaultDatabaseActions()
		await getConstants() // throws if constants are not available
		initializeFreezemanAPIAuthorization()
		await createServer(server, centralPort)
		console.log(`Server running on port ${centralPort}`)
	} catch (e) {
		console.error('Failed to create server', e)
		throw e
	}
}

/**
 * Create HTTP server
 */
async function createServer(handler: Express, port: string): Promise<http.Server> {
	return await new Promise((resolve, reject) => {
		// set port for Express
		handler.set('port', normalizePort(port))

		const server = http.createServer(handler)

		// Listen on provided port, on all network interfaces.
		server.listen(port)
		server.on('error', reject)
		server.on('listening', () => resolve(server))
	})
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val: string): string | number | boolean {
	const port = parseInt(val, 10)

	if (isNaN(port)) {
		// named pipe
		return val
	}

	if (port >= 0) {
		// port number
		return port
	}

	return false
}
