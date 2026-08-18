import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AppRouter } from '@/app/router'
import { ThemeModeSync } from '@/shared/components/ThemeModeSync'
import { FtthPrimeReactProvider } from '@/shared/providers/FtthPrimeReactProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <FtthPrimeReactProvider>
          <ThemeModeSync />
          <AppRouter />
        </FtthPrimeReactProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
