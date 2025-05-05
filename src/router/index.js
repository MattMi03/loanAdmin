import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/manager', component: import('../views/Manager.vue'),
    children: [
      { path: 'home', component: import('../views/Home.vue'), },
      { path: 'user', component: import('../views/User.vue'), },
      { path: 'product', component: import('../views/Product.vue'), },
      { path: 'approve', component: import('../views/Approve.vue'), },
      { path: 'feedback', component: import('../views/Feedback.vue'), },
      { path: 'selfinfo', component: import('../views/SelfInfo.vue'), },
    ]
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    next()
  } else {
    next()
  }
})

export default router
