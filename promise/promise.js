(function (window) {
    const PENDING = 'pending';
    const RESOLVED = 'resolved';
    const REJECTED = 'rejected';
    function Promise_self(excutor) {
        this.status = PENDING;
        this.data = "";
        this.callbacks = [];
        let self = this;
        function resolve(value) {
            //改变状态为resolved
            //保存value数据
            //如果有等待执行的callback，那就先执行那些回调函数
            if (self.status !== PENDING) {   //如果Promise的状态不为pending，那就说明已经改变了，直接跳过
                return;
            }
            self.status = RESOLVED;   //把状态改变成resoved
            self.data = value;  //把数据改成传递的value
            if (self.callbacks.length > 0) {   //如果存放的数组中有回调函数
                //那就说明是先定义函数后改变状态
                setTimeout(() => {   //要把回调函数放入消息队列中
                    self.callbacks.forEach(callback => {
                        callback.onResolved(value)
                    })
                })
            }
        }
        function reject(reason) {
            if (self.status !== PENDING) {
                return;
            }
            self.status = REJECTED;
            self.data = reason;
            if (self.callbacks.length > 0) {
                setTimeout(() => {
                    self.callbacks.forEach(callback => {
                        callback.onRejected(reason)
                    })
                })
            }
        }
        try {
            excutor(resolve, reject);
        } catch (error) {   //如果执行者执行出错，那就直接把promise的状态改成rejected
            reject(error);
        }
    }

    /*
        promise的then方法做了以下的事情：
        1. then方法return了一个promise
        2. 指定两个回调函数的默认值（只要不是函数就指定一个默认函数）
        3. 要么保存回调函数要么执行回调函数，但是回调函数都要放入消息队列中
        4. 根据回调函数的值来决定return的promise的状态
    */
    Promise_self.prototype.then = function (onResolved, onRejected) {
        let self = this;
        //向后传递value
        onResolved = typeof onResolved == 'function' ? onResolved : value => value;

        //实现异常穿透的关键
        onRejected = typeof onRejected == 'function' ? onRejected : reason => { throw reason };
        return new Promise_self((resolve, reject) => {

            function handle(callback) {    //根据回调函数返回的情况来改变return的Promise的状态
                /*
                       1.如果抛出异常，return的promise就会失败，reason就是error
                       2.如果回调函数返回的是不是promise,promise就会resolve，value就是return的值
                       3.如果回调函数返回的是Promise，下一个Promise的值就根据下一个promise执行的结果
   
                   */
                try {
                    let result = callback(self.data);  //先获得回调函数的返回值    
                    if (result instanceof Promise_self) {  //如果返回值是一个promise
                        result.then(   //那就是返回的promise的值决定了return的promise的状态
                            value => {   //返回的promise是resolved状态那就把return的promise的状态改成resolved
                                resolve(value);
                            },
                            reason => {
                                reject(reason);
                            }
                        )
                    } else {   //如果返回值不是一个promise，而是一个普通的返回值
                        //那就直接把状态改成resolved，而且value就是普通的返回值
                        resolve(result);
                    }
                } catch (error) {   //如果抛出错误，那就直接把状态改成rejected,reason就是error的值
                    reject(error);
                }

            }
            if (self.status == PENDING) {    //如果是先定义回调函数然后再改变状态的话，因为回调函数放入
                //消息队列中是再改变状态的函数中操作的，但是也要对return的promise的状态进行改变，所以先保存起来
                self.callbacks.push({
                    onResolved() {
                        handle(onResolved);
                    },
                    onRejected() {
                        handle(onRejected);
                    }
                })
            } else if (self.status == RESOLVED) {   //如果是先改变状态且状态是resolved然后定义回调函数，就直接执行回调函数
                //但同样回调函数也要改变then方法return的promise的状态
                setTimeout(() => {
                    handle(onResolved);
                })
            } else {
                setTimeout(() => {
                    handle(onRejected);
                })
            }
        })
    }
    Promise_self.prototype.catch = function (onRejected) {
        return this.then(undefined, onRejected);
    }
    Promise_self.resolve = function (value) {
        return new Promise_self((resolve,reject)=>{
            if(value instanceof Promise_self){
                value.then(
                    resolve,
                    reject
                )
            }else{
                resolve(value);
            }
        })
    }
    Promise_self.reject = function (reason) {
        return new Promise_self((resolve,reject)=>{
            reject(reason);
        })
    }
    Promise_self.all = function(promises){   //all方法只要有一个promise是失败状态那就失败状态
        let values = new Array(promises.length);
        let resolveCount = 0;
        return new Promise_self((resolve,reject)=>{
            promises.forEach((p,index)=>{   //把promises数组的promise都执行
                Promise_self.resolve(p).then( 
                    value=>{
                        ++resolveCount;    //结果数组是按照原来promise的存放顺序，不是谁先就放谁
                        values[index] = value;
                        if(resolveCount == promises.length){   //全部promise成功才返回成功状态的promise
                            resolve(values);
                        }
                    },
                    reason=>{   //只要有一个是失败的，那就返回失败状态的promise
                        reject(reason);
                    }
                )
            })
        })
    }
    Promise_self.race = function(promises){  //promises里面还支持存放非promise的
        return new Promise_self((resolve,reject)=>{
            promises.forEach((p,index)=>{
                Promise_self.resolve(p).then(   //如果是非promise，那就加多一层promise封装起来
                    value=>{
                        resolve(value);
                    },
                    reason=>{
                        reject(reason);
                    }
                )
            })
        })
    }
    /*
        返回一个promise对象，它再指定时间后才改变状态为成功状态
    */
    Promise_self.resolveDelay = function(value,time){
        return new Promise_self((resolve,reject)=>{
            setTimeout(()=>{
                if(value instanceof Promise_self){
                    value.then(
                        resolve,
                        reject
                    )
                }else{
                    resolve(value);
                }
            },time)
        })
    }
    /*
        返回一个promise,指定时间后这状态改变为失败状态
    */
    Promise_self.rejectDelay = function(reason,time){
        return new Promise_self((resolve,reject)=>{
            setTimeout(()=>{
                reject(reason);
            },time)
        })
    }
    window.Promise_self = Promise_self;
})(window)
