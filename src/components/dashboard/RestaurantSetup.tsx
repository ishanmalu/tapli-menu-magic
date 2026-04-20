import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  onCreated: (r: Tables<"restaurants">) => void;
}

export function RestaurantSetup({ userId, onCreated }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await supabase
      .from("restaurants")
      .insert({ name: name.trim(), slug, owner_id: userId })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      onCreated(data);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your restaurant</CardTitle>
          <CardDescription>Give your restaurant a name to get started with your digital menu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input placeholder="Restaurant name" value={name} onChange={(e) => setName(e.target.value)} required />
            <p className="text-xs text-muted-foreground">
              Your menu will be available at: /menu/{name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "your-restaurant"}
            </p>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating..." : "Create Restaurant"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}