"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import AssetDetailPage from "@/components/pages/assets/asset-detail-page";

export default function AssetDetail() {
  return (
    <DashboardLayout>
      <AssetDetailPage />
    </DashboardLayout>
  );
}
