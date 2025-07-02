import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const metrics = [
      "# HELP nodejs_version_info Node.js version info",
      "# TYPE nodejs_version_info gauge",
      `nodejs_version_info{version="${process.version}"} 1`,
      "",
      "# HELP process_uptime_seconds Process uptime in seconds",
      "# TYPE process_uptime_seconds gauge",
      `process_uptime_seconds ${process.uptime()}`,
      "",
      "# HELP nodejs_memory_usage_bytes Memory usage in bytes",
      "# TYPE nodejs_memory_usage_bytes gauge",
      `nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}`,
      `nodejs_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}`,
      `nodejs_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}`,
      `nodejs_memory_usage_bytes{type="external"} ${process.memoryUsage().external}`,
      "",
      "# HELP http_requests_total Total number of HTTP requests",
      "# TYPE http_requests_total counter",
      'http_requests_total{method="GET",status="200"} 1',
      "",
    ].join("\n")

    res.setHeader("Content-Type", "text/plain")
    res.status(200).send(metrics)
  } catch (error) {
    res.status(500).json({ error: "Failed to generate metrics" })
  }
}
