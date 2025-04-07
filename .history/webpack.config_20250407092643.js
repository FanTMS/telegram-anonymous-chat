module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
                exclude: [/\bnode_modules\/@twa-dev\/sdk\b/]
            }
        ]
    }
};