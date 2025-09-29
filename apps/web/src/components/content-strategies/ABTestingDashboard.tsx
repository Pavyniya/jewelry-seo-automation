import React, { useState, useEffect } from 'react';
import {
  ABTest,
  TestResult,
  StatisticalSignificance
} from '@jewelry-seo/shared/types/contentStrategy';
import { abTestingEngine } from '../../services/contentStrategiesService';

const ABTestingDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    productId: '',
    variants: [
      { name: 'Control', content: '', weight: 50 },
      { name: 'Variant A', content: '', weight: 50 }
    ]
  });

  const fetchTests = async () => {
    setLoading(true);
    try {
      const testsResponse = await abTestingEngine.getTests();
      setTests(testsResponse.data || []);

      try {
        const resultsResponse = await abTestingEngine.getTestResults();
        setResults(resultsResponse.data || []);
      } catch (resultsError) {
        console.warn('Could not fetch test results:', resultsError);
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching A/B test data:', error);
      setTests([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async () => {
    try {
      await abTestingEngine.createTest(newTest);
      setShowCreateForm(false);
      setNewTest({
        name: '',
        description: '',
        productId: '',
        variants: [
          { name: 'Control', content: '', weight: 50 },
          { name: 'Variant A', content: '', weight: 50 }
        ]
      });
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'running': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'paused': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSignificanceColor = (significance: StatisticalSignificance): string => {
    if (significance.isSignificant) {
      return significance.confidence > 0.95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getTestResult = (testId: string): TestResult | undefined => {
    return results.find(result => result.testId === testId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">A/B Testing</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create New Test
          </button>
          <button
            onClick={fetchTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Create New A/B Test</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <input
                type="text"
                value={newTest.name}
                onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter test name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Describe the test"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
              <input
                type="text"
                value={newTest.productId}
                onChange={(e) => setNewTest({ ...newTest, productId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter product ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Variants</label>
              {newTest.variants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => {
                        const updatedVariants = [...newTest.variants];
                        updatedVariants[index].name = e.target.value;
                        setNewTest({ ...newTest, variants: updatedVariants });
                      }}
                      className="px-2 py-1 border border-gray-300 rounded"
                      placeholder="Variant name"
                    />
                    <input
                      type="number"
                      value={variant.weight}
                      onChange={(e) => {
                        const updatedVariants = [...newTest.variants];
                        updatedVariants[index].weight = parseInt(e.target.value) || 0;
                        setNewTest({ ...newTest, variants: updatedVariants });
                      }}
                      className="w-20 px-2 py-1 border border-gray-300 rounded"
                      placeholder="Weight %"
                    />
                  </div>
                  <textarea
                    value={variant.content}
                    onChange={(e) => {
                      const updatedVariants = [...newTest.variants];
                      updatedVariants[index].content = e.target.value;
                      setNewTest({ ...newTest, variants: updatedVariants });
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Variant content"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={createTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Test
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{tests.length}</div>
          <div className="text-sm text-gray-500">Total Tests</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {tests.filter(t => t.status === 'running').length}
          </div>
          <div className="text-sm text-gray-500">Running Tests</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {tests.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500">Completed Tests</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Active Tests</h3>
        <div className="space-y-4">
          {tests.filter(test => test.status === 'running' || test.status === 'completed').map((test) => {
            const result = getTestResult(test.id);
            return (
              <div key={test.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">{test.name}</h4>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(test.status)}`}>
                    {test.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Variants</h5>
                    <div className="space-y-2">
                      {test.variants.map((variant, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{variant.name}</span>
                          <span className="text-sm text-gray-500">{variant.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Results</h5>
                      <div className="space-y-2">
                        {result.variantResults.map((variantResult, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{variantResult.variantName}</span>
                            <span className="text-sm text-gray-500">
                              {variantResult.conversionRate.toFixed(2)}% CR
                            </span>
                          </div>
                        ))}
                        <div className={`p-2 rounded ${getSignificanceColor(result.statisticalSignificance)}`}>
                          <div className="text-xs">
                            Significance: {(result.statisticalSignificance.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs">
                            P-value: {result.statisticalSignificance.pValue.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                  <span>Created: {new Date(test.createdAt).toLocaleDateString()}</span>
                  {test.completedAt && (
                    <span>Completed: {new Date(test.completedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ABTestingDashboard;