import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Warehouse, Users, AlertTriangle } from "lucide-react";

interface InviteInfo {
  communityName: string;
  communityDescription?: string;
  createdByName: string;
  expiresAt: string;
}

export function InvitationLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (token) {
      api<InviteInfo>(`/invite/${token}`, { skipAuth: true })
        .then(setInfo)
        .catch((err) => setError(err instanceof Error ? err.message : "Lien invalide"))
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Invitation invalide</h1>
          <p className="text-gray-500 mb-6">{error || "Ce lien d'invitation a expiré ou n'est plus valide."}</p>
          <Link to="/communities" className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 no-underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  async function handleJoin() {
    setJoining(true);
    setJoinError("");
    try {
      const result = await api<{ communityId: string }>(`/invite/${token}/join`, { method: "POST" });
      navigate(`/communities/${result.communityId}`, { replace: true });
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Erreur lors de la tentative de rejoindre");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Warehouse className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Vous êtes invité à rejoindre</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{info.communityName}</h1>
          {info.communityDescription && (
            <p className="text-gray-500 text-sm mb-4">{info.communityDescription}</p>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-6">
            <Users className="w-3.5 h-3.5" />
            Invitation de {info.createdByName}
          </div>

          {joinError && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{joinError}</div>
          )}

          {user ? (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
            >
              {joining ? "..." : "Rejoindre la communauté"}
            </button>
          ) : (
            <Link
              to={`/login?redirect=/invite/${token}`}
              className="block w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 no-underline text-center"
            >
              Se connecter pour rejoindre
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
