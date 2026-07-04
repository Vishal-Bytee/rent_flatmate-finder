import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BrowseListings from "./pages/BrowseListings";
import ListingDetails from "./pages/ListingDetails";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import OwnerDashboard from "./pages/OwnerDashboard";
import TenantDashboard from "./pages/TenantDashboard";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/browse" element={<BrowseListings />} />
        <Route path="/listings/:id" element={<ListingDetails />} />

        <Route path="/listings/new" element={<ProtectedRoute allow={["OWNER"]}><CreateListing /></ProtectedRoute>} />
        <Route path="/listings/:id/edit" element={<ProtectedRoute allow={["OWNER"]}><EditListing /></ProtectedRoute>} />
        <Route path="/owner" element={<ProtectedRoute allow={["OWNER"]}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/tenant" element={<ProtectedRoute allow={["TENANT"]}><TenantDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allow={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/chat/:roomId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
