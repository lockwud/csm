import { AuthVisual } from "../AuthVisual";
import { RegisterForm } from "../RegisterForm";
import { getSettings } from "@/lib/services/settingsService";

function categoryOptions(settings: Awaited<ReturnType<typeof getSettings>>, categoryName: string) {
  const category = settings.categories.find((item) => item.name === categoryName);
  return (category?.items ?? [])
    .filter((item) => item.active)
    .map((item) => item.label);
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const initialRole = params.type === "rider" ? "RIDER" : "CLIENT";
  const settings = await getSettings();
  const pickupAreas = categoryOptions(settings, "delivery-zones");
  const packageTypes = categoryOptions(settings, "package-types");

  return (
    <div className="relative h-screen overflow-hidden">
      <AuthVisual />
      <section className="relative z-10 flex h-screen justify-center overflow-hidden">
        <div className="flex h-full w-full flex-col">
          <RegisterForm initialRole={initialRole} pickupAreas={pickupAreas} packageTypes={packageTypes} />
        </div>
      </section>
    </div>
  );
}
