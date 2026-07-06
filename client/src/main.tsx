import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import './i18n';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css';

dayjs.locale('zh-cn');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 分钟
    },
  },
});

import { useThemeStore } from './store/themeStore';

const themeTokens = {
  light: {
    token: {
      colorPrimary: '#FF6B35',
      colorSuccess: '#06D6A0',
      colorWarning: '#FFD166',
      colorError: '#EF476F',
      colorInfo: '#004E89',
      colorBgLayout: '#f7f8fc',
      colorBgContainer: '#ffffff',
      colorText: '#20242a',
      colorTextSecondary: '#667085',
      colorBorder: '#e8ecf3',
      borderRadius: 10,
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    components: {
      Button: {
        borderRadius: 999,
        controlHeightLG: 44,
      },
      Card: {
        borderRadiusLG: 20,
      },
      Menu: {
        itemBorderRadius: 999,
      },
    },
  },
  dark: {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#FF8A5C',
      colorSuccess: '#33E6B4',
      colorWarning: '#FFDC7A',
      colorError: '#FF6C8D',
      colorInfo: '#6BB7FF',
      colorBgLayout: '#0f141b',
      colorBgContainer: '#171e28',
      colorText: '#eef2f7',
      colorTextSecondary: '#b3bdca',
      colorBorder: '#273142',
      borderRadius: 10,
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    },
    components: {
      Button: {
        borderRadius: 999,
        controlHeightLG: 44,
      },
      Card: {
        borderRadiusLG: 20,
      },
      Menu: {
        itemBorderRadius: 999,
      },
    },
  },
};

function AppWithTheme() {
  const theme = useThemeStore((s) => s.theme);
  document.documentElement.dataset.theme = theme;

  return (
    <ConfigProvider locale={zhCN} theme={themeTokens[theme]}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppWithTheme />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
