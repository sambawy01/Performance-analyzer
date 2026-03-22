import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export function PlayerDevelopment() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Development Trajectory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-2">
            Monthly development snapshots track physical, tactical, and workload
            scores over time.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Monthly development data will appear here. AI-generated monthly
            narratives and benchmarks vs. age group will be shown once the
            player has data spanning multiple months.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
