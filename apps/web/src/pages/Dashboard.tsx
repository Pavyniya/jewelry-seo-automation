import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Gem, TrendingUp, Users, Target } from 'lucide-react'

interface DashboardStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  needs_review: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/products/stats/overview')
      const data = await response.json()

      if (data.success) {
        // Transform the backend data structure to match frontend expectations
        const backendStats = data.data;
        setStats({
          total: backendStats.total,
          pending: backendStats.pending,
          processing: backendStats.processing,
          completed: backendStats.completed,
          failed: backendStats.failed,
          needs_review: backendStats.needs_review,
        });
      } else {
        setError('Failed to fetch statistics')
      }
    } catch (err) {
      setError('Error connecting to server')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatsData = () => {
    if (!stats) return []

    // Calculate real SEO score
    const seoScore = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return [
      {
        name: 'Total Products',
        value: stats.total.toLocaleString(),
        change: '', // Remove fake percentage change
        changeType: 'positive' as const,
        icon: Gem,
      },
      {
        name: 'Optimized Items',
        value: stats.completed.toLocaleString(),
        change: '', // Remove fake percentage change
        changeType: 'positive' as const,
        icon: Target,
      },
      {
        name: 'SEO Score',
        value: seoScore + '%',
        change: '', // Remove fake percentage change
        changeType: 'positive' as const,
        icon: TrendingUp,
      },
      {
        name: 'Pending Items',
        value: (stats.pending + stats.needs_review).toLocaleString(),
        change: '', // Remove fake percentage change
        changeType: 'positive' as const,
        icon: Users,
      },
    ]
  }

  const statsData = getStatsData()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600 mb-4">{error}</div>
            <button onClick={fetchStats} className="text-blue-600 hover:text-blue-800">Try Again</button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {user?.name || 'User'}! Here's what's happening with your SEO optimization.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              {stat.change && (
                <p className={`text-xs ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity - removed fake data, real activity tracking requires integration */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Activity tracking requires integration with real business systems
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              No fake activity data is displayed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
              <Gem className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Add New Product</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Import or create product</p>
            </button>
            <button className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
              <Target className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Run SEO Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Optimize your products</p>
            </button>
            <button className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
              <TrendingUp className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">View Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Check performance</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard