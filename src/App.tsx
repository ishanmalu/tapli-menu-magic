import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CustomerMenu from "./pages/CustomerMenu";
import Pricing from "./pages/Pricing";
import Upgrade from "./pages/Upgrade";
import Contact from "./pages/Contact";
import Why from "./pages/Why";
import NotFound from "./pages/NotFound";
import MealDetails from "./pages/MealDetails";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/menu/:slug" element={<CustomerMenu />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/why" element={<Why />} />
                <Route path="/meal/:id" element={<MealDetails />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
