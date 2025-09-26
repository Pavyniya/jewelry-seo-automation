import { Router } from 'express';

const router: Router = Router();

// Real keywords based on Ohh Glam's actual jewelry products
const mockKeywords = [
  {
    id: 1,
    keyword: '3d rose pendant necklace',
    position: 3,
    volume: 8500,
    difficulty: 65,
    trend: 'up' as const,
    clicks: 285,
    impressions: 3600,
    ctr: 7.9,
    url: '/products/3d-rose-pendant-necklace',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    keyword: 'heart necklace gold',
    position: 5,
    volume: 12200,
    difficulty: 72,
    trend: 'stable' as const,
    clicks: 445,
    impressions: 6250,
    ctr: 7.1,
    url: '/products/amore-heart-link-necklace',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    keyword: 'charm necklace colorful',
    position: 8,
    volume: 6800,
    difficulty: 58,
    trend: 'up' as const,
    clicks: 195,
    impressions: 3000,
    ctr: 6.5,
    url: '/products/amora-charm-necklace',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 4,
    keyword: 'heart ring open adjustable',
    position: 12,
    volume: 5400,
    difficulty: 52,
    trend: 'down' as const,
    clicks: 125,
    impressions: 2850,
    ctr: 4.4,
    url: '/products/amore-hearts-open-ring',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 5,
    keyword: 'drop heart earrings waterproof',
    position: 7,
    volume: 4200,
    difficulty: 48,
    trend: 'up' as const,
    clicks: 142,
    impressions: 1870,
    ctr: 7.6,
    url: '/products/amour-drop-heart-earrings',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 6,
    keyword: 'stainless steel jewelry hypoallergenic',
    position: 9,
    volume: 15600,
    difficulty: 68,
    trend: 'stable' as const,
    clicks: 680,
    impressions: 9800,
    ctr: 6.9,
    url: '/collections/all',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 7,
    keyword: 'gold plated necklace tarnish resistant',
    position: 6,
    volume: 9800,
    difficulty: 62,
    trend: 'up' as const,
    clicks: 395,
    impressions: 5600,
    ctr: 7.1,
    url: '/collections/necklaces',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 8,
    keyword: 'ohh glam jewelry',
    position: 2,
    volume: 3200,
    difficulty: 35,
    trend: 'up' as const,
    clicks: 285,
    impressions: 3200,
    ctr: 8.9,
    url: '/',
    lastUpdated: new Date().toISOString()
  }
];

const mockCompetitors = [
  {
    id: 1,
    name: 'Brilliant Earth',
    domain: 'brilliantearth.com',
    authority: 85,
    overlap: 78,
    keywords: 2450,
    description: 'Sustainable and ethically sourced fine jewelry',
    category: 'Fine Jewelry',
    traffic: 1250000,
    backlinks: 45000,
    sharedKeywords: ['diamond engagement rings', 'wedding rings', 'ethical jewelry'],
    strengths: ['Brand reputation', 'Product quality', 'Ethical sourcing'],
    weaknesses: ['Higher prices', 'Limited customization']
  },
  {
    id: 2,
    name: 'Blue Nile',
    domain: 'bluenile.com',
    authority: 92,
    overlap: 65,
    keywords: 3200,
    description: 'Online diamond and jewelry retailer',
    category: 'Online Jewelry',
    traffic: 2100000,
    backlinks: 67000,
    sharedKeywords: ['diamond rings', 'engagement rings', 'fine jewelry'],
    strengths: ['Brand authority', 'Wide selection', 'Competitive pricing'],
    weaknesses: ['Less personal touch', 'Limited physical stores']
  },
  {
    id: 3,
    name: 'James Allen',
    domain: 'jamesallen.com',
    authority: 88,
    overlap: 58,
    keywords: 2800,
    description: 'Online retailer of engagement rings and fine jewelry',
    category: 'Online Jewelry',
    traffic: 1850000,
    backlinks: 52000,
    sharedKeywords: ['engagement rings', 'diamond jewelry', 'custom rings'],
    strengths: ['Technology', 'Customization', 'Customer service'],
    weaknesses: ['Brand recognition', 'Market share']
  }
];

