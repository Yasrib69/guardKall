"use client"

import { AppProvider, useApp } from "@/lib/app-context"
import { LandingPage } from "@/components/landing-page"
import { AuthScreen } from "@/components/auth-screen"
import { Onboarding } from "@/components/onboarding"
import { SetupWizard } from "@/components/setup-wizard" // Import SetupWizard
import { RecentCallsDashboard } from "@/components/recent-calls-dashboard"
import { TranscriptDetail } from "@/components/transcript-detail"
import { SetupReview } from "@/components/setup-review" // Declare SetupReview

function AppContent() {
  const { currentScreen } = useApp()

  switch (currentScreen) {
    case "landing":
      return <LandingPage />
    case "auth":
      return <AuthScreen />
    case "onboarding":
      return <Onboarding />
    case "setup":
      return <SetupReview />
    case "dashboard":
      return <RecentCallsDashboard />
    case "transcript":
      return <TranscriptDetail />
    default:
      return <LandingPage />
  }
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
