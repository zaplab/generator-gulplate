
import path from 'path';

export default {
    module: {
        loaders: [
            {
                test: /\.js?$/,
                include: [
                    path.resolve(__dirname, '<%= testsPath %>/spec'),
                    path.resolve(__dirname, '<%= sourcePath %>'),
                ],
                loader: 'babel',
            }
        ]
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
