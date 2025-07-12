"use client"

import * as React from "react"
import {
  ArrowUpRight,
  KeyRound,
  Server,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { formatDistanceToNow } from 'date-fns';
import type { ChartConfig } from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getUsageMetrics, fetchRecentConnections } from "@/app/keys/actions";
import { ApiKey, UsageStat, ConnectionLog } from "@/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const chartConfig = {
  requests: {
    label: "Requests",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function DashboardClientPage({ initialKeys }: { initialKeys: ApiKey[]}) {
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(initialKeys);
  const [usageStats, setUsageStats] = React.useState<UsageStat[]>([]);
  const [recentConnections, setRecentConnections] = React.useState<ConnectionLog[]>([]);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [keysResponse, metricsResponse, connectionsResponse] = await Promise.all([
        fetch('/api/v1/keys'),
        getUsageMetrics(),
        fetchRecentConnections(),
      ]);
      
      if (keysResponse.ok) {
        const keys = await keysResponse.json();
        setApiKeys(keys);
      } else {
        console.error('Failed to fetch API keys');
      }

      setRecentConnections(connectionsResponse);

      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const processedMetrics = last7Days.map(date => {
        const found = metricsResponse.find(m => m.date === date);
        return {
          date: date,
          requests: found ? found.requests : 0,
        };
      });

      setUsageStats(processedMetrics);

    } catch (e: any) {
      console.error("Could not load dashboard data. " + e.message);
    }
  }, []);


  React.useEffect(() => {
    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);


  const recentKeys = [...apiKeys].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const totalRequests = usageStats.reduce((acc, stat) => acc + stat.requests, 0);
  const activeKeysCount = apiKeys.filter(key => key.status === 'active').length;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to your KeyStone API dashboard.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeKeysCount} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Ollama Proxy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests (7d)
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all keys
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2%</div>
            <p className="text-xs text-muted-foreground">
              -0.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">API Usage Trend</CardTitle>
            <CardDescription>
              Total requests over the last 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={usageStats}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                 <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="requests" fill="var(--color-requests)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Connections</CardTitle>
            <CardDescription>
              The last 5 incoming API requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
              {recentConnections.map(conn => (
                <li key={conn.id} className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div className="flex-grow">
                    <p className="font-medium">{conn.keyName}</p>
                    <p className="text-muted-foreground text-xs truncate" title={conn.path}>
                      {conn.path}
                    </p>
                     <p className="text-muted-foreground text-xs truncate" title={conn.userAgent}>
                      <span className="font-medium text-foreground/80">{conn.ip ?? 'Unknown IP'}</span>
                      {' '}- {conn.userAgent ?? 'Unknown client'}
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <p className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDistanceToNow(new Date(conn.timestamp), { addSuffix: true })}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{new Date(conn.timestamp).toLocaleString()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
       <div className="grid gap-4">
         <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent API Keys</CardTitle>
            <CardDescription>
              The last 5 keys that were generated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentKeys.map((key: ApiKey) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <Badge variant={key.status === "active" ? "secondary" : "destructive"} className="capitalize bg-primary/20 text-primary-foreground">
                        {key.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
       </div>
    </div>
  );
}
