import VueRouter from './vue-router';  //VueRouter是一个构造函数
import Vue from 'vue';
import Home from '../views/home';
import About from '../views/about';
Vue.use(VueRouter);
export default new VueRouter({
    mode:'hash',
    routes:[
        {
            path:"/home",
            component:Home
        },
        {
            path:"/about",
            component:About
        }
    ]
});