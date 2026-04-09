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
import { Profile } from "./pages/Profile";
import { UserProfile } from "./pages/UserProfile";
import { Members } from "./pages/Members";
import { CommunityAdmin } from "./pages/CommunityAdmin";
import { InvitationLanding } from "./pages/InvitationLanding";
import { Messages } from "./pages/Messages";
import { ArtisanPublicProfile } from "./pages/ArtisanPublicProfile";
import { VerifyClaim } from "./pages/VerifyClaim";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite/:token" element={<InvitationLanding />} />
          <Route path="/artisans/:id/public" element={<ArtisanPublicProfile />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:id" element={<CommunityDetail />} />
            <Route path="/communities/:id/admin" element={<CommunityAdmin />} />
            <Route path="/communities/:communityId/members" element={<Members />} />
            <Route path="/communities/:communityId/equipment" element={<EquipmentList />} />
            <Route path="/communities/:communityId/artisans" element={<ArtisanList />} />
            <Route path="/artisans/:id" element={<ArtisanDetail />} />
            <Route path="/artisans/:id/verify-claim" element={<VerifyClaim />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users/:id" element={<UserProfile />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/communities" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
