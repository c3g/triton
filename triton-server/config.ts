import "dotenv/config"

/**
 * Setting empty string as default value leads to exception if the environment variable is not set.
 */
const TRITON_ENVIRONMENTS = {
    API_URL: "",
    LOGGER_LEVEL: "info",
    CLIENT_ORIGIN: "",
    CLIENT_PORTAL_LOGIN: "",
    CLIENT_PORTAL_API_URL: "",
    CLIENT_PORTAL_TOKEN_URL: "",
    CLIENT_PORTAL_USERNAME: "",
    CLIENT_PORTAL_PASSWORD: "",
    LIMS_API_URL: "",
    LIMS_USERNAME: "",
    LIMS_PASSWORD: "",
    SFTP_SERVER: "",
    SFTP_PORT: "",
    ERROR_MONITORING_EMAIL: "",
    TECH_SUPPORT_EMAIL: "",
    TO_VALIDATION_EMAIL: "",
    TO_TEST_EMAIL: "scooby-doo@hotmail.ca",
    TRITON_HTTPS_PROXY: "",
    DOWNLOAD_DATABASE_PATH: "",
    CONTACT_SERVICE_INTERVAL_TIME: "30000", // 30 seconds
    RELEASE_VALIDATION_CRON: "0 * * * *", // 1 hour
}

const missingEnvVars: string[] = []
for (const key of Object.keys(TRITON_ENVIRONMENTS) as Array<
    keyof typeof TRITON_ENVIRONMENTS
>) {
    const value = process.env[key]
    if (value === undefined) {
        if (!TRITON_ENVIRONMENTS[key]) {
            missingEnvVars.push(key)
        }
    } else {
        TRITON_ENVIRONMENTS[key] = value
    }
}
if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing environment variables: ${missingEnvVars.join(", ")}`,
    )
}

export default {
    url: TRITON_ENVIRONMENTS.API_URL,

    logger: {
        level: TRITON_ENVIRONMENTS.LOGGER_LEVEL,
    },

    paths: {
        downloadDB: TRITON_ENVIRONMENTS.DOWNLOAD_DATABASE_PATH,
    },

    mail: {
        errorMonitoring: TRITON_ENVIRONMENTS.ERROR_MONITORING_EMAIL,
        techSupport: TRITON_ENVIRONMENTS.TECH_SUPPORT_EMAIL,
        toValidationNotification: TRITON_ENVIRONMENTS.TO_VALIDATION_EMAIL,
    },

    sftp: {
        server: TRITON_ENVIRONMENTS.SFTP_SERVER,
        port: TRITON_ENVIRONMENTS.SFTP_PORT,
    },

    email_testing: {
        to: TRITON_ENVIRONMENTS.TO_TEST_EMAIL,
    },

    client_portal: {
        httpsProxy: TRITON_ENVIRONMENTS.TRITON_HTTPS_PROXY,
        // Hercules login page url - the user logs in on this page.
        loginUrl: TRITON_ENVIRONMENTS.CLIENT_PORTAL_LOGIN,
        // Api endpoint base url
        apiUrl: TRITON_ENVIRONMENTS.CLIENT_PORTAL_API_URL,
        // Token url to get the token
        tokenUrl: TRITON_ENVIRONMENTS.CLIENT_PORTAL_TOKEN_URL,
        // Credentials for the Triton server to call the Magic api
        user: TRITON_ENVIRONMENTS.CLIENT_PORTAL_USERNAME,
        password: TRITON_ENVIRONMENTS.CLIENT_PORTAL_PASSWORD,
    },

    lims: {
        url: TRITON_ENVIRONMENTS.LIMS_API_URL,
        username: TRITON_ENVIRONMENTS.LIMS_USERNAME,
        password: TRITON_ENVIRONMENTS.LIMS_PASSWORD,
    },

    client: {
        // Address of the triton client web application
        url: TRITON_ENVIRONMENTS.CLIENT_ORIGIN,
    },

    cron: {
        contactService: Number.parseInt(
            TRITON_ENVIRONMENTS.CONTACT_SERVICE_INTERVAL_TIME,
        ),
        notification: TRITON_ENVIRONMENTS.RELEASE_VALIDATION_CRON,
    },
}
