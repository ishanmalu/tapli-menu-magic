import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eagerly load the homepage — it's the first thing users see
import Index from "./pages/Index";

// Lazy load all other pages so they are only downloaded when navigated to
const Auth          = lazy(() => import("./pages/Auth"));
const Dashboard     = lazy(() => import("./pages/Dashboard"));
const CustomerMenu  = lazy(() => import("./pages/CustomerMenu"));
const Pricing       = lazy(() => import("./pages/Pricing"));
const Upgrade       = lazy(() => import("./pages/Upgrade"));
const Contact       = lazy(() => import("./pages/Contact"));
const Why           = lazy(() => import("./pages/Why"));
const MealDetails   = lazy(() => import("./pages/MealDetails"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound      = lazy(() => import("./pages/NotFound"));

// Full-screen spinner shown while a lazy chunk loads
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"               element={<Index />} />
                    <Route path="/auth"           element={<Auth />} />
                    <Route path="/dashboard"      element={<Dashboard />} />
                    <Route path="/menu/:slug"     element={<CustomerMenu />} />
                    <Route path="/pricing"        element={<Pricing />} />
                    <Route path="/upgrade"        element={<Upgrade />} />
                    <Route path="/contact"        element={<Contact />} />
                    <Route path="/why"            element={<Why />} />
                    <Route path="/meal/:id"       element={<MealDetails />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="*"               element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
