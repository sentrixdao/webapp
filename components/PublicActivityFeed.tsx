"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Send, ArrowUpRight, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  activity_type: string
  title: string
  description: string
  amount_usd: string
  token_symbol: string
  transaction_hash: string
  created_at: string
  user_profiles: {
    wallet_address: string
    display_name: string
    avatar_url: string
  }
}

export default function PublicActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchActivities = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/public/activity-feed?limit=20")
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "transaction":
        return <Send className="h-4 w-4" />
      case "nft_purchase":
        return <ArrowUpRight className="h-4 w-4" />
      default:
        return <TrendingUp className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "transaction":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
      case "nft_purchase":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
      default:
        return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Activity</CardTitle>
          <CardDescription>Loading recent activities...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Community Activity</CardTitle>
            <CardDescription>Recent transactions and activities from the Sentrix community</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchActivities} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activity.user_profiles.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>
                  {activity.user_profiles.display_name?.slice(0, 2) ||
                    activity.user_profiles.wallet_address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm truncate">{activity.user_profiles.display_name}</p>
                  <Badge variant="secondary" className={`text-xs ${getActivityColor(activity.activity_type)}`}>
                    <span className="mr-1">{getActivityIcon(activity.activity_type)}</span>
                    {activity.activity_type.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{activity.title}</p>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                  {activity.amount_usd && (
                    <>
                      <span>•</span>
                      <span>${Number.parseFloat(activity.amount_usd).toLocaleString()}</span>
                    </>
                  )}
                  {activity.transaction_hash && (
                    <>
                      <span>•</span>
                      <a
                        href={`https://etherscan.io/tx/${activity.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        View on Etherscan
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activities found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
