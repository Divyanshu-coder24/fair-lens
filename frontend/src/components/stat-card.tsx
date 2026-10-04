import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StatCard({ label, value, hint, flag }: { label: string; value: string; hint: string; flag?: boolean }) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="px-4">
        <CardDescription className="flex items-center justify-between">
          {label}{flag && <Badge variant="destructive">Review</Badge>}
        </CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  );
}
