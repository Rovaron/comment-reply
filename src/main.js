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
    selectedPageToken: '',
    keywordsSeparatedByComma: '',
    commentReplyText: '',
    user: {},
    logado: false,
    pageList: [],
    sendInboxMessage: true,
    postUrl: '',
    postId: '',
    commentList: []
  },

  firebase: {

  },

  localStorage: {
    token: ''
  },

  computed: {
    commentListWithKeyword () {
      let containKeyword = (comment) => this.keywordRegex.test(comment.message)
      return this.commentList.filter(containKeyword)
    },
    keywordRegex () {
      let keywordsNormalized = this.keywordsSeparatedByComma.replace(/\s/g, '').toLowerCase().replace(/,/g, '|')
      return new RegExp(keywordsNormalized)
    },
    commentsToReplyNumber () {
      return this.commentListWithKeyword.length()
    }
  },

  beforeCreate () {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        this.user = user
        let accessToken = this.$localStorage.get('token')
        axios.get('https://graph.facebook.com/me/accounts', {
          params: {
            fields: 'username,name,access_token',
            access_token: accessToken
          }
        }).then(
          (response) => {
            this.logado = true
            this.pageList = response.data.data
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
      provider.addScope('publish_actions')

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
      // TODO: NEEDS IMPROVEMENTS TO WORK WITH LINKS
      const replaceStringList = [
        'https',
        'http',
        '://',
        'www.',
        'facebook.com/'
      ]

      let isNumeric = (num) => (!isNaN(num) && num !== '')
      for (let i = 0; i < replaceStringList.length; i++) {
        url = url.replace(replaceStringList[i], '')
      }

      let urlSplited = url.split('/')
      console.log('splited', urlSplited)
      let _len = urlSplited.length
      let pageId = urlSplited[0]
      let postId = isNumeric(urlSplited[_len - 1]) ? urlSplited[_len - 1] : urlSplited[_len - 2]
      let selectedPage = this.pageList[this.selectedPage]
      this.selectedPageToken = selectedPage.access_token

      if (urlSplited[1] === 'posts' && !urlSplited[_len - 1].includes('_')) {
        postId = selectedPage.id + '_' + postId
      }

      if (pageId !== selectedPage.id && pageId !== selectedPage.username) {
        console.log('pages diferentes', pageId, selectedPage.id)
        console.log('pagedata', selectedPage)
      } else {
        this.postId = postId
        this.getCommentList(postId)
      }
    },

    getCommentList (postId) {
      let accessToken = this.$localStorage.get('token')
      axios.get('https://graph.facebook.com/' + postId + '/comments', {
        params: { access_token: accessToken }
      }).then(
        (response) => {
          this.commentList = response.data.data
          console.log('lista de comments', this.commentList)
        },
        (error) => {
          console.log('error', error)
        }
      )
    },

    commentResolved (comment) {
      let firstName = comment.from.name.split(' ')[0]
      let resolvedComment = this.commentReplyText.replace(/{nome}/g, firstName)
      return resolvedComment
    },

    replyComments () {
      let promises = []
      let token = this.selectedPageToken
      this.commentListWithKeyword.forEach((comment) => {
        let url = 'https://graph.facebook.com/' + comment.id + '/comments'
        let message = this.commentResolved(comment)
        promises.push(axios.post(url, {
          message: message, access_token: token
        }))
      })

      axios.all(promises).then((results) => {
        results.forEach((response, index) => {
          if (response.data.id) {
            let id = response.config.url.split('/')[3]
            // TODO store ID in firebase;
          } else {
            console.log('erro ao responder comentário', response)
          }
        })
      })
    },

    debugging () {
      console.log('comentarios com palavra chave', this.commentListWithKeyword)
      console.log('keywordList', this.keywordRegex)
      console.log('uid', this.user.uid)
      console.log('user', this.user)
      this.replyComments()
    }
  }
})
