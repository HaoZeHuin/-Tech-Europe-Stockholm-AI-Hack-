import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Brain, 
  Target, 
  Clock, 
  MapPin, 
  BookOpen, 
  Coffee,
  Edit,
  Calendar,
  Briefcase,
  TrendingUp,
  Heart,
  Zap,
  Shield
} from "lucide-react";

interface ProfileMetric {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const profileMetrics: ProfileMetric[] = [
  { label: "Productivity", value: 85, icon: <TrendingUp className="h-4 w-4" />, color: "text-success" },
  { label: "Focus Time", value: 92, icon: <Clock className="h-4 w-4" />, color: "text-primary" },
  { label: "Goal Progress", value: 68, icon: <Target className="h-4 w-4" />, color: "text-warning" },
  { label: "Well-being", value: 76, icon: <Heart className="h-4 w-4" />, color: "text-voice-active" },
];

interface InsightCard {
  title: string;
  icon: React.ReactNode;
  value: string;
  trend: string;
  color: string;
}

const insights: InsightCard[] = [
  { title: "Morning Focus", icon: <Zap className="h-5 w-5" />, value: "7-11 AM", trend: "Peak hours", color: "bg-primary/10 text-primary" },
  { title: "Work Style", icon: <Briefcase className="h-5 w-5" />, value: "2hr blocks", trend: "Optimal", color: "bg-success/10 text-success" },
  { title: "Learning", icon: <BookOpen className="h-5 w-5" />, value: "AI/ML", trend: "Growing", color: "bg-voice-active/10 text-voice-active" },
  { title: "Location", icon: <MapPin className="h-5 w-5" />, value: "Hybrid", trend: "3x/week", color: "bg-warning/10 text-warning" },
];

export function UserProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Your Profile</h2>
          <p className="text-muted-foreground">How Jarvis understands you</p>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      {/* Profile Summary */}
      <Card className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Alex</h3>
              <Badge variant="outline" className="text-xs">
                75% Complete
              </Badge>
            </div>
            <p className="text-muted-foreground">
              AI product enthusiast focused on productivity and life management
            </p>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {profileMetrics.map((metric, index) => (
          <Card key={index} className="p-4 text-center">
            <div className={`inline-flex p-2 rounded-lg bg-muted mb-2 ${metric.color}`}>
              {metric.icon}
            </div>
            <div className="space-y-2">
              <Progress value={metric.value} className="h-2" />
              <div>
                <div className="text-2xl font-bold">{metric.value}%</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${insight.color}`}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{insight.title}</div>
                <div className="text-sm text-muted-foreground">{insight.trend}</div>
              </div>
              <div className="text-lg font-semibold">{insight.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Privacy Controls */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Privacy Controls</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Learning Mode</p>
              <p className="text-sm text-muted-foreground">Allow profile updates from interactions</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Location Suggestions</p>
              <p className="text-sm text-muted-foreground">Weather and route recommendations</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Schedule Optimization</p>
              <p className="text-sm text-muted-foreground">Smart calendar suggestions</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
}