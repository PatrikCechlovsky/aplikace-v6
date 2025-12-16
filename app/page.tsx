// FILE: app/page.tsx
import React, { Suspense } from 'react'
import HomeClient from './HomeClient'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  )
}

