import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Knowledge from '../views/Knowledge.vue'
import Simulation from '../views/Simulation.vue'
import Insights from '../views/Insights.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/knowledge', name: 'Knowledge', component: Knowledge },
  { path: '/simulation', name: 'Simulation', component: Simulation },
  { path: '/insights', name: 'Insights', component: Insights },
]

const router = createRouter({
  history: createWebHistory('/electricity-trading-dashboard/'),
  routes,
})

export default router