const mockTrends = [
  {
    date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    organicTraffic: 12500,
    keywordPositions: 45,
    backlinks: 850,
    pageSpeed: 92,
    mobileUsability: 88,
    overallScore: 78
  },
  {
    date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    organicTraffic: 13200,
    keywordPositions: 42,
    backlinks: 875,
    pageSpeed: 94,
    mobileUsability: 90,
    overallScore: 81
  },
  {
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    organicTraffic: 14100,
    keywordPositions: 38,
    backlinks: 920,
    pageSpeed: 91,
    mobileUsability: 89,
    overallScore: 84
  },
  {
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    organicTraffic: 15800,
    keywordPositions: 35,
    backlinks: 980,
    pageSpeed: 93,
    mobileUsability: 92,
    overallScore: 87
  },
  {
    date: new Date().toISOString().split('T')[0],
    organicTraffic: 17200,
    keywordPositions: 32,
    backlinks: 1050,
    pageSpeed: 95,
    mobileUsability: 94,
    overallScore: 91
  }
];

const mockPerformance = {
  impressions: 45600,
  ctr: 7.2,
  conversionRate: 2.8,
  revenue: 38450,
  averagePosition: 6.8,
  top10Keywords: 8,
  top3Keywords: 3
};

// Keywords endpoints
router.get('/keywords', (req, res) => {
  const { search, status, dateRange } = req.query;

  let filteredKeywords = [...mockKeywords];

  if (search) {
    filteredKeywords = filteredKeywords.filter(keyword =>
      keyword.keyword.toLowerCase().includes((search as string).toLowerCase())
    );
  }

  if (status) {
    filteredKeywords = filteredKeywords.filter(keyword =>
      keyword.trend === status
    );
  }

  res.json({
    success: true,
    data: filteredKeywords,
    total: filteredKeywords.length,
    page: 1,
    limit: 50
  });
});

router.post('/keywords', (req, res) => {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: 'Keyword is required'
    });
  }

  const newKeyword = {
    id: mockKeywords.length + 1,
    keyword,
    position: Math.floor(Math.random() * 50) + 20,
    volume: Math.floor(Math.random() * 50000) + 1000,
    difficulty: Math.floor(Math.random() * 40) + 60,
    trend: 'stable' as const,
    clicks: Math.floor(Math.random() * 1000) + 100,
    impressions: Math.floor(Math.random() * 10000) + 1000,
    ctr: Math.random() * 10 + 1,
    url: '/',
    lastUpdated: new Date().toISOString()
  };

  mockKeywords.push(newKeyword);

  res.json({
    success: true,
    data: newKeyword,
    message: 'Keyword added successfully'
  });
});

// Competitors endpoints
router.get('/competitors', (req, res) => {
  res.json({
    success: true,
    data: mockCompetitors,
    total: mockCompetitors.length
  });
});

router.post('/competitors', (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({
      success: false,
      error: 'Domain is required'
    });
  }

  const newCompetitor = {
    id: mockCompetitors.length + 1,
    name: domain.split('.')[0],
    domain,
    authority: Math.floor(Math.random() * 40) + 60,
    overlap: Math.floor(Math.random() * 50) + 30,
    keywords: Math.floor(Math.random() * 3000) + 500,
    description: 'Competitor website',
    category: 'Jewelry',
    traffic: Math.floor(Math.random() * 2000000) + 100000,
    backlinks: Math.floor(Math.random() * 50000) + 10000,
    sharedKeywords: [],
    strengths: [],
    weaknesses: []
  };

  mockCompetitors.push(newCompetitor);

  res.json({
    success: true,
    data: newCompetitor,
    message: 'Competitor added successfully'
  });
});

// Trends endpoints
router.get('/trends', (req, res) => {
  const { dateRange } = req.query;

  let filteredTrends = [...mockTrends];

  if (dateRange) {
    const days = parseInt(dateRange.toString().replace('d', ''));
    if (days) {
      filteredTrends = mockTrends.slice(-Math.min(days / 30, mockTrends.length));
    }
  }

  res.json({
    success: true,
    data: filteredTrends
  });
});

// Performance endpoints
router.get('/performance', (req, res) => {
  res.json({
    success: true,
    data: mockPerformance
  });
});

export default router;