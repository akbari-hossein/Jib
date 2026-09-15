import { requireUser } from "@/lib/auth/session";
import { AddCategoryButton } from "@/features/categories/add-category";
import { CategoryList } from "@/features/categories/category-list";
import { PageHeader } from "@/components/ui/page-header";
import { listManagedCategories } from "@/server/queries/categories";
import { getCachedSubscription } from "@/server/services/subscription";
import { SUBSCRIPTION_COPY } from "@/lib/subscription/copy";
import Link from "next/link";

export const metadata = { title: "دسته‌بندی‌ها" };

export default async function CategoriesPage() {
  const user = await requireUser();
  const [categories, snapshot] = await Promise.all([
    listManagedCategories(user.id),
    getCachedSubscription(user.id),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="دسته‌بندی‌ها"
        description="دسته‌های پیش‌فرض جیب می‌مانند. دسته‌های خودت را بساز یا اگر استفاده نمی‌شوند حذف کن."
        action={
          snapshot.writeAccess ? (
            <AddCategoryButton />
          ) : (
            <Link href="/upgrade" className="text-sm font-medium text-primary">
              {SUBSCRIPTION_COPY.activateCta}
            </Link>
          )
        }
      />
      <CategoryList
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          icon: category.icon,
          kind: category.kind,
          group: category.group,
          isSystem: category.isSystem,
        }))}
      />
    </main>
  );
}
