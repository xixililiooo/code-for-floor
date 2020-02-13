import './css/index.styl'
import App from './App.vue'
import {createElement as h,render} from './createElement'  
//创建虚拟节点以及把虚拟节点渲染成真实dom并挂载到页面的函数
import Diff from './diff'  
//diff算法更新补丁
import patch from './patch'
//根据diff算法得到的补丁去更新dom
let vDom1 = h('ul',{class:'list'},[
    h('li',{class:"item",group:"1"},['a']),
    h('li',{class:"item"},['b']),
    h('li',{class:"item"},['c']),
    "a",
    "999"
])
let vDom2 = h('ul',{class:'list-group'},[
    h('li',{class:"item1",style:{color:'red'}},['a']),
    h('li',{class:"item"},['2']),
    h('div',{class:"item"},['c']),
])
//Dom Diff用于比较两个虚拟dom的区别，比较两个对象的区别
// Dom Diff作用，根据两个虚拟对象创建出来一个补丁，描述改变的内容，这个补丁用于更新dom
//通过js层面的计算，返回一个patch对象

/*
            差异计算
    1.用js对象模拟虚拟dom
    2.把虚拟dom转换成真实的dom并挂载到页面
    3.如果有事件发生修改了虚拟dom，比较两颗虚拟dom树的差异，得到补丁对象patch
    4.把补丁对象应用到真正的dom树上
*/
console.log(vDom1);
let patches = Diff(vDom1,vDom2)
console.log(patches);
let domElement  = render(vDom1,app);
console.log(domElement);
patch(domElement,patches);
let v = {
    type:"ul",
    props:{class:"list-group"},
    children:[
        {
            type:"li",
            props:{class:"item1",style:{color:"red"}},
            children:["a"]
        },
        {
            type:"li",
            props:{class:"item"},
            children:["2"]
        },
        {
            type:"div",
            props:{class:"item"},
            children:["c"]
        }
    ]
}