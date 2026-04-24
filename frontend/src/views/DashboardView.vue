<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 md:pl-14 pb-14 md:pb-0">
    <AppNavbar />

    <main class="max-w-6xl w-full mx-auto px-4 md:px-6 py-8">

    <!-- Header -->
    <div class="mb-8 flex items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h1 class="text-2xl font-black tracking-tight text-zinc-900 dark:text-white" style="font-family: 'DM Sans', 'Sora', sans-serif;">
            Dashboard
          </h1>
        </div>
        <p class="text-sm text-zinc-400 dark:text-zinc-500 font-mono">Métricas de conversaciones y agentes</p>
      </div>
      <button
        v-if="authStore.isAdmin || authStore.isSupervisor"
        @click="assistantOpen = true"
        class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors shadow-sm"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
        Asistente IA
      </button>
    </div>

    <!-- Date filters -->
    <div class="mb-6 flex flex-wrap items-center gap-2">
      <!-- Presets -->
      <button
        v-for="preset in presets"
        :key="preset.label"
        @click="applyPreset(preset)"
        class="px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all border"
        :class="activePreset === preset.label
          ? 'bg-brand-accent text-brand-primary border-brand-accent shadow-sm'
          : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-sky-400 hover:text-sky-500'"
      >
        {{ preset.label }}
      </button>

      <!-- Divider -->
      <span class="text-zinc-300 dark:text-zinc-700 select-none">|</span>

      <!-- Custom range -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <input
          type="date"
          v-model="customFrom"
          @change="applyCustomRange"
          class="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-mono"
        />
        <span class="text-zinc-400 text-xs">→</span>
        <input
          type="date"
          v-model="customTo"
          @change="applyCustomRange"
          class="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-mono"
        />
      </div>

      <!-- Refresh indicator -->
      <div v-if="statsStore.loading" class="ml-auto flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <span class="inline-block w-3 h-3 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        Actualizando...
      </div>
    </div>

    <!-- Error banner -->
    <div
      v-if="statsStore.error"
      class="mb-6 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 flex items-center gap-3"
    >
      <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
      </svg>
      <span class="text-sm text-red-600 dark:text-red-400">{{ statsStore.error }}</span>
    </div>

    <!-- Skeleton while loading first time -->
    <template v-if="statsStore.loading && !statsStore.data">
      <div class="grid grid-cols-2 gap-4 mb-5">
        <div v-for="i in 2" :key="i" class="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div v-for="i in 3" :key="i" class="h-28 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      </div>
      <div class="h-72 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-4" />
      <div class="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-4" />
      <div class="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-4" />
      <div class="h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
    </template>

    <!-- Data loaded -->
    <template v-if="statsStore.data">
      <!-- KPI: Por asignación -->
      <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-1">Por asignación</p>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Distribución actual de conversaciones según si tienen agente asignado o no.</p>
      <div class="grid grid-cols-2 gap-4 mb-5">
        <KpiCard
          label="Asignadas"
          :value="statsStore.data.kpis?.currentlyAssigned ?? 0"
          subtitle="Con agente asignado ahora mismo"
          color="blue"
        />
        <KpiCard
          label="Sin asignar"
          :value="statsStore.data.kpis?.currentlyUnassigned ?? 0"
          subtitle="Esperando asignación ahora mismo"
          color="amber"
        />
      </div>

      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-5">* Refleja la carga de trabajo actual del equipo. Solo se tienen en cuenta las conversaciones que siguen abiertas o pendientes, las ya cerradas no se incluyen.</p>

      <hr class="border-zinc-200 dark:border-zinc-800 my-6" />

      <!-- Sección: Por estado -->
      <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-1">Por estado</p>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Instantánea del estado actual de las conversaciones y su evolución durante el período seleccionado.</p>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- Donut: by status -->
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm p-5 flex flex-col min-h-[280px] lg:min-h-0">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-4">
            Conversaciones por estado
          </h3>
          <div v-if="donutChartData" class="flex-1 flex items-center justify-center min-h-0">
            <Doughnut :data="donutChartData" :options="donutOptions" />
          </div>
          <p v-else class="text-sm text-zinc-400 text-center py-10">Sin datos</p>
        </div>
        <!-- KPIs de estado apilados -->
        <div class="flex flex-col gap-4">
          <KpiCard
            label="Activas"
            :value="statsStore.data.kpis?.currentlyOpen ?? 0"
            subtitle="Conversaciones activas en este momento"
            color="green"
          />
          <KpiCard
            label="Pendientes"
            :value="statsStore.data.kpis?.currentlyPending ?? 0"
            subtitle="En espera de respuesta ahora mismo"
            color="orange"
          />
          <KpiCard
            label="Cerradas"
            :value="statsStore.data.kpis?.resolvedInPeriod ?? 0"
            subtitle="Cerradas en el período seleccionado"
            color="zinc"
          />
        </div>
      </div>

      <hr class="border-zinc-200 dark:border-zinc-800 my-6" />

      <!-- Sección: Por día -->
      <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-1">Por día</p>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Evolución diaria del volumen de conversaciones nuevas y mensajes intercambiados en el período seleccionado.</p>
      <div class="flex flex-col gap-4 mb-6">
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm p-5">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-4">
            Conversaciones nuevas por día
          </h3>
          <div v-if="lineChartData" class="h-48">
            <Line :data="lineChartData" :options="lineOptions" />
          </div>
          <p v-else class="text-sm text-zinc-400 text-center py-10">Sin datos</p>
        </div>
        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm p-5">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-4">
            Mensajes por día
          </h3>
          <div v-if="messagesLineData" class="h-48">
            <Line :data="messagesLineData" :options="messagesLineOptions" />
          </div>
          <p v-else class="text-sm text-zinc-400 text-center py-10">Sin datos</p>
        </div>
      </div>

      <hr class="border-zinc-200 dark:border-zinc-800 my-6" />

      <!-- Sección: Por usuario -->
      <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-1">Por usuario</p>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Carga de trabajo y actividad de cada miembro del equipo. Haz clic en un usuario para ver las conversaciones en las que ha participado durante el período.</p>
      <AgentTable
        :users="statsStore.data.byUser ?? []"
        @selectUser="selectedUser = $event"
      />

      <UserConversationsModal
        :user="selectedUser"
        :from="statsStore.from"
        :to="statsStore.to"
        @close="selectedUser = null"
      />

      <template v-if="labelStats">
        <hr class="border-zinc-200 dark:border-zinc-800 my-6" />

        <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono mb-1">Por etiqueta</p>
        <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Conversaciones categorizadas por etiqueta asignada.</p>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <KpiCard
            label="Con etiqueta"
            :value="labelStats.conversationsWithAnyLabel"
            subtitle="Conversaciones con 1 o más etiquetas"
            color="violet"
          />
          <KpiCard
            v-for="lk in labelStats.labelKpis"
            :key="lk.id"
            :label="lk.name"
            :value="lk.count"
            :subtitle="`Conversaciones con etiqueta ${lk.name}`"
            color="violet"
          />
        </div>

        <div class="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm p-5 mb-6">
          <div class="flex items-center justify-between mb-4 gap-3">
            <h3 class="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">
              Conversaciones por etiqueta
            </h3>
            <select
              v-model="labelStatusFilter"
              @change="fetchLabelStats(labelStatusFilter || null)"
              class="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-1 outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <option value="">Todas</option>
              <option value="OPEN">Abiertas</option>
              <option value="PENDING">Pendientes</option>
              <option value="CLOSED">Cerradas</option>
            </select>
          </div>
          <div v-if="labelDonutData" class="flex items-center justify-center" style="height: 280px;">
            <Doughnut :data="labelDonutData" :options="donutOptions" />
          </div>
          <p v-else class="text-sm text-zinc-400 text-center py-10">Sin datos de etiquetas</p>
        </div>
      </template>
    </template>

      <AssistantPanel :isOpen="assistantOpen" @close="assistantOpen = false" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AssistantPanel from '../components/dashboard/AssistantPanel.vue'
