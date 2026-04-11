import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { LocalizedLink } from "../components/LocalizedLink";
import { Check, Package } from "lucide-react";

export function Profile() {
  const { t } = useTranslation("app");
  const { t: tc } = useTranslation("common");
  const { user, updateUser } = useAuth();
  const [communities, setCommunities] = useState<CommunityWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const profileSchema = z.object({
    firstName: z.string().min(1, t("profile.firstname_required")),
    lastName: z.string().min(1, t("profile.lastname_required")),
  });

  type ProfileForm = z.infer<typeof profileSchema>;

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
      <h1 className="text-2xl font-bold mb-6">{t("profile.title")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-lg">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("profile.firstname")}</label>
            <input
              {...register("firstName")}
              className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
            {errors.firstName && <p className="text-sm text-[var(--color-error)] mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("profile.lastname")}</label>
            <input
              {...register("lastName")}
              className="w-full px-3 py-2 border border-[var(--color-border-strong)] rounded-[var(--radius-input)] outline-none focus:ring-2 focus:ring-primary-400 bg-[var(--color-input)] text-[var(--color-text-primary)]"
            />
            {errors.lastName && <p className="text-sm text-[var(--color-error)] mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("profile.email")}</label>
          <input
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-input)] bg-[var(--color-page)] text-[var(--color-text-tertiary)]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "..." : t("profile.save")}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-[var(--color-success)]">
              <Check className="w-4 h-4" strokeWidth={1.5} /> {t("profile.saved")}
            </span>
          )}
        </div>
      </form>

      <h2 className="text-lg font-bold mb-3">{t("profile.my_communities")}</h2>
      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : communities.length === 0 ? (
        <p className="text-[var(--color-text-secondary)] text-center py-8">{t("profile.no_communities")}</p>
      ) : (
        <div className="space-y-4 mb-6">
          {communities.map((c) => (
            <div key={c.id} className="bg-[var(--color-card)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <LocalizedLink to={`/app/communities/${c.id}`} className="font-semibold text-[var(--color-text-primary)] no-underline hover:underline">
                  {c.name}
                </LocalizedLink>
                <span className={`text-xs px-2 py-0.5 rounded-[var(--radius-pill)] ${c.role === "ADMIN" ? "bg-primary-50 text-primary-600" : "bg-[var(--color-input)] text-[var(--color-text-secondary)]"}`}>
                  {c.role === "ADMIN" ? tc("roles.admin") : tc("roles.member")}
                </span>
              </div>

              {c.equipment.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-2">{t("profile.my_equipment_in")}</p>
                  <div className="space-y-1.5">
                    {c.equipment.map((e) => (
                      <div key={e.id} className="flex items-center gap-2 text-sm">
                        <Package className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" strokeWidth={1.5} />
                        <span className="text-[var(--color-text-secondary)]">{e.name}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded-[var(--radius-pill)]">{e.category}</span>
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
