import React from 'react'
import { QualityScore } from '@jewelry-seo/shared/types/review'
import { Card } from '@/components/ui/Card'

interface QualityScoreProps {
  score: QualityScore
  className?: string
}

export const QualityScoreComponent: React.FC<QualityScoreProps> = ({
  score,
  className = ''
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const getScoreWidth = (score: number) => {
    return `${score}%`
  }

  return (
    <div className={className}>
      <Card title="Content Quality Score">
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getScoreColor(score.overall)} text-2xl font-bold mb-2`}>
              {score.overall}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {getScoreLabel(score.overall)}
            </div>
          </div>

          {/* Detailed Scores */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">SEO Score</span>
                <span className="text-sm text-gray-600">{score.seo}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${score.seo >= 80 ? 'bg-green-500' : score.seo >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: getScoreWidth(score.seo) }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Readability</span>
                <span className="text-sm text-gray-600">{score.readability}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${score.readability >= 80 ? 'bg-green-500' : score.readability >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: getScoreWidth(score.readability) }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Brand Voice</span>
                <span className="text-sm text-gray-600">{score.brandVoice}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${score.brandVoice >= 80 ? 'bg-green-500' : score.brandVoice >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: getScoreWidth(score.brandVoice) }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Keyword Density</span>
                <span className="text-sm text-gray-600">{score.keywordDensity}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${score.keywordDensity >= 80 ? 'bg-green-500' : score.keywordDensity >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: getScoreWidth(score.keywordDensity) }}
                />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Strengths */}
            {score.details.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {score.details.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <span className="text-green-500 mr-2">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {score.details.improvements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Areas for Improvement</h4>
                <ul className="space-y-1">
                  {score.details.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <span className="text-yellow-500 mr-2">!</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {score.details.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h4>
                <ul className="space-y-1">
                  {score.details.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600">
                      <span className="text-blue-500 mr-2">💡</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quality Guidelines */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <h4 className="font-medium mb-2">Quality Standards:</h4>
            <ul className="space-y-1">
              <li>• 80-100: Excellent content, ready to publish</li>
              <li>• 60-79: Good content, minor improvements needed</li>
              <li>• 40-59: Fair content, significant improvements needed</li>
              <li>• 0-39: Poor content, major revision required</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}