import { useAuthStore } from '../stores/auth.js'
import UserConversationsModal from '../components/dashboard/UserConversationsModal.vue'
import { Chart, registerables } from 'chart.js'
import { Doughnut, Line } from 'vue-chartjs'

import { useStatsStore } from '../stores/stats.js'
import AppNavbar from '../components/layout/AppNavbar.vue'
import { isoToDisplay } from '../utils/userFormatting.js'
import KpiCard from '../components/dashboard/KpiCard.vue'
import AgentTable from '../components/dashboard/AgentTable.vue'
import api from '@/api/axios.js'

Chart.register(...registerables)

const statsStore = useStatsStore()
const authStore = useAuthStore()
const assistantOpen = ref(false)

const selectedUser = ref(null)
const labelStats = ref(null)
const labelStatusFilter = ref('')

async function fetchLabelStats(status = null) {
  try {
    const res = await api.get('/stats/labels', { params: status ? { status } : {} })
    labelStats.value = res.data
  } catch (err) {
    console.error('[dashboard] label stats error:', err.response?.data ?? err.message)
  }
}

const labelDonutData = computed(() => {
  const kpis = labelStats.value?.labelKpis
  if (!kpis || kpis.length === 0) return null
  return {
    labels: kpis.map((k) => k.name),
    datasets: [{
      data: kpis.map((k) => k.count),
      backgroundColor: kpis.map((k) => k.color),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }
})

// ---------- Date helpers ----------
function toISO(d) {
  return d.toISOString().split('T')[0]
}

const today = new Date()
const customFrom = ref(toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30)))
const customTo   = ref(toISO(today))
const activePreset = ref('30 días')

