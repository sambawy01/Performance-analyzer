import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export function SessionTacticalTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tactical Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-2">
            Requires CV data from video processing.
          </p>
          <p className="text-sm text-muted-foreground">
            Once a video is processed through the CV pipeline, formation maps,
            pressing analysis, and transition metrics will appear here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
