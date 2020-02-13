let path = require('path');
let htmlWebpackPlugin = require("html-webpack-plugin");
let miniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
module.exports = {
    entry:"./src/index.js",
    output:{
        filename:"bundle.js",
        path:path.resolve(__dirname,'./dist')
    },
    devServer:{
        port:3000,
        open:true,
        progress:true,
        contentBase:"./dist"
    },
    plugins:[
        new htmlWebpackPlugin({
            template:'./index.html',
            filename:"index.html"
        }),
        new miniCssExtractPlugin({
            filename:"main.css"
        }),
        new VueLoaderPlugin()
    ],
    module:{
        rules:[
            {
                test:/\.styl/,
                use:[
                    miniCssExtractPlugin.loader,
                    'css-loader',
                    'stylus-loader'
                ]
            },
            {
                test:/\.css/,
                use:[
                    'style-loader',
                    'css-loader',
                ]
            },
            {
                test:/\.(jpg|png|gif)$/,
                use:'url-loader?limit=19990'
            },
            {
                test:/\.vue$/,
                use:'vue-loader'
            }
        ]
    }
}