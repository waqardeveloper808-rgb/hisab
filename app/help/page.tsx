import { PublicHelpCenter } from "@/components/help/PublicHelpCenter";
import { buildWhatsAppHref, getProductConfig } from "@/lib/product-config";

export const metadata = {
  title: "Help",
};

export default async function HelpCenterPage() {
  const productConfig = await getProductConfig();
  const supportHref = buildWhatsAppHref(productConfig.supportWhatsappNumber);

  return <PublicHelpCenter supportHref={supportHref} />;
}
