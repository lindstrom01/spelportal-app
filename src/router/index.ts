import { createRouter, createWebHistory } from 'vue-router'
import { gamePath, games } from '@/games/registry'
import HomeView from '@/views/HomeView.vue'

export const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Start' } },
  ...games
    .filter((g) => g.load)
    .map((g) => ({
      path: gamePath(g),
      name: g.id,
      component: g.load!,
      meta: { title: g.title },
    })),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Sidan finns inte' },
  },
]

export function createAppRouter(history = createWebHistory(import.meta.env.BASE_URL)) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (to) => (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
  })
  router.afterEach((to) => {
    document.title = `${String(to.meta.title ?? 'Spel')} – Spelportalen`
  })
  return router
}
