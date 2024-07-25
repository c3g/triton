import path from "path"
import express, { NextFunction, Request, Response } from "express"
import favicon from "serve-favicon"
import { httpLogger, logger } from "./logger"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import compression from "compression"
// the author of the type support for helmet did nothing
// there's not even index.d.ts 😠
import helmet from "helmet"
import { expressCspHeader, SELF } from "express-csp-header"
import session from "express-session"
import flash from "connect-flash"
import config from "../config"
import ApiRouter from "./api/api-routes"
import { UserDetails } from "./magic/magic-types"
import MagicAuthMiddleware from "./magic/magic_middleware"
// File staging DB
import DownloadRouter from "./download/routes"
import * as sqlite3 from "sqlite3"
import sqliteStoreFactory from "express-session-sqlite"
import cors from "cors"
import contactService from "./contact-service"
import notification from "./notification"

const SQLiteStore = sqliteStoreFactory(session)

interface Credentials {
    userId: string
    token: string
}

// Typescript magic code.
// Extend the express-session SessionData type to include our user credentials.
// The extended type is visible across the entire project.
declare module "express-session" {
    interface SessionData {
        userDetails: UserDetails
        credentials: Credentials
    }
}

// Cross-site origins allowed by server
const CLIENT_ORIGIN = new URL(config.client.url).origin
const CLIENT_PORTAL_ORIGIN = new URL(config.client_portal.loginUrl).origin

/*
 * Setup
 */

const stopContactService = contactService.start()
const stopNotificationService = notification.start()

const app = express()

// TODO Are these views needed anymore? What are they?
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")

const ORIGINS = [SELF, CLIENT_ORIGIN, CLIENT_PORTAL_ORIGIN] as const

app.use(compression())
app.use(favicon(path.join(__dirname, "public", "favicon.ico")))
app.use(httpLogger)
app.use(helmet())
app.use(
    expressCspHeader({
        directives: {
            "default-src": [
                ...ORIGINS,
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
            ],
            "connect-src": [...ORIGINS],
            "navigate-to": [...ORIGINS],
        },
    }),
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(flash())
app.use(
    session({
        store: new SQLiteStore({
            // Database library to use
            driver: sqlite3.Database,
            path: ":memory:",
            // Session TTL in milliseconds
            ttl: 30 /* minutes */ * 60 * 1000,
        }),
        cookie: { maxAge: 30 /* minutes */ * 60 * 1000 },
        secret: "ommanipadmehum", // TODO: set through config.ts?
        resave: true,
        saveUninitialized: true,
    }),
)

// This is required for the client to be able to make api requests to the server.
// We allow api requests from the web client's origin.
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", CLIENT_ORIGIN)
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE",
    )
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,content-type",
    )
    res.setHeader("Access-Control-Allow-Credentials", "true")
    next()
})

app.use(
    cors({
        origin: [...ORIGINS],
    }),
)

// ===============triton client==================//
// Set up the server to server triton-client

// Middleware that handles Magic user logins.
app.use(MagicAuthMiddleware)
app.use("/api", ApiRouter)
// File Staging
app.use("/api/download", DownloadRouter)

// Generic error handler that catches any exceptions thrown from our routes.
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    // TODO improve this
    res.status(500)
    let message: string
    if (error instanceof Error) {
        message = error.message
    } else {
        message = error.toString()
    }
    res.send(message)
    logger.error(error, message)
})

export default app
