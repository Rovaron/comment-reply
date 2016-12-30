// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
import firebase from 'firebase'
import VueFire from 'vuefire'
import axios from 'axios'
import VueLocalStorage from 'vue-localstorage'
require('./stylus/index.styl')

Vue.use(VueMaterial)
Vue.use(VueFire)
Vue.use(VueLocalStorage)

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
const firebaseApp = firebase.initializeApp(config).database()
console.log('app', firebaseApp)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  data: {
    selectedPage: '',
    user: {},
    logado: false,
    pageList: [],
    sendInboxMessage: true,
    postUrl: '',
    postId: ''
  },
  localStorage: {
    token: ''
  },
  beforeCreate () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        // const vm = this
        this.user = user
        let accessToken = this.$localStorage.get('token')
        axios.get('https://graph.facebook.com/me', {
          params: {
            fields: 'accounts',
            access_token: accessToken
          }
        }).then(
          (response) => {
            this.logado = true
            this.pageList = response.data.accounts.data
            console.log('pages', this.pageList)
          },
          (error) => {
            console.log('erro pages', error)
          })
      } else {
        this.login()
      }
    }.bind(this))
  },
  methods: {
    login () {
      const provider = new firebase.auth.FacebookAuthProvider()
      provider.addScope('manage_pages')
      provider.addScope('publish_pages')
      provider.addScope('pages_messaging')

      firebase.auth().signInWithPopup(provider).then(
        (result) => {
          let token = result.credential.accessToken
          this.$localStorage.set('token', token)
        },
        (error) => {
          console.log('error:', error)
        }
      )
    },

    discoverPostId (url) {
      const replaceStringList = [
        'https',
        'http',
        '://',
        'www.',
        'facebook.com/'
      ]

      for (let i = 0; i < replaceStringList.length; i++) {
        url = url.replace(replaceStringList[i], '')
      }

      let urlSplited = url.split('/')
      let pageId = urlSplited[0]
      let postId = urlSplited[3]
      let selectedPageId = this.pageList[this.selectedPage].id

      if (pageId !== selectedPageId) {
        console.log('pages diferentes', pageId, selectedPageId)
      } else {
        this.postId = postId
      }
    }
  }
})
