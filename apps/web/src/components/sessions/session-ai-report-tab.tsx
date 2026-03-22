import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SessionAiReportTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Session Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">
            AI-generated session report including narrative, top performers,
            areas of concern, and recommendations.
          </p>
          <Button disabled>Generate Report</Button>
          <p className="text-xs text-muted-foreground mt-2">
            Available once the AI layer is connected.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
