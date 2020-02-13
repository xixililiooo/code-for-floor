let Vue;
class History{
    constructor(){
        this.currentPath = null;
    }
}
class VueRouter{
    constructor(options){
        this.mode = options.mode || 'hash';
        this.routes = options.routes || [];
        this.routesMap = this.createMap(this.routes);
        // console.log(this.routesMap);
        this.history = new History();
        this.init();
    }
    init(){
        if(this.mode == 'hash'){
            console.log(location.hash);
            location.hash?'':location.hash = '/';
            window.addEventListener('load',()=>{
                this.history.currentPath = location.hash.slice(1);
            })
            window.addEventListener('hashchange',()=>{
                this.history.currentPath = location.hash.slice(1);
            })
        }else{
            location.pathname ? "" : location.pathname = "/";
            window.addEventListener('load',()=>{
                this.history.currentPath = location.pathname;
            })
            window.addEventListener('popstate',()=>{
                this.history.currentPath = location.pathname;
            })
        }
    }
    createMap(routes){
        return routes.reduce((pre,item)=>{
            pre[item.path] = item.component;
            return pre;
        },{})
    }
}
const install = (_Vue)=>{
    Vue = _Vue;
    Vue.mixin({
        beforeCreate() {
            if(this.$options && this.$options.router){
                this.$router = this.$options.router;
                Vue.util.defineReactive(this,'xxx',this.$router.history);
            }else{
                this.$router = this.$parent && this.$parent.$router;
            }
            Object.defineProperty(this,'$route',{
                get(){
                    return {
                        current:this.$router.history.currentPath
                    }
                }
            })
        },
    })
    Vue.component('router-link',{
        props:{
            to:String,
            tag:{
                type:String,
                default:'a'
            }
        },
        methods: {
            handleClick(){
                
            }
        },
        render(h) {
            return <this.tag on-click={this.handleClick} href={this.$router.mode == 'hash'?`#${this.to}`:this.to}>{this.$slots.default}</this.tag>
        },
    })
    Vue.component('router-view',{
        render(h) {
            let currentPath = this._self.$router.history.currentPath;
            console.log(currentPath);
            let routesMap = this._self.$router.routesMap;
            return h(routesMap[currentPath]);
        },
    })
}
VueRouter.install = install;
export default VueRouter