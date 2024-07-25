#!/usr/bin/env node

/**
 * Module dependencies.
 */

import * as http from "http"
import { Express } from "express"
import server from "../src/server"
import { initializeFreezemanAPIAuthorization } from "./freezeman/authToken"
import { defaultDatabaseActions } from "./download/actions"
import * as notification from "./notification"
import { logger } from "./logger"

process.env.NODE_ENV = process.env.NODE_ENV ?? "production"

/*
 * Spawn server
 */

const centralPort = process.env.PORT ?? "3001"

startup()

function startup() {
    startServer().catch((err) => {
        logger.error(err, "Server startup failed")
        throw err
    })
}

async function startServer() {
    // Create express server
    notification.start()
    const { getConstants } = await defaultDatabaseActions()
    // throws if constants are not available
    await getConstants()
    initializeFreezemanAPIAuthorization()
    await createServer(server, centralPort)
    logger.info(`Server running on port ${centralPort}`)
}

/**
 * Create HTTP server
 */
async function createServer(
    handler: Express,
    port: string
): Promise<http.Server> {
    return await new Promise((resolve, reject) => {
        // set port for Express
        handler.set("port", normalizePort(port))

        const server = http.createServer(handler)

        // Listen on provided port, on all network interfaces.
        server.listen(port)
        server.on("error", reject)
        server.on("listening", () => resolve(server))
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
