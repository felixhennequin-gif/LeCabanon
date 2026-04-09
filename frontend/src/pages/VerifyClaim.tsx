import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { BadgeCheck, AlertCircle } from "lucide-react";

function VerifyClaimInner({ id, token }: { id: string; token: string }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/artisans/${id}/verify-claim`, {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Erreur de vérification");
      });
  }, [id, token]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Vérification échouée</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/artisans/${id}`)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm cursor-pointer"
          >
            Retour à la fiche
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 text-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <BadgeCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Fiche revendiquée !</h1>
        <p className="text-sm text-gray-500 mb-6">
          Vous pouvez maintenant personnaliser votre profil et répondre aux avis.
        </p>
        <button
          onClick={() => navigate(`/artisans/${id}`)}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm cursor-pointer"
        >
          Voir ma fiche
        </button>
      </div>
    </div>
  );
}

export function VerifyClaim() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!id || !token) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-sm text-gray-500">Ce lien de vérification est invalide.</p>
        </div>
      </div>
    );
  }

  return <VerifyClaimInner key={`${id}-${token}`} id={id} token={token} />;
}
