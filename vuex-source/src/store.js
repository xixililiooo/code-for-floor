import Vue from 'vue';
import Vuex from './vuex';
Vue.use(Vuex);  //使用use的时候会调用库的install方法
export default new Vuex.Store({
    modules:{
        a:{
            state:{
                a:1
            },
            modules:{
                c:{
                    state:{
                        c:1
                    },
                    modules:{
                        d:{
                            state:{
                                d:1
                            }
                        }
                    },
                    mutations:{
                        changedeep(state,payload){
                            // console.log('深层执行');
                            // console.log(state);

                            state.c += payload
                        }
                    },
                    actions:{
                        actionChangeC({commit},payload){
                            setTimeout(()=>{
                                commit('changedeep',payload);
                            },3000)
                        }
                    }

                }
            },
            mutations:{
                syncAdd(){
                    console.log("同名执行");
                }
            }
        },
        b:{
            state:{
                b:2
            }
        }
    },
    state:{
        count:1
    },
    getters:{
        getCount(state){
            return state.count+1;
        }
    },
    mutations:{
        syncAdd(state,payload){
            state.count += payload;
        }
    },
    actions:{
        minusCount({commit,dispatch},payload){
            setTimeout(()=>{
                commit('syncAdd',payload);
            },2000)
        }
    }
})