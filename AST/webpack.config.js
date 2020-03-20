const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry:"./src/index.js",
    output:{
        path:path.resolve(__dirname,"./dist"),
        filename:"bundle.js"
    },
    devServer:{
        port:3000,
        open:true,
        contentBase:"./dist"
    },
    plugins:[
        new htmlWebpackPlugin({
            template:"./index.html",
            filename:"index.html"
        })
    ],
    module:{
        rules:[

        ]
    }
}