import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import {
  AddOn,
  MenuItem,
  Variant,
  useCreateMenuItem,
  useDeleteMenuItem,
  useMenuItems,
  useReorderMenuItems,
  useUpdateMenuItem,
  useUploadMenuItemImage,
} from "@/hooks/useMenuItems";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { UpgradeModal } from "@/components/UpgradeModal";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  isVeg: true,
  isSpicy: false,
  allergens: "",
};

export function MenuItemsPage() {
  const { restaurantId } = useParams();
  const { data: categories } = useCategories(restaurantId);
  const { data: items, isLoading } = useMenuItems(restaurantId);
  const { data: subscription } = useSubscription();
  const isPro = subscription?.plan === "PRO";

  const createItem = useCreateMenuItem(restaurantId!);
  const updateItem = useUpdateMenuItem(restaurantId!);
  const deleteItem = useDeleteMenuItem(restaurantId!);
  const uploadImage = useUploadMenuItemImage(restaurantId!);
  const reorderItems = useReorderMenuItems(restaurantId!);

  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [showUpgrade, setShowUpgrade] = useState<{ title?: string; message?: string } | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.categoryId || !form.price) {
      toast.error("Name, category, and price are required");
      return;
    }
    try {
      await createItem.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        categoryId: form.categoryId,
        isVeg: form.isVeg,
        isSpicy: form.isSpicy,
        allergens: form.allergens.trim() || undefined,
        variants: variants.filter((v) => v.name.trim()),
        addOns: addOns.filter((a) => a.name.trim()),
      });
      setForm({ ...emptyForm, categoryId: form.categoryId });
      setVariants([]);
      setAddOns([]);
      toast.success("Item added");
    } catch (err) {
      if (err instanceof ApiError && err.payload?.error === "PLAN_LIMIT_REACHED") {
        setShowUpgrade({
          title: "Free plan limit reached",
          message: "You've reached your Free plan limit of 20 menu items. Upgrade to Pro for unlimited items.",
        });
      } else {
        toast.error("Could not add item");
      }
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    await updateItem.mutateAsync({ id: item.id, isAvailable: !item.isAvailable });
  };

  const toggleField = async (item: MenuItem, field: "isFeatured" | "isBestseller", proMessage: string) => {
    if (!isPro && !item[field]) {
      setShowUpgrade({ message: proMessage });
      return;
    }
    try {
      await updateItem.mutateAsync({ id: item.id, [field]: !item[field] } as any);
    } catch (err) {
      if (err instanceof ApiError && err.payload?.error === "PRO_FEATURE_LOCKED") {
        setShowUpgrade({ message: proMessage });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    await deleteItem.mutateAsync(id);
  };

  const handleImage = async (id: string, file: File) => {
    try {
      await uploadImage.mutateAsync({ id, file });
    } catch {
      toast.error("Could not upload image");
    }
  };

  const itemsByCategory = (categoryId: string) =>
    (items || []).filter((i) => i.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder);

  const move = (categoryId: string, index: number, direction: -1 | 1) => {
    const list = itemsByCategory(categoryId);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const reordered = [...list];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    reorderItems.mutate({ categoryId, orderedIds: reordered.map((i) => i.id) });
  };

  if (!categories) return <div className="text-sm text-neutral-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Menu items</h1>

      {categories.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-600">Create a category first before adding menu items.</p>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="iname">Item name</Label>
                <Input id="iname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="icat">Category</Label>
                <select
                  id="icat"
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="idesc">Description</Label>
              <Textarea id="idesc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="max-w-[160px]">
                <Label htmlFor="iprice">Base price (₹)</Label>
                <Input id="iprice" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="iallergens">Allergens (comma-separated)</Label>
                <Input id="iallergens" placeholder="peanuts, dairy" value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-1.5 text-sm text-neutral-700">
                <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} />
                Vegetarian
              </label>
              <label className="flex items-center gap-1.5 text-sm text-neutral-700">
                <input type="checkbox" checked={form.isSpicy} onChange={(e) => setForm({ ...form, isSpicy: e.target.checked })} />
                Spicy
              </label>
            </div>

            <VariantEditor label="Size variants (e.g. Half / Full)" items={variants} setItems={setVariants} priceKey="priceDelta" />
            <VariantEditor label="Add-ons (e.g. Extra cheese)" items={addOns} setItems={setAddOns} priceKey="price" />

            <Button type="submit" isLoading={createItem.isPending}>
              Add item
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {categories.map((cat) => {
          const catItems = itemsByCategory(cat.id);
          if (catItems.length === 0) return null;
          return (
            <div key={cat.id}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">{cat.name}</h2>
              <div className="space-y-3">
                {catItems.map((item, index) => (
                  <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex flex-col text-neutral-400">
                      <button type="button" disabled={index === 0} onClick={() => move(cat.id, index, -1)} className="hover:text-neutral-700 disabled:opacity-20" aria-label="Move up">▲</button>
                      <button type="button" disabled={index === catItems.length - 1} onClick={() => move(cat.id, index, 1)} className="hover:text-neutral-700 disabled:opacity-20" aria-label="Move down">▼</button>
                    </div>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <label className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-neutral-300 text-[10px] text-neutral-400">
                        Add photo
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(item.id, e.target.files[0])} />
                      </label>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-block h-3.5 w-3.5 shrink-0 rounded-sm border-2 ${item.isVeg ? "border-emerald-600" : "border-red-600"}`}>
                          <span className={`m-auto block h-1.5 w-1.5 rounded-full ${item.isVeg ? "bg-emerald-600" : "bg-red-600"}`} />
                        </span>
                        <h3 className="font-semibold text-neutral-900">{item.name}</h3>
                        {item.isSpicy && <Badge variant="warning">🌶 Spicy</Badge>}
                        {item.isFeatured && <Badge variant="warning">Featured</Badge>}
                        {item.isBestseller && <Badge variant="success">Bestseller</Badge>}
                        {!item.isAvailable && <Badge>Unavailable</Badge>}
                        <span className="ml-auto font-semibold text-neutral-800">₹{Number(item.price).toFixed(0)}</span>
                      </div>
                      {item.description && <p className="text-sm text-neutral-500">{item.description}</p>}
                      {item.allergens && <p className="text-xs text-neutral-400">Allergens: {item.allergens}</p>}
                      {item.variants.length > 0 && (
                        <p className="text-xs text-neutral-400">
                          Variants: {item.variants.map((v) => `${v.name} (+₹${v.priceDelta})`).join(", ")}
                        </p>
                      )}
                      {item.addOns.length > 0 && (
                        <p className="text-xs text-neutral-400">
                          Add-ons: {item.addOns.map((a) => `${a.name} (₹${a.price})`).join(", ")}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleAvailability(item)}>
                          {item.isAvailable ? "Mark unavailable" : "Mark available"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleField(item, "isFeatured", "Featured items are a Pro feature.")}>
                          {item.isFeatured ? "Unfeature" : "Feature"} {!isPro && !item.isFeatured && "🔒"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleField(item, "isBestseller", "Bestseller tags are a Pro feature.")}>
                          {item.isBestseller ? "Unmark bestseller" : "Mark bestseller"} {!isPro && !item.isBestseller && "🔒"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <UpgradeModal
        open={!!showUpgrade}
        onClose={() => setShowUpgrade(null)}
        title={showUpgrade?.title}
        message={showUpgrade?.message}
      />
    </div>
  );
}

function VariantEditor<T extends { name: string }>({
  label,
  items,
  setItems,
  priceKey,
}: {
  label: string;
  items: T[];
  setItems: (items: T[]) => void;
  priceKey: "priceDelta" | "price";
}) {
  const addRow = () => setItems([...items, { name: "", [priceKey]: 0 } as unknown as T]);
  const updateRow = (index: number, patch: Partial<T>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    setItems(next);
  };
  const removeRow = (index: number) => setItems(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="Name"
              value={item.name}
              onChange={(e) => updateRow(index, { name: e.target.value } as Partial<T>)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder={priceKey === "priceDelta" ? "+₹" : "₹"}
              value={(item as any)[priceKey]}
              onChange={(e) => updateRow(index, { [priceKey]: Number(e.target.value) } as Partial<T>)}
              className="w-24"
            />
            <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={() => removeRow(index)}>
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          + Add
        </Button>
      </div>
    </div>
  );
}
