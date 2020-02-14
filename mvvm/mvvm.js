class Dep{
    constructor(){
        this.subs = [];
    }
    addSub(watcher){  //添加watcher
        this.subs.push(watcher);
    }
    notify(){  //发布
        this.subs.forEach(water=>water.update());
    }
}
class Watcher{    //观察订阅者模式
    constructor(vm,expr,cb){
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.oldValue = this.get();   //创建Watcher的时候回调用数据劫持的get()方法
    }
    get(){
        Dep.target = this;   //先自己设置成target
        let value = CompileUtil.getValue(this.expr,this.vm);   //获取值，触发数据劫持的get()方法
        Dep.target = null; //再把tatget设置成Null
        return value;
    }
    update(){   //更新操作，数据变化之后，调用观察者的update方法
        let newValue = CompileUtil.getValue(this.expr,this.vm);
        if(newValue!=this.oldValue){
            this.cb(newValue);
        }
    }
}
class Compiler{
    constructor(el,vm){
        //判断传入的el是不是元素节点，如果不是元素节点就通过dom操作获取元素节点
        this.el = this.isElementNode(el)?el:document.querySelector(el);
        this.vm = vm;
        //把节点下的元素放入内存中处理
        let fragment = this.nodeToFragment(this.el);
        // console.log(fragment);

        //在内存中编译模板
        this.compiler(fragment);

        //把编译好的内容从内存中塞回元素节点中
        this.el.appendChild(fragment);
    }
    isDirective(attrName){   //判断属性是否是指令
        return attrName.startsWith("v-");
    }
    compilerElement(node){  //用于编译元素节点,其实就是检查元素的属性中是否有v-开头的属性
        //先获取节点下的所有属性
        let attributes = node.attributes;
        [...attributes].forEach(attr=>{   //每一项attr都是key-value的形式
            let {name,value:expr} = attr;   //  v-model = "person.name"
            // console.log(name,value);
            if(this.isDirective(name)){  //如果属性是指令 v-model  v-html  v-bind
                // console.log(name,value);
                let [,direactName]  = name.split("-");   //获得指令的类型,到底是v-mode还是V-html
                CompileUtil[direactName](node,expr,this.vm)   //根据expr去实例的data中获取expr的值，赋值到node中
            }
        })
    }
    compilerText(node){  //用于编译文本节点,其实就是检查文本中是否存在{{******}}
            let content = node.nodeValue;
            // console.log(node.nodeName,content);
            if(/\{\{(.+?)\}\}/.test(content)){
                // console.log(content);
                CompileUtil['text'](node,content,this.vm)
            }
    }
    compiler(fragment){  //把内存中的元素进行编译
        let children = fragment.childNodes;
        [...children].forEach(child=>{
                            //编译的时候分成元素节点和文本节点
                if(this.isElementNode(child)){  //如果是元素节点
                    this.compilerElement(child); //对元素本身要编译
                    this.compiler(child); //对元素下的子节点也要编译
                }else{ //如果是文本节点
                    this.compilerText(child);
                }
        })
    }
    nodeToFragment(el){
        let fragment = document.createDocumentFragment();   //创建文档碎片
        let firstChild;  //元素下的第一个孩子节点，包括空白文本
        while(firstChild = el.firstChild){
            fragment.appendChild(firstChild);  //appendChild添加子节点的时候，如果要添加的元素已经在dom树中存在，那么，
            //添加的子节点并不会复制，而且移动子节点，也就是说子节点不存在原来的位置，而存在于添加的位置
        }
        return fragment;
    }
    isElementNode(el){  //判断是否是元素节点
        return el.nodeType===1;  
    }
}
CompileUtil = {   //编译的工具类
    getValue(expr,vm){    //根据expr去data中取值,expr: "person.name"
    return expr.split(".").reduce((data,cur)=>{  //使用reducer函数来连续取值
        return data[cur];
    },vm.$data);
    },
    setValue(vm,expr,value){   
        expr.split(".").reduce((data,cur,index,arr)=>{  //使用reducer函数来连续取值
            if(index == arr.length-1){
                data[cur] = value;
            }
            return data[cur];
        },vm.$data);
    },
    model(node,expr,vm){ //node是节点，expr是v-model的表达式，vm是实例
    //使用getValue获取expr对应的值
    //使用对应的updater来更新值
    let modelUpdater = this.updater['modelUpdater'];
    new Watcher(vm,expr,(newValue)=>{  //给输入框添加一个观察者，如果数据有变化，会更新视图
        modelUpdater(node,newValue);
    })
    node.addEventListener("input",(e)=>{
        let value = e.target.value;
        this.setValue(vm,expr,value);
    })
    let value = this.getValue(expr,vm);
    modelUpdater(node,value);
    },
    html(){

    },
    getContentValue(vm,expr){  //随便一个数据更新就把整个表达式都取一遍
        return expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{  
            return this.getValue(args[1],vm);
        })
    },
    text(node,expr,vm){
            let textUpdater = this.updater['textUpdater'];
            let value = expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{  
                new Watcher(vm,args[1],(newValue)=>{   //给每个数据都添加watcher
                    textUpdater(node,this.getContentValue(vm,expr));  
                })
                return this.getValue(args[1],vm);
            })
            textUpdater(node,value);
    },
    updater:{  //更新
        modelUpdater(node,value){
            node.value = value;
        },
        htmlUpdater(){

        },
        textUpdater(node,value){
            node.nodeValue = value;
        }
    } 
}
class Observer{
    constructor(data){
        this.observer(data);
    }
    observer(data){  //给实例中的data每一项都进行数据劫持
        if(data && typeof data =="object"){  //如果不为空且data是对象才进行数据劫持
            for(let key in data){ 
                this.definePro(data,key,data[key]);
            }
        }
    }
    definePro(obj,key,value){  //用于数据劫持的函数
        this.observer(value); //深层 数据劫持
        let dep = new Dep();  //给每个数据都加一个订阅器，订阅器里面存着关联着数据的观察者，一旦数据发生变化，执行
        //观察者的更新函数
        Object.defineProperty(obj,key,{
            get(){
                //创建watcher时
                Dep.target && dep.subs.push(Dep.target);
                return value;
            },
            set:(newValue)=>{
                if(value!=newValue){  //数据更新才执行相应逻辑
                    this.observer(newValue);  //如果新的赋值为一个对象，也对赋值后的对象进行数据劫持
                    value = newValue;
                    dep.notify();
                }
            }
        })
    }
}
class Vue{
    constructor({el,data,computed}){
        this.$el = el;
        this.$data =  data;
       console.log(computed);
        if(this.$el){
            new Observer(this.$data);  //创建了vue实例之后，先对实例的data进行数据劫持
            
             //{{sayHello}} 按照reduce函数的取值，它会取 vm.$data.sayHello，但实质上sayHello不是data中的属性
             //所以这里需要设置代理
            for(let key in computed){
                Object.defineProperty(this.$data,key,{
                    get:()=>{
                        return computed[key].call(this);
                    }
                })
            }
            this.proxyVm(this.$data);
            new Compiler(this.$el,this); //然后再编译模板
        }
    }
    proxyVm(data){
        for(let key in data){
            Object.defineProperty(this,key,{
                get(){
                    return data[key];
                }
            })
        }
    }
}