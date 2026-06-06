import { Routes, Route } from "react-router";
import "@/i18n";
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Report from "./pages/Report";
import PartnerReport from "./pages/PartnerReport";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <>
    <Toaster />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/report" element={<Report />} />
      <Route path="/partner-report" element={<PartnerReport />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
