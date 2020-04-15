const path = require('path');
const fs = require('fs');

const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const VueLoaderPlugin = require('vue-loader/lib/plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin');

const info = require("./package.json")



module.exports = {
    entry: {
        "main": './src/main.js'
    },
    plugins: [
        new CleanWebpackPlugin(),
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            title: 'covidTimeSeries',
            template: './src/index.html',
            filename: 'index.html',
        }),
        new webpack.BannerPlugin(() => {
            return `${info.name}, ${info.version}\n\n${fs.readFileSync('./LICENSE', 'utf-8')}`
        })
    ],
    module: {
        rules: [
            {
                test: /\.svg$/,
                loader: 'svg-inline-loader'

            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 25000,
                        },
                    },
                ]
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            }
        ]
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    output: {
        filename: "[name].min.js",
    },
};
