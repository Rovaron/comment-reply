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
const db = firebase.initializeApp(config).database()

/* eslint-disable no-new */
new Vue({
  el: '#app',
  data: {
    selectedPage: '',
    currentPage: {},
    keywordsSeparatedByComma: '',
    commentReplyText: '',
    user: {},
    logado: false,
    pageList: [],
    sendInboxMessage: true,
    postUrl: '',
    postId: '',
    commentList: [],
    unregisteredCommentList: '',
    commentProgress: 0,
    registeredList: [],
    commentListWithKeyword: []
  },

  firebase: {
    pages: db.ref('pages')
  },

  localStorage: {
    token: ''
  },

  computed: {
    keywordRegex () {
      let keywordsNormalized = this.keywordsSeparatedByComma.replace(/\s/g, '').toLowerCase().replace(/,/g, '|')
      return new RegExp(keywordsNormalized)
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
      let _len = urlSplited.length
      let pageId = urlSplited[0]
      let postId = isNumeric(urlSplited[_len - 1]) ? urlSplited[_len - 1] : urlSplited[_len - 2]
      let selectedPage = this.pageList[this.selectedPage]
      this.currentPage = selectedPage

      if (urlSplited[1] === 'posts' && !urlSplited[_len - 1].includes('_')) {
        postId = selectedPage.id + '_' + postId
      }

      if (pageId !== selectedPage.id && pageId !== selectedPage.username) {
        console.log('pages diferentes', pageId, selectedPage.id)
        console.log('pagedata', selectedPage)
      } else {
        this.postId = postId
        this.getCommentList(postId).then(
          (response) => {
            this.commentList = response.data.data
            this.$bindAsArray('registeredList', this.$firebaseRefs.pages.child(this.currentPage.id + '/posts/' + this.postId))
          },
          (error) => {
            console.log('error', error)
          }
        )
      }
    },

    getCommentList (postId) {
      let accessToken = this.$localStorage.get('token')

      return axios.get('https://graph.facebook.com/' + postId + '/comments', {
        params: { access_token: accessToken }
      })
    },

    getCommentListWithKeyword () {
      console.log('executou comments sem registro', this.unregisteredCommentList)
      if (this.unregisteredCommentList.length > 0) {
        console.log('teste')
        let containKeyword = (comment) => this.keywordRegex.test(comment.message)
        this.commentListWithKeyword = this.unregisteredCommentList.filter(containKeyword)
        console.log('Lista a responder', this.commentListWithKeyword)
      } else {
        return false
      }
    },

    getUnregisteredCommentsList () {
      this.unregisteredCommentList = this.commentList.filter((obj) => {
        return !this.registeredList.some((obj2) => {
          return obj.id === obj2['.value']
        })
      })
      console.log('comentarios nao registrados', this.unregisteredCommentList)
    },

    commentResolved (comment) {
      let firstName = comment.from.name.split(' ')[0]
      let resolvedComment = this.commentReplyText.replace(/{nome}/g, firstName)
      return resolvedComment
    },

    replyComments () {
      let promises = []
      let token = this.currentPage.access_token
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
            this.registerComment(id)
          } else {
            console.log('erro ao responder comentário', response)
          }
        })
      })
    },

    registerComment (commentId) {
      this.$firebaseRefs.pages.child(this.currentPage.id).child('posts').child(this.postId).push(commentId)
    },

    debugging () {
      console.log('comentarios com palavra chave', this.commentListWithKeyword)
      this.replyComments()
    }
  },

  watch: {
    registeredList (list) {
      if (list.length > 0) {
        console.log('lista comentarios registrados', list)
        this.getUnregisteredCommentsList()
      }
    }
  }
})
