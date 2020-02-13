<template>
  <div id="app">
    hello
    <router-link to="/home">home</router-link>
    <router-link to="/about">about</router-link>
    <router-view />
    </div>
</template>

<script>
export default {
  name: 'App',
  methods:{
    // changedeep1(){
    //   console.log('执行');
    //   this.$store.commit('changedeep',10);
    // },
    // changedeep2(){
    //   this.$store.dispatch('actionChangeC',40);
    // },
    // addCount(){
    //   this.$store.commit('syncAdd',100);
    // },
    // minusCount(){
    //   this.$store.dispatch('minusCount',50)
    // }
  },
  mounted(){

  }

}
</script>
