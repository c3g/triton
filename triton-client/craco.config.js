const path = require("path")

module.exports = {
    webpack: {
        alias: {
            "@static": path.resolve(__dirname, "src/static/"),
            "@components": path.resolve(__dirname, "src/components/"),
            "@api": path.resolve(__dirname, "src/api/"),
            "@store": path.resolve(__dirname, "src/store/"),
            "@common": path.resolve(__dirname, "src/common/"),
        },
    },
}
