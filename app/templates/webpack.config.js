
import path from 'path';

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

    resolve: {
        root: __dirname,
        alias: {
            '<%= projectName %>': '<%= sourcePath %>/js',
        },
        modulesDirectories: [
            '<%= sourcePath %>/js',
            '<%= sourcePath %>/libs/bower',
            'node_modules',
        ],
    },

    resolveLoader: {
        root: __dirname,
        modulesDirectories: [
            '<%= sourcePath %>/js',
            '<%= sourcePath %>/libs/bower',
            'node_modules',
        ],
    },
};
