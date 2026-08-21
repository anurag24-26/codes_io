import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { useCategories, useCreateCategory, useDeleteCategory, useReorderCategories, useUpdateCategory } from "@/hooks/useCategories";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api";
import { UpgradeModal } from "@/components/UpgradeModal";
import toast from "react-hot-toast";

export function CategoriesPage() {
  const { restaurantId } = useParams();
  const { data: categories, isLoading } = useCategories(restaurantId);
  const createCategory = useCreateCategory(restaurantId!);
  const updateCategory = useUpdateCategory(restaurantId!);
  const deleteCategory = useDeleteCategory(restaurantId!);
  const reorderCategories = useReorderCategories(restaurantId!);

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCategory.mutateAsync({ name: name.trim() });
      setName("");
    } catch (err) {
      if (err instanceof ApiError && err.payload?.error === "PLAN_LIMIT_REACHED") {
        setShowUpgrade(true);
      } else {
        toast.error("Could not create category");
      }
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    await updateCategory.mutateAsync({ id, name: editingName.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category and all its menu items?")) return;
    await deleteCategory.mutateAsync(id);
  };

  const move = (index: number, direction: -1 | 1) => {
    if (!categories) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    reorderCategories.mutate(reordered.map((c) => c.id));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-neutral-900">Categories</h1>

      <Card>
        <form onSubmit={handleCreate} className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="catname">New category</Label>
            <Input id="catname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Starters" />
          </div>
          <Button type="submit" isLoading={createCategory.isPending}>
            Add
          </Button>
        </form>
      </Card>

      <Card>
        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        {categories && categories.length === 0 && (
          <p className="text-sm text-neutral-500">No categories yet. Add your first one above.</p>
        )}
        <ul className="divide-y divide-neutral-100">
          {categories?.map((cat, index) => (
            <li key={cat.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={index === (categories?.length ?? 0) - 1}
                  onClick={() => move(index, 1)}
                  className="text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
              {editingId === cat.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(cat.id)}
                  />
                  <Button size="sm" onClick={() => handleRename(cat.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-medium text-neutral-800">{cat.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                    >
                      Rename
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(cat.id)}>
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Free plan limit reached"
        message="You've reached your Free plan limit of 3 categories. Upgrade to Pro for unlimited categories."
      />
    </div>
  );
}
