import {
  ContentReview,
  OptimizationVersion,
  ReviewSubmission,
  ReviewFilters,
  ReviewQueueItem,
  ReviewStats,
  QualityScore,
  BatchReviewOperation,
  ContentDiff
} from '@jewelry-seo/shared/types/review'

type RequestInit = globalThis.RequestInit

export interface ReviewService {
  getReviews(_filters?: ReviewFilters): Promise<ContentReview[]>
  getReview(_id: string): Promise<ContentReview>
  submitReview(_id: string, _submission: ReviewSubmission): Promise<void>
  getOptimizationVersion(_id: string): Promise<OptimizationVersion>
  getPendingReviews(): Promise<ReviewQueueItem[]>
  getReviewStats(): Promise<ReviewStats>
  getQualityScore(_content: string): Promise<QualityScore>
  batchReview(_operation: BatchReviewOperation): Promise<void>
  getContentDiffs(_original: string, _optimized: string): Promise<ContentDiff[]>
}

class ApiReviewService implements ReviewService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getReviews(filters?: ReviewFilters): Promise<ContentReview[]> {
    const params = new URLSearchParams()

    if (filters?.status?.length) {
      params.append('status', filters.status.join(','))
    }

    if (filters?.reviewer) {
      params.append('reviewer', filters.reviewer)
    }

    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString())
      params.append('endDate', filters.dateRange.end.toISOString())
    }

    if (filters?.priority) {
      params.append('priority', filters.priority)
    }

    const endpoint = `/reviews${params.toString() ? `?${params.toString()}` : ''}`
    return this.request<ContentReview[]>(endpoint)
  }

  async getReview(id: string): Promise<ContentReview> {
    return this.request<ContentReview>(`/reviews/${id}`)
  }

  async submitReview(id: string, submission: ReviewSubmission): Promise<void> {
    await this.request<void>(`/reviews/${id}`, {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  }

  async getOptimizationVersion(id: string): Promise<OptimizationVersion> {
    return this.request<OptimizationVersion>(`/optimization-versions/${id}`)
  }

  async getPendingReviews(): Promise<ReviewQueueItem[]> {
    return this.request<ReviewQueueItem[]>('/reviews/pending')
  }

  async getReviewStats(): Promise<ReviewStats> {
    return this.request<ReviewStats>('/reviews/stats')
  }

  async getQualityScore(content: string): Promise<QualityScore> {
    return this.request<QualityScore>('/quality-score', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }

  async batchReview(operation: BatchReviewOperation): Promise<void> {
    await this.request<void>('/reviews/batch', {
      method: 'POST',
      body: JSON.stringify(operation),
    })
  }

  async getContentDiffs(original: string, optimized: string): Promise<ContentDiff[]> {
    return this.request<ContentDiff[]>('/content-diffs', {
      method: 'POST',
      body: JSON.stringify({ original, optimized }),
    })
  }
}

export const reviewService = new ApiReviewService()