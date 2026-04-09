import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Communities } from "./pages/Communities";
import { CommunityDetail } from "./pages/CommunityDetail";
import { EquipmentList } from "./pages/Equipment";
import { ArtisanList } from "./pages/Artisans";
import { ArtisanDetail } from "./pages/ArtisanDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<CommunityDetail />} />
            <Route path="/communities/:communityId/equipment" element={<EquipmentList />} />
            <Route path="/communities/:communityId/artisans" element={<ArtisanList />} />
            <Route path="/artisans/:id" element={<ArtisanDetail />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/communities" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
