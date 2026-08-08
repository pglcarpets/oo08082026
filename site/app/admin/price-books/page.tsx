import { AdminPriceBookPageView } from "@/features/admin/pricing/AdminPriceBookPageView";
import {
  DEFAULT_PRICE_BOOK_ID,
  ensureDefaultPriceBookSeeded,
  readAdminPriceBook,
} from "@/features/admin/pricing/priceBookAdmin.server";

export const metadata = {
  title: "Price books | Oando Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminPriceBooksPage() {
  await ensureDefaultPriceBookSeeded();
  const payload = await readAdminPriceBook(DEFAULT_PRICE_BOOK_ID);
  return <AdminPriceBookPageView initialContract={payload?.contract ?? null} />;
}