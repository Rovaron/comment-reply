// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
import firebase from 'firebase'
import VueFire from 'vuefire'
require('./stylus/index.styl')

Vue.use(VueMaterial)
Vue.use(VueFire)

Vue.material.registerTheme({
  default: {
    primary: 'blue',
    accent: 'red'
  },
  green: {
    primary: 'green',
    accent: 'pink'
  },
  orange: {
    primary: 'orange',
    accent: 'green'
  }
})
const config = {
  apiKey: 'AIzaSyAA-XStL2qvvMywnYthiqDwit6M1rULvmE',
  authDomain: 'eagle-comment-reply.firebaseapp.com',
  databaseURL: 'https://eagle-comment-reply.firebaseio.com',
  storageBucket: 'eagle-comment-reply.appspot.com',
  messagingSenderId: '919095980567'
}
const firebaseApp = firebase.initializeApp(config)
const db = firebaseApp.database()
console.log(db)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  data: {
    selectedPage: 'Escolha',
    sendInboxMessage: false,
    authData: ''
  },
  methods: {
    login () {
      window.alert('teste')
    }
  }
})
