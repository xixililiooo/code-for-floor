let Vue;  //Vue的构造函数

/*
    forEach函数主要目的是给定一个对象，然后给对象的每个属性都执行一次callback
*/
let forEach = (object,callback)=>{
    Object.keys(object).forEach(key=>{
        callback(key,object[key]);
    })
}
/*
    根据收集的模块来安装和合并
*/
let installModule = (store,state,path,rootModule)=>{
    /*
        把所有收集得到的module的getters都合并到根下
    */
   if(path.length>0){
       let parent = path.slice(0,-1).reduce((prestate,cur)=>{    
            return prestate[cur];
        },state)
        //由于state是通过新建vue实例实现监听的，但是合并的时候
        //新建的vue实例已经初始化完毕，直接新添加的数据没有办法实现监听
        //所以通过Vue.set来实现新添加到state的数据也能实现监听
        Vue.set(parent,path[path.length-1],rootModule.state);
   }
    let getters = rootModule._raw.getters;
    if(getters){
        forEach(getters,(getterName,fn)=>{
            Object.defineProperty( store.getters,getterName,{
                get(){
                    return fn(rootModule.state);
                }
            })
        })
    }
    /*
        把所有收集得到的module下的mutations进行合并
        为了实现发布订阅的原理，store中mutationName对应的
        value应该使用
        一个数组
    */
    let mutations = rootModule._raw.mutations;
    if(mutations){
        forEach(mutations,(mutationName,fn)=>{
            if(store.mutations[mutationName]){
                /*
                    因为mutaionName对应的函数
                    在不同模块时候的state不同
                    所以要在外面包裹一层函数来传入
                    rootModule.state
                */
                store.mutations[mutationName].push((payload)=>{
                    fn(rootModule.state,payload)
                });
            }else{
                store.mutations[mutationName] = [(payload)=>{
                    fn(rootModule.state,payload)
                }];
            }
        })
    }
    /*
        把所有收集得到的module下面的actions进行合并
    */
   let actions = rootModule._raw.actions;
   if(actions){
       forEach(actions,(actionName,fn)=>{
        if(store.actions[actionName]){
            store.actions[actionName].push(fn);
        }else{
            store.actions[actionName] = [fn];
        }
       })
   }
   forEach(rootModule._children,(moduleName,module)=>{
    //    console.log(module);
       installModule(store,state,path.concat(moduleName),module);
   })
}
/*
    用于收集模块的类
*/
class ModuleCollection{
    constructor(options){
        this.register([],options);
    }
    register(path,rootModule){
        let newModule = {
            _raw:rootModule,
            _children:{},
            state:rootModule.state
        }
        if(path.length==0){
            this.root = newModule;
        }else{
            let parent = path.slice(0,-1).reduce((root,item)=>{
                return root._children[item];
            },this.root)
            parent._children[path[path.length-1]] = newModule;
        }
        if(rootModule.modules){
            forEach(rootModule.modules,(moduleName,childModule)=>{
                this.register(path.concat(moduleName),childModule);
            })
        }
    }
}
class Store{   //Store的构造函数
    constructor(options){
        //保存传入的state
        this._s = new Vue({
            data:{
                state:options.state
            }
        })
        //把传入的getters存在实例上
        // let getters = options.getters || {};
        // this.getters = {};
        // forEach(getters,(getterName,fn)=>{
        //     Object.defineProperty(this.getters,getterName,{
        //         get:()=>{
        //             return fn(this.state)
        //         }
        //     })
        // })

        //传入的mutations保存到实例上
        // let mutations = options.mutations;
        // this.mutations = {};
        // forEach(mutations,(mutationName,fn)=>{
        //     this.mutations[mutationName] = fn;  
        // })

        //传入的actions保存在实例上
        // let actions = options.actions;
        // this.actions = {};
        // forEach(actions,(actionName,fn)=>{
        //     this.actions[actionName] = fn;
        // })

    /*
        用于模块划分,先将模块格式化
    */
        // let root = {
        //         _raw:rootModule,
        //         state:{},
        //         _children:{
        //             a:{
        //                 _row:aModule,
        //                 _children:{}
        //             },
        //             b:{
        //                 _raw:bModule,
        //                 _children:{}
        //             }
        //         }
        //     }

        this.getters = {};
        this.mutations = {};
        this.actions = {};
        /*
            ModuleCollection用于模块收集
        */
        this.module = new ModuleCollection(options);
        // console.log(this.module);
        /*
            收集完模块之后就根据模块进行安装
        */
        installModule(this,this.state,[],this.module.root);
    }

    /*
        用于触发mutations的commit函数
    */
    commit = (type,payload)=>{
        this.mutations[type].forEach(fn=>{
            fn(payload);
        }) 
    }

    /*
        用于触发action的dispatch函数
    */
   dispatch(type,payload){
        this.actions[type].forEach(fn=>{
            fn(this,payload);
        })
   }
    get state(){
        return this._s.state;
    }
}
//先渲染根组件再渲染子组件
const install  = (_Vue)=>{
    Vue = _Vue;
    //要使得所有的组件都可以使用store中的属性和方法
    //那就要把store实例挂载在所有组件上
    //可以通过mixin函数来实现
    Vue.mixin({
        beforeCreate() {
            if(this.$options && this.$options.store){
                this.$store = this.$options.store;
            }else{
                this.$store = this.$parent && this.$parent.$store
            }
        },
    })
}
export default {
    install,
    Store
}