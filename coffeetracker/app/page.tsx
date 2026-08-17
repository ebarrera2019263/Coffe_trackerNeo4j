import { Suspense } from 'react'
import CafeteriasView from '@/components/CafeteriasView'
import HomeHero from '@/components/HomeHero'
import Topbar from '@/components/Topbar'
import CoffeeLoader from '@/components/CoffeeLoader'

export default function HomePage() {
  return (
    <>
      <Topbar title="Coffee Shops" subtitle="Discover the origin of your coffee" />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <HomeHero />
        <Suspense fallback={<CoffeeLoader text="Loading coffee shops…" />}>
          <CafeteriasView />
        </Suspense>
      </div>
    </>
  )
}
