import "dotenv/config"

function getEnv(key: string, defaultValue?: string) {
    const value = process.env[key]
    if (value === undefined) {
        return defaultValue
    }
    return value
}

const missingKeys = new Set<string>()
function getMandatoryEnv(key: string) {
    const value = process.env[key]
    if (value === undefined) {
        missingKeys.add(key)
        return ""
    }
    return value
}

const config = {
    url: getMandatoryEnv("API_URL"),

    logger: {
        level: getMandatoryEnv("LOGGER_LEVEL"),
    },

    paths: {
        downloadDB: getMandatoryEnv("DOWNLOAD_DATABASE_PATH"),
    },

    mail: {
        debug: getMandatoryEnv("DEBUG_EMAIL"),
        techSupport: getMandatoryEnv("TECH_SUPPORT_EMAIL"),
        toValidationNotification: getMandatoryEnv("TO_VALIDATION_EMAIL"),
    },

    sftp: {
        server: getMandatoryEnv("SFTP_SERVER"),
        port: getMandatoryEnv("SFTP_PORT"),
    },

    client_portal: {
        httpsProxy: getMandatoryEnv("TRITON_HTTPS_PROXY"),
        // Hercules login page url - the user logs in on this page.
        loginUrl: getMandatoryEnv("CLIENT_PORTAL_LOGIN"),
        // Api endpoint base url
        apiUrl: getMandatoryEnv("CLIENT_PORTAL_API_URL"),
        // Token url to get the token
        tokenUrl: getMandatoryEnv("CLIENT_PORTAL_TOKEN_URL"),
        // Credentials for the Triton server to call the Magic api
        user: getMandatoryEnv("CLIENT_PORTAL_USERNAME"),
        password: getMandatoryEnv("CLIENT_PORTAL_PASSWORD"),
    },

    lims: {
        url: getMandatoryEnv("LIMS_API_URL"),
        username: getMandatoryEnv("LIMS_USERNAME"),
        password: getMandatoryEnv("LIMS_PASSWORD"),
    },

    client: {
        // Address of the triton client web application
        url: getMandatoryEnv("CLIENT_ORIGIN"),
    },
}

if (missingKeys.size > 0) {
    console.error(
        `Missing environment variables: ${Array.from(missingKeys.values()).join(", ")}`,
    )
    process.exit(1)
}

export default config
