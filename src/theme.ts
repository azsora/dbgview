import { reactive, computed, watch, onMounted } from 'vue';

type Theme = 'light' | 'dark';

const themeState = reactive({
  systemTheme: 'light' as Theme,
  manualOverride: null as Theme | null,
});

const appliedTheme = computed(() => themeState.manualOverride ?? themeState.systemTheme);

// 监听系统主题变化
function initThemeListener() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // 初始化
  themeState.systemTheme = mediaQuery.matches ? 'dark' : 'light';

  // 监听变化
  mediaQuery.addEventListener('change', (e) => {
    themeState.systemTheme = e.matches ? 'dark' : 'light';
  });
}

function setManualTheme(theme: Theme | null) {
  themeState.manualOverride = theme;
}

function toggleTheme() {
  themeState.manualOverride = appliedTheme.value === 'dark' ? 'light' : 'dark';
}

// 应用主题到 document
watch(appliedTheme, (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
}, { immediate: true });

export const theme = {
  state: themeState,
  appliedTheme,
  initThemeListener,
  setManualTheme,
  toggleTheme,
};