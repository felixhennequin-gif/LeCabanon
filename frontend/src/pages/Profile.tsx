import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Check, Package } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface CommunityItem {
  id: string;
  name: string;
  role: string;
  memberCount: number;
}

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  communityId: string;
  ownerId: string;
}

interface CommunityWithEquipment extends CommunityItem {
  equipment: EquipmentItem[];
}

export function Profile() {
  const { user, updateUser } = useAuth();
  const [communities, setCommunities] = useState<CommunityWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" },
  });

  useEffect(() => {
    async function load() {
      try {
        const comms = await api<CommunityItem[]>("/communities");
        const withEquipment = await Promise.all(
          comms.map(async (c) => {
            const eq = await api<EquipmentItem[]>(`/equipment/community/${c.id}`);
            const myEquipment = eq.filter((e) => e.ownerId === user?.id);
            return { ...c, equipment: myEquipment };
          }),
        );
        setCommunities(withEquipment);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  async function onSubmit(data: ProfileForm) {
    const updated = await api<{ id: string; firstName: string; lastName: string }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    updateUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

      {/* Profile form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-lg">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prénom</label>
            <input
              {...register("firstName")}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom</label>
            <input
              {...register("lastName")}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            />
            {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "..." : "Sauvegarder"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-4 h-4" /> Sauvegardé
            </span>
          )}
        </div>
      </form>

      {/* My communities */}
      <h2 className="text-lg font-bold mb-3">Mes communautés</h2>
      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : communities.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Aucune communauté</p>
      ) : (
        <div className="space-y-4 mb-6">
          {communities.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <Link to={`/communities/${c.id}`} className="font-semibold text-slate-900 dark:text-slate-100 no-underline hover:underline">
                  {c.name}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded ${c.role === "ADMIN" ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-500"}`}>
                  {c.role === "ADMIN" ? "Admin" : "Membre"}
                </span>
              </div>

              {c.equipment.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Mon matériel dans cette communauté</p>
                  <div className="space-y-1.5">
                    {c.equipment.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700">{e.name}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded-full">{e.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
