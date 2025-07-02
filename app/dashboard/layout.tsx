import type React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
