import { PublicHelpCenter } from "@/components/help/PublicHelpCenter";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";

export const metadata = {
  title: "Help center",
};

export default async function HelpDeskPage() {
  const config = await getProductConfig();

  return <PublicHelpCenter supportHref={buildWhatsAppHref(config.supportWhatsappNumber)} />;
}