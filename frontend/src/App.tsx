import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { PublicMenuPage } from "@/pages/public/PublicMenuPage";
import { DashboardIndexPage } from "@/pages/dashboard/DashboardIndexPage";
import { RestaurantOverviewPage } from "@/pages/dashboard/RestaurantOverviewPage";
import { RestaurantDetailsPage } from "@/pages/dashboard/RestaurantDetailsPage";
import { CategoriesPage } from "@/pages/dashboard/CategoriesPage";
import { MenuItemsPage } from "@/pages/dashboard/MenuItemsPage";
import { QrCodePage } from "@/pages/dashboard/QrCodePage";
import { AnalyticsPage } from "@/pages/dashboard/AnalyticsPage";
import { BillingPage } from "@/pages/dashboard/BillingPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route path="/menu/:slug" element={<PublicMenuPage />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardIndexPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="restaurants/:restaurantId" element={<RestaurantOverviewPage />} />
              <Route path="restaurants/:restaurantId/details" element={<RestaurantDetailsPage />} />
              <Route path="restaurants/:restaurantId/categories" element={<CategoriesPage />} />
              <Route path="restaurants/:restaurantId/menu" element={<MenuItemsPage />} />
              <Route path="restaurants/:restaurantId/qr" element={<QrCodePage />} />
              <Route path="restaurants/:restaurantId/analytics" element={<AnalyticsPage />} />
            </Route>

            <Route path="*" element={<div className="p-10 text-center">Page not found</div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
