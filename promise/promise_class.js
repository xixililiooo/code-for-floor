    const PENDING = 'pending';
    const RESOLVED = 'resolved';
    const REJECTED = 'rejected';
    class Promise_self {
        constructor(excutor) {
            let self = this;
            self.status = PENDING;  //状态初始化为pending
            self.data = undefined;  //初始化数据为undefined
            self.callbacks = []; //存放回调函数

            /*
                resolve/reject函数做了以下的事情：
                1.状态只能改变一次，所以最开始的时候要判断状态
                2.状态改变成resolve,数据变成value
                3.如果回调函数的数组中有回调函数，就说明是先定义回调函数后改变状态，所以改变状态后要马上把回调函数放入消息队列
                4.放入消息队列是通过
                setTimeout实现的
            */
            function resolve(value) {
                if (self.status !== PENDING) return;
                self.status = RESOLVED;
                self.data = value;
                if (self.callbacks.length > 0) {
                    setTimeout(() => {
                        self.callbacks.forEach(callback => {
                            callback.onResolved(value);
                        })
                    })
                }
            }
            function reject(reason) {
                if (self.status !== PENDING) return;
                self.status = REJECTED;
                self.data = reason;
                if (self.callbacks.length > 0) {
                    setTimeout(() => {
                        self.callbacks.forEach(callback => {
                            callback.onRejected(reason);
                        })
                    })
                }
            }
            /*
                如果在执行excutor函数的时候报错，那就执行返回失败状态的promise
            */
            try {
                excutor(resolve, reject);
            } catch (error) {
                reject(error)
            }
        }
        /*
            then函数实现了以下的功能：
            1.then方法return了一个promise
            2.处理回调函数的默认值,实现异常穿透的关键
            3.return的promise的状态要根据回调函数的结果去处理,这部分的处理交给handle函数处理
            4.回调函数都要放入消息队列中
        */
        then(onResolved, onRejected) {
            let self = this;
            onResolved = typeof onResolved == 'function' ? onResolved : value => value;
            onRejected = typeof onRejected == 'function' ? onRejected : reason => { throw reason };
            return new Promise_self((resolve, reject) => {
                function handle(callback) {   //根据回调函数的结果去处理return的promise的状态
                    try {
                        let result = callback(self.data);
                        if (result instanceof Promise_self) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error);
                    }
                }
                if (self.status == PENDING) {
                    self.callbacks.push({
                        onResolved() {
                            handle(onResolved);
                        },
                        onRejected() {
                            handle(onRejected);
                        }
                    })
                } else if (self.status == RESOLVED) {
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
        catch(onRejected) {
            return this.then(undefined, onRejected);
        }
        /*
            resolve中value可以传普通的值，也可以传一个promise
            resolve返回一个成功状态的promise
        */
        static resolve = function (value) {
            return new Promise_self((resolve, reject) => {
                if (value instanceof Promise_self) {
                    value.then(resolve, reject);
                } else {
                    resolve(value);
                }
            })
        }
        /*
            reject返回了一个失败状态的promise
        */
        static reject = function (reason) {
            return new Promise_self((resolve, reject) => {
                reject(reason);
            })
        }

        /*
            all方法返回一个promise
            all方法传入一个数组，数组中可以存储promise，也可以存储普通值
            只有数组中所有Promise返回成功状态，all方法返回的promise才是成功状态，否则为失败状态
        */
        static all = function (promises) {
            let resolveCount = 0;
            let values = new Array(promises.length);
            return new Promise_self((resolve, reject) => {
                promises.forEach((p, index) => {
                    Promise_self.resolve(p).then(
                        value => {
                            ++resolveCount;
                            values[index] = value;
                            if (resolveCount == promises.length) {
                                resolve(values);
                            }
                        },
                        reason => {
                            reject(reason);
                        }
                    )
                })
            })
        }
        /*
            race方法返回一个promise
            同样传入一个数组，数组里元素可以是promise也可以不是。
            数组里面的Promise谁先完成的快，返回的Promise的状态就是谁
        */
        static race = function (promises) {
            return new Promise_self((resolve, reject) => {
                promises.forEach((p, index) => {
                    Promise_self.resolve(p).then(resolve, reject);
                })
            })
        }
        /*
            返回一个Promise，但是要固定时间后才改变状态为resolved
        */
        static resolveDelay = function (value, delay = 0) {
            return new Promise_self((resolve, reject) => {
                setTimeout(() => {
                    if (value instanceof Promise_self) {
                        value.then(resolve, reject);
                    } else {
                        resolve(value);
                    }
                }, delay)
            })
        }
        /*
            返回一个promise，但是要固定时间后才改变状态为rejected
        */
        static rejectDelay = function (reason, delay = 0) {
            return new Promise_self((resolve, reject) => {
                setTimeout(() => {
                    reject(reason);
                }, delay)
            })
        }
    }
