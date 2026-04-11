import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageRouter } from "./components/LanguageRouter";
import { ProtectedRoute } from "./components/ProtectedRoute";

function LangCatchAllRedirect() {
  const { lang = "fr" } = useParams<{ lang: string }>();
  return <Navigate to={`/${lang}/app`} replace />;
}

// Layouts
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { AuthLayout } from "./layouts/AuthLayout";

// Public pages
import { LandingPage } from "./pages/public/LandingPage";
import { FeaturesPage } from "./pages/public/FeaturesPage";
import { PricingPage } from "./pages/public/PricingPage";
import { AboutPage } from "./pages/public/AboutPage";

// Auth pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";

// App pages
import { Communities } from "./pages/Communities";
import { CommunityDetail } from "./pages/CommunityDetail";
import { EquipmentList } from "./pages/Equipment";
import { EquipmentDetail } from "./pages/EquipmentDetail";
import { ArtisanList } from "./pages/Artisans";
import { ArtisanDetail } from "./pages/ArtisanDetail";
import { Profile } from "./pages/Profile";
import { UserProfile } from "./pages/UserProfile";
import { Members } from "./pages/Members";
import { CommunityAdmin } from "./pages/CommunityAdmin";
import { Messages } from "./pages/Messages";
import { ArtisanPublicProfile } from "./pages/ArtisanPublicProfile";
import { VerifyClaim } from "./pages/VerifyClaim";
import { InvitationLanding } from "./pages/InvitationLanding";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirect root to default language */}
          <Route path="/" element={<Navigate to="/fr/" replace />} />

          {/* Routes with language prefix */}
          <Route path="/:lang" element={<LanguageRouter />}>

            {/* Public marketing — PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="fonctionnalites" element={<FeaturesPage />} />
              <Route path="tarifs" element={<PricingPage />} />
              <Route path="a-propos" element={<AboutPage />} />
            </Route>

            {/* Auth pages — AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Public pages without layout (standalone) */}
            <Route path="invite/:token" element={<InvitationLanding />} />
            <Route path="artisans/:id/public" element={<ArtisanPublicProfile />} />

            {/* Protected app routes — AppLayout */}
            <Route path="app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Communities />} />
              <Route path="communities/:id" element={<CommunityDetail />} />
              <Route path="communities/:id/admin" element={<CommunityAdmin />} />
              <Route path="communities/:communityId/members" element={<Members />} />
              <Route path="communities/:communityId/equipment" element={<EquipmentList />} />
              <Route path="equipment/:id" element={<EquipmentDetail />} />
              <Route path="communities/:communityId/artisans" element={<ArtisanList />} />
              <Route path="artisans/:id" element={<ArtisanDetail />} />
              <Route path="artisans/:id/verify-claim" element={<VerifyClaim />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:conversationId" element={<Messages />} />
              <Route path="profile" element={<Profile />} />
              <Route path="users/:id" element={<UserProfile />} />
            </Route>

            {/* Catch-all within lang — redirect to app */}
            <Route path="*" element={<LangCatchAllRedirect />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
