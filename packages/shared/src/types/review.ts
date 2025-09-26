export interface ContentReview {
  id: string;
  productId: string;
  versionId: string;
  reviewer: string;
  status: ReviewStatus;
  feedback?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface OptimizationVersion {
  id: string;
  productId: string;
  version: number;
  originalTitle: string;
  originalDescription: string;
  originalSeoTitle?: string;
  originalSeoDescription?: string;
  optimizedTitle: string;
  optimizedDescription: string;
  optimizedSeoTitle: string;
  optimizedSeoDescription: string;
  aiProvider: string;
  createdAt: Date;
  isActive: boolean;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export interface ReviewSubmission {
  status: 'approved' | 'rejected' | 'needs_revision';
  feedback?: string;
  editedContent?: {
    title?: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
  };
}

export interface ContentDiff {
  type: 'added' | 'removed' | 'modified';
  text: string;
  originalText?: string;
  position: number;
}

export interface ReviewFilters {
  status?: ReviewStatus[];
  reviewer?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: 'high' | 'medium' | 'low';
}

export interface ReviewQueueItem {
  id: string;
  productId: string;
  productName: string;
  versionId: string;
  priority: 'high' | 'medium' | 'low';
  submittedAt: Date;
  assignedTo?: string;
  estimatedReviewTime: number; // in minutes
}

export interface ReviewStats {
  pending: number;
  approved: number;
  rejected: number;
  needsRevision: number;
  averageReviewTime: number;
  topReviewer: string;
}

export interface QualityScore {
  overall: number;
  seo: number;
  readability: number;
  brandVoice: number;
  keywordDensity: number;
  details: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
}

export interface BatchReviewOperation {
  reviewIds: string[];
  action: 'approve' | 'reject' | 'request_revision';
  feedback?: string;
  assignTo?: string;
}