const presets = [
  {
    label: 'Hoy',
    getRange() {
      const t = new Date()
      return { from: toISO(t), to: toISO(t) }
    },
  },
  {
    label: '7 días',
    getRange() {
      const t = new Date()
      const f = new Date(); f.setDate(f.getDate() - 7)
      return { from: toISO(f), to: toISO(t) }
    },
  },
  {
    label: '30 días',
    getRange() {
      const t = new Date()
      const f = new Date(); f.setDate(f.getDate() - 30)
      return { from: toISO(f), to: toISO(t) }
    },
  },
]

function applyPreset(preset) {
  activePreset.value = preset.label
  const { from, to } = preset.getRange()
  customFrom.value = from
  customTo.value = to
  statsStore.setRange(from, to)
}

function applyCustomRange() {
  if (!customFrom.value || !customTo.value) return
  if (customFrom.value > customTo.value) return
  activePreset.value = ''
  statsStore.setRange(customFrom.value, customTo.value)
}

// ---------- Chart data ----------
const isDark = computed(() => document.documentElement.classList.contains('dark'))

const STATUS_COLORS = { OPEN: '#22c55e', PENDING: '#f97316', CLOSED: '#6b7280' }

const donutChartData = computed(() => {
  const byStatus = statsStore.data?.byStatus
  if (!byStatus || byStatus.length === 0) return null
  return {
    labels: byStatus.map(s => s.status),
    datasets: [{
      data: byStatus.map(s => s.count),
      backgroundColor: byStatus.map(s => STATUS_COLORS[s.status] ?? '#94a3b8'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }
})

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { family: 'monospace', size: 11 },
        color: '#94a3b8',
        boxWidth: 10,
        padding: 14,
      },
    },
    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } },
  },
}

const lineChartData = computed(() => {
  const cpd = statsStore.data?.conversationsPerDay
  if (!cpd || cpd.length === 0) return null
  return {
    labels: cpd.map(d => isoToDisplay(d.date)),
    datasets: [{
      label: 'Conversaciones',
      data: cpd.map(d => d.count),
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56,189,248,0.12)',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.35,
    }],
  }
})

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      ticks: { font: { family: 'monospace', size: 10 }, color: '#94a3b8', maxRotation: 45, maxTicksLimit: 7 },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      ticks: { font: { family: 'monospace', size: 10 }, color: '#94a3b8', stepSize: 1 },
      beginAtZero: true,
    },
  },
}

function fillDays(fromISO, toISO, dataByDate) {
  const result = []
  const current = new Date(fromISO)
  const end = new Date(toISO)
  current.setUTCHours(0, 0, 0, 0)
  end.setUTCHours(23, 59, 59, 999)
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    result.push(dataByDate[dateStr] ?? { date: dateStr, IN: 0, OUT: 0 })
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return result
}

const messagesLineData = computed(() => {
  const mpd = statsStore.data?.messagesPerDay
  const fromISO = statsStore.data?.from
  const toISO = statsStore.data?.to
  if (!mpd || !fromISO || !toISO) return null

  const dataByDate = {}
  for (const d of mpd) dataByDate[d.date] = d
  const filled = fillDays(fromISO, toISO, dataByDate)

  return {
    labels: filled.map(d => isoToDisplay(d.date)),
    datasets: [
      {
        label: 'Entrantes',
        data: filled.map(d => d.IN),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Salientes',
        data: filled.map(d => d.OUT),
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.08)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
      },
    ],
  }
})

const messagesLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { family: 'monospace', size: 11 },
        color: '#94a3b8',
        boxWidth: 10,
        padding: 14,
      },
    },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      ticks: { font: { family: 'monospace', size: 10 }, color: '#94a3b8', maxRotation: 45, maxTicksLimit: 7 },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.1)' },
      ticks: { font: { family: 'monospace', size: 10 }, color: '#94a3b8', stepSize: 1 },
      beginAtZero: true,
    },
  },
}

// ---------- Lifecycle ----------
onMounted(() => {
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - 30)
  statsStore.setRange(toISO(fromDate), toISO(toDate))
  statsStore.startPolling(60000)
  fetchLabelStats()
})

onUnmounted(() => statsStore.stopPolling())
</script>
