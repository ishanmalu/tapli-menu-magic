import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface Props {
  restaurantId: string;
  categories: Tables<"categories">[];
  onUpdate: () => void;
}

export function CategoryManager({ restaurantId, categories, onUpdate }: Props) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("categories").insert({
      name: newName.trim(),
      restaurant_id: restaurantId,
      sort_order: categories.length,
    });
    setAdding(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { setNewName(""); onUpdate(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else onUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
              <span>{c.name}</span>
              <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive ml-1">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="New category" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} className="max-w-xs" />
          <Button size="sm" onClick={handleAdd} disabled={adding}><Plus className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}