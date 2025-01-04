module.exports = {
    entry: {
        popup: './src/popup/popup.js',
        options: './src/popup/options.js',
        leetcode: './src/popup/script/leetcode.js',
        leetcodecn: './src/popup/script/leetcodecn.js',
        autoReset: './src/autoReset.js'
    },
    output: {
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    },
    mode: 'production'
}