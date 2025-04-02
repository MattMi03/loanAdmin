import { defineStore } from 'pinia'

export const useLoginStore = defineStore('login', {
  state: () => ({
    isLoggedIn: false,
  }),
  actions: {
    setLoggedIn(status) {
      this.isLoggedIn = status
    },
  },
})
