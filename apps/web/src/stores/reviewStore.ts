import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  ContentReview,
  OptimizationVersion,
  ReviewSubmission,
  ReviewFilters,
  ReviewQueueItem,
  ReviewStats,
  QualityScore,
  ContentDiff,
  ReviewStatus
} from '@jewelry-seo/shared/types/review'
import { reviewService } from '@/services/reviewService'

interface ReviewStore {
  // State
  currentReview: ContentReview | null
  currentVersion: OptimizationVersion | null
  reviews: ContentReview[]
  pendingReviews: ReviewQueueItem[]
  reviewStats: ReviewStats | null
  contentDiffs: ContentDiff[]
  qualityScore: QualityScore | null
  selectedReviews: Set<string>
  loading: boolean
  error: string | null
  filters: ReviewFilters

  // Actions
  fetchReviews: (_filters?: ReviewFilters) => Promise<void>
  fetchReview: (_id: string) => Promise<void>
  fetchOptimizationVersion: (_id: string) => Promise<void>
  fetchPendingReviews: () => Promise<void>
  fetchReviewStats: () => Promise<void>
  submitReview: (_id: string, _submission: ReviewSubmission) => Promise<void>
  calculateQualityScore: (_content: string) => Promise<void>
  getContentDiffs: (_original: string, _optimized: string) => Promise<void>
  batchReview: (_reviewIds: string[], _action: 'approve' | 'reject' | 'request_revision', _feedback?: string) => Promise<void>
  selectReview: (_id: string) => void
  deselectReview: (_id: string) => void
  selectAllReviews: () => void
  deselectAllReviews: () => void
  setFilters: (_filters: ReviewFilters) => void
  clearError: () => void
  reset: () => void
}

const defaultFilters: ReviewFilters = {}

export const useReviewStore = create<ReviewStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentReview: null,
        currentVersion: null,
        reviews: [],
        pendingReviews: [],
        reviewStats: null,
        contentDiffs: [],
        qualityScore: null,
        selectedReviews: new Set(),
        loading: false,
        error: null,
        filters: defaultFilters,

        // Actions
        fetchReviews: async (filters?: ReviewFilters) => {
          set({ loading: true, error: null })
          try {
            const reviews = await reviewService.getReviews(filters || get().filters)
            set({ reviews, loading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch reviews',
              loading: false
            })
          }
        },

        fetchReview: async (id: string) => {
          set({ loading: true, error: null })
          try {
            const review = await reviewService.getReview(id)
            set({ currentReview: review, loading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch review',
              loading: false
            })
          }
        },

        fetchOptimizationVersion: async (id: string) => {
          set({ loading: true, error: null })
          try {
            const version = await reviewService.getOptimizationVersion(id)
            set({ currentVersion: version, loading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch optimization version',
              loading: false
            })
          }
        },

        fetchPendingReviews: async () => {
          set({ loading: true, error: null })
          try {
            const pendingReviews = await reviewService.getPendingReviews()
            set({ pendingReviews, loading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch pending reviews',
              loading: false
            })
          }
        },

        fetchReviewStats: async () => {
          set({ loading: true, error: null })
          try {
            const stats = await reviewService.getReviewStats()
            set({ reviewStats: stats, loading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to fetch review stats',
              loading: false
            })
          }
        },

        submitReview: async (id: string, submission: ReviewSubmission) => {
          set({ loading: true, error: null })
          try {
            await reviewService.submitReview(id, submission)

            // Update local state
            const reviews = get().reviews.map(review =>
              review.id === id
                ? { ...review, status: submission.status, feedback: submission.feedback }
                : review
            )

            set({
              reviews,
              loading: false,
              currentReview: get().currentReview?.id === id
                ? { ...get().currentReview!, status: submission.status, feedback: submission.feedback }
                : get().currentReview
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to submit review',
              loading: false
            })
          }
        },

        calculateQualityScore: async (content: string) => {
          set({ loading: true, error: null })
          try {
            const score = await reviewService.getQualityScore(content)
            set({ qualityScore: score, loading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to calculate quality score',
              loading: false
            })
          }
        },

        getContentDiffs: async (original: string, optimized: string) => {
          set({ loading: true, error: null })
          try {
            const diffs = await reviewService.getContentDiffs(original, optimized)
            set({ contentDiffs: diffs, loading: false })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to get content diffs',
              loading: false
            })
          }
        },

        batchReview: async (reviewIds: string[], action: 'approve' | 'reject' | 'request_revision', feedback?: string) => {
          set({ loading: true, error: null })
          try {
            await reviewService.batchReview({
              reviewIds,
              action,
              feedback
            })

            // Update local state
            const reviews = get().reviews.map(review =>
              reviewIds.includes(review.id)
                ? { ...review, status: action as ReviewStatus, feedback }
                : review
            )

            set({
              reviews,
              loading: false,
              selectedReviews: new Set()
            })
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to perform batch review',
              loading: false
            })
          }
        },

        selectReview: (id: string) => {
          const selectedReviews = new Set(get().selectedReviews)
          selectedReviews.add(id)
          set({ selectedReviews })
        },

        deselectReview: (id: string) => {
          const selectedReviews = new Set(get().selectedReviews)
          selectedReviews.delete(id)
          set({ selectedReviews })
        },

        selectAllReviews: () => {
          const selectedReviews = new Set(get().reviews.map(review => review.id))
          set({ selectedReviews })
        },

        deselectAllReviews: () => {
          set({ selectedReviews: new Set() })
        },

        setFilters: (filters: ReviewFilters) => {
          set({ filters: { ...get().filters, ...filters } })
        },

        clearError: () => {
          set({ error: null })
        },

        reset: () => {
          set({
            currentReview: null,
            currentVersion: null,
            reviews: [],
            pendingReviews: [],
            reviewStats: null,
            contentDiffs: [],
            qualityScore: null,
            selectedReviews: new Set(),
            loading: false,
            error: null,
            filters: defaultFilters
          })
        }
      }),
      {
        name: 'review-store',
        partialize: (state) => ({
          filters: state.filters,
        }),
      }
    ),
    {
      name: 'review-store',
    }
  )
)