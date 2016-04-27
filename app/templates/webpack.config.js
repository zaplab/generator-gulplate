
export default {
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                loader: 'babel',
            },
        ],
    },

    plugins: [],

    resolve: {
        root: __dirname,
        alias: {
            '<%= projectName %>': '<%= sourcePath %>/js',
        },
        modulesDirectories: [
            '<%= sourcePath %>/js',
            'node_modules',
        ],
    },

    resolveLoader: {
        root: __dirname,
        modulesDirectories: [
            '<%= sourcePath %>/js',
            'node_modules',
        ],
    },
};
