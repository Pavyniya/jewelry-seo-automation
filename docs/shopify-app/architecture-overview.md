# Shopify App Architecture: Jewelry SEO Optimizer

**Project:** Ohh Glam Auto SEO
**Document Type:** Technical Architecture
**Version:** 1.0
**Date:** September 25, 2025

---

## 🎯 EXECUTIVE SUMMARY

The Jewelry SEO Optimizer is a Shopify app designed to automate and optimize SEO content for jewelry stores. This architecture document outlines the technical design, components, and implementation strategy for building a scalable SaaS solution.

### **Business Value**
- **For Store Owners:** Automated SEO optimization, improved search rankings, increased conversions
- **For Ohh Glam:** SaaS revenue stream, market leadership in jewelry SEO
- **Scalability:** Support for thousands of stores, multiple markets, continuous innovation

---

## 🏗️ SYSTEM ARCHITECTURE

### **High-Level Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shopify Store │◄──►│  Our App        │◄──►│   AI Services   │
│                 │    │                 │    │  (Claude/GPT)    │
│ • Products      │    │ • Frontend      │    │                 │
│ • Orders        │    │ • Backend       │    │ • Content Gen   │
│ • Customers     │    │ • Database      │    │ • Analysis      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               ▲
                               │
                               ▼
                       ┌─────────────────┐
                       │   External APIs  │
                       │                 │
                       │ • Analytics     │
                       │ • Email         │
                       │ • Storage       │
                       └─────────────────┘
```

### **Technology Stack**

#### **Frontend**
- **Framework:** React 18+
- **UI Library:** Shopify Polaris (Shopify's design system)
- **State Management:** Redux Toolkit
- **Routing:** React Router
- **Styling:** CSS Modules + Polaris components
- **Build Tool:** Vite

#### **Backend**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **API:** RESTful + GraphQL (Shopify Admin API)
- **Authentication:** JWT + Shopify OAuth
- **Database:** PostgreSQL (production) / SQLite (development)

#### **AI Integration**
- **Primary:** Claude API (Anthropic)
- **Secondary:** OpenAI GPT-4
- **Fallback:** Google Gemini
- **Rate Limiting:** Custom queuing system
- **Cost Optimization:** Model selection based on complexity

#### **Infrastructure**
- **Hosting:** Vercel (frontend) / Railway (backend)
- **Database:** PostgreSQL (Neon for serverless)
- **Storage:** AWS S3 (for assets)
- **Monitoring:** Sentry + custom logging
- **CI/CD:** GitHub Actions

---

## 📊 DATA MODELS

### **Core Schema**

```sql
-- Users/Stores
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id VARCHAR(255) UNIQUE NOT NULL,
  shop_name VARCHAR(255),
  email VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'free',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  shopify_product_id BIGINT UNIQUE,
  title VARCHAR(500),
  product_type VARCHAR(100),
  material VARCHAR(100),
  price DECIMAL(10,2),
  currency VARCHAR(3),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Optimizations
CREATE TABLE optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES users(id),
  template_used VARCHAR(100),
  seo_title VARCHAR(60),
  seo_description VARCHAR(160),
  product_description TEXT,
  keywords TEXT[],
  performance_data JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  category VARCHAR(100),
  prompt_text TEXT,
  variables JSONB,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  metric_type VARCHAR(50),
  metric_value DECIMAL(15,4),
  date DATE,
  metadata JSONB
);
```

---

## 🔧 CORE COMPONENTS

### **1. Frontend Application (React)**

#### **Directory Structure**
```
src/
├── components/
│   ├── common/           # Reusable components
│   ├── dashboard/        # Dashboard components
│   ├── optimization/     # Optimization interface
│   ├── templates/        # Template management
│   └── analytics/        # Analytics display
├── pages/
│   ├── index.js          # Main dashboard
│   ├── optimize/         # Product optimization
│   ├── templates/        # Template management
│   ├── analytics/        # Performance data
│   └── settings/         # User settings
├── hooks/                # Custom React hooks
├── services/             # API calls
├── utils/                # Helper functions
└── store/                # Redux setup
```

#### **Key Components**

**Dashboard Component**
```jsx
const Dashboard = () => {
  const { user, products, optimizations } = useStore();

  return (
    <Layout>
      <Card>
        <Heading>SEO Optimization Dashboard</Heading>
        <Banner status="success">
          {products.optimized} of {products.total} products optimized
        </Banner>

        <Stack>
          <Button onClick={optimizeAll}>Optimize All Products</Button>
          <Button onClick={manageTemplates}>Manage Templates</Button>
        </Stack>

        <ProductList products={products} />
      </Card>
    </Layout>
  );
};
```

**Optimization Panel**
```jsx
const OptimizationPanel = ({ product }) => {
  const [selectedTemplate, setTemplate] = useState(null);
  const [targetMarket, setMarket] = useState('NZ');

  return (
    <Card>
      <ProductInfo product={product} />
      <TemplateSelector
        templates={templates}
        selected={selectedTemplate}
        onChange={setTemplate}
      />
      <MarketSelector
        markets={['NZ', 'Australia', 'Global']}
        selected={targetMarket}
        onChange={setMarket}
      />
      <OptimizeButton
        product={product}
        template={selectedTemplate}
        market={targetMarket}
      />
    </Card>
  );
};
```

### **2. Backend API (Node.js/Express)**

#### **Directory Structure**
```
server/
├── routes/
│   ├── auth.js          # Authentication
│   ├── products.js      # Product management
│   ├── optimization.js  # SEO optimization
│   ├── templates.js     # Template management
│   └── analytics.js     # Performance data
├── services/
│   ├── shopify.js       # Shopify API
│   ├── ai-engine.js     # AI content generation
│   ├── analytics.js     # Performance tracking
│   └── email.js         # Notifications
├── middleware/
│   ├── auth.js          # Authentication
│   ├── rateLimit.js     # Rate limiting
│   └── errorHandler.js  # Error handling
├── models/              # Database models
├── utils/               # Helper functions
└── config.js            # Configuration
```

#### **Key Endpoints**

**Product Optimization**
```javascript
// POST /api/optimize/product
router.post('/optimize/product', auth, async (req, res) => {
  const { productId, templateId, targetMarket } = req.body;

  // Get product data
  const product = await Product.findByShopifyId(productId);

  // Generate SEO content
  const optimizedContent = await aiEngine.generateContent({
    product,
    template: await Template.findById(templateId),
    market: targetMarket
  });

  // Save optimization
  const optimization = await Optimization.create({
    productId: product.id,
    userId: req.user.id,
    ...optimizedContent
  });

  // Update Shopify product
  await shopifyService.updateProduct(productId, optimizedContent);

  res.json({ success: true, optimization });
});
```

**Batch Optimization**
```javascript
// POST /api/optimize/batch
router.post('/optimize/batch', auth, async (req, res) => {
  const { productIds, templateId, targetMarket } = req.body;

  const results = await Promise.allSettled(
    productIds.map(productId =>
      optimizeProduct(productId, templateId, targetMarket)
    )
  );

  res.json({
    success: true,
    results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
  });
});
```

### **3. AI Engine**

```javascript
class AIEngine {
  constructor() {
    this.providers = {
      claude: new ClaudeProvider(),
      openai: new OpenAIProvider(),
      gemini: new GeminiProvider()
    };
  }

  async generateContent({ product, template, market }) {
    const prompt = this.buildPrompt(product, template, market);

    // Select provider based on complexity and availability
    const provider = this.selectProvider(prompt);

    try {
      const result = await provider.generate(prompt);
      return this.parseResult(result, template);
    } catch (error) {
      // Fallback to next provider
      return await this.fallback(prompt, template);
    }
  }

  buildPrompt(product, template, market) {
    return `
      ${template.prompt_text}

      Product Details:
      - Name: ${product.title}
      - Type: ${product.product_type}
      - Material: ${product.material}
      - Price: ${product.price}
      - Market: ${market}

      Generate optimized SEO content in the specified format.
    `;
  }
}
```

---

## 🔐 SECURITY & AUTHENTICATION

### **Shopify OAuth Integration**
```javascript
// OAuth Flow
router.get('/auth', (req, res) => {
  const authUrl = `https://${req.query.shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${REDIRECT_URI}`;
  res.redirect(authUrl);
});

router.get('/auth/callback', async (req, res) => {
  const { shop, code } = req.query;

  // Exchange code for access token
  const accessToken = await getAccessToken(shop, code);

  // Create/update user
  const user = await User.findOrCreate({ shopId: shop, accessToken });

  // Create JWT session
  const token = jwt.sign({ userId: user.id }, JWT_SECRET);

  res.redirect(`${APP_URL}/auth/success?token=${token}`);
});
```

### **API Security**
```javascript
// Authentication middleware
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting
const rateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests'
});
```

---

## 📈 ANALYTICS & MONITORING

### **Performance Tracking**
```javascript
// Track optimization performance
class AnalyticsService {
  async trackOptimization(optimizationId, metrics) {
    await Analytics.create({
      optimization_id: optimizationId,
      metric_type: 'optimization_performance',
      metric_value: metrics.score,
      metadata: metrics
    });
  }

  async getProductAnalytics(productId, dateRange) {
    return await Analytics.findAll({
      where: {
        product_id: productId,
        date: { [Op.between]: dateRange }
      }
    });
  }
}
```

### **Real-time Monitoring**
```javascript
// WebSocket for real-time updates
io.on('connection', (socket) => {
  socket.on('subscribe:optimization', (optimizationId) => {
    socket.join(`optimization:${optimizationId}`);
  });
});

// Emit updates
const emitOptimizationUpdate = (optimizationId, data) => {
  io.to(`optimization:${optimizationId}`).emit('optimization:update', data);
};
```

---

## 🚀 DEPLOYMENT & SCALING

### **Development Environment**
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - REACT_APP_API_URL=http://localhost:3001

  backend:
    build: ./backend
    ports: ["3001:3001"]
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@localhost:5432/jewelry_seo
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: jewelry_seo
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    ports: ["5432:5432"]
```

### **Production Deployment**
```bash
# Frontend deployment to Vercel
vercel --prod

# Backend deployment to Railway
railway up

# Database migrations
npm run migrate:latest
```

### **Scaling Considerations**
- **Database:** Read replicas for analytics queries
- **AI Services:** Queue system for bulk processing
- **File Storage:** CDN for static assets
- **Monitoring:** Distributed tracing

---

## 💰 MONETIZATION STRATEGY

### **Subscription Plans**
```javascript
const PLANS = {
  free: {
    products_per_month: 5,
    templates: 'basic',
    analytics: false,
    price: 0
  },
  basic: {
    products_per_month: 50,
    templates: 'basic + custom',
    analytics: 'basic',
    price: 9
  },
  pro: {
    products_per_month: 'unlimited',
    templates: 'all + custom',
    analytics: 'advanced',
    price: 29
  },
  agency: {
    products_per_month: 'unlimited',
    templates: 'white-label',
    analytics: 'white-label',
    multi_store: true,
    price: 99
  }
};
```

### **Usage Tracking**
```javascript
// Track usage for billing
class UsageTracker {
  async trackProductOptimization(userId) {
    const usage = await Usage.increment(userId, 'products');

    // Check plan limits
    const user = await User.findById(userId);
    if (usage.products > user.plan_limit) {
      throw new Error('Plan limit exceeded');
    }
  }
}
```

---

## 🧪 TESTING STRATEGY

### **Testing Framework**
```
tests/
├── unit/              # Unit tests
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/        # Integration tests
│   ├── api/
│   └── database/
├── e2e/               # End-to-end tests
│   ├── auth/
│   ├── optimization/
│   └── analytics/
└── performance/       # Performance tests
```

### **Key Test Cases**
- Authentication flows
- Shopify API integration
- AI content generation
- SEO optimization accuracy
- Analytics tracking
- Subscription billing

---

## 📋 NEXT STEPS

### **Phase 1: MVP (4-6 weeks)**
- [ ] Set up development environment
- [ ] Implement Shopify OAuth
- [ ] Build core optimization features
- [ ] Create basic dashboard
- [ ] Test with Ohh Glam store

### **Phase 2: Enhanced Features (6-8 weeks)**
- [ ] Template management system
- [ ] Advanced analytics
- [ ] Bulk optimization
- [ ] A/B testing framework

### **Phase 3: Launch & Scale (4-6 weeks)**
- [ ] App Store submission
- [ ] Marketing materials
- [ ] Support documentation
- [ ] Scaling infrastructure

---

## 🎯 SUCCESS METRICS

### **Technical Metrics**
- **Uptime:** 99.9%+
- **Response Time:** <200ms for API calls
- **Error Rate:** <0.1%
- **AI Success Rate:** >95%

### **Business Metrics**
- **Active Stores:** 100+ in 6 months
- **MRR:** $5,000+ by month 6
- **Customer Satisfaction:** 4.5+ stars
- **Churn Rate:** <5% monthly

---

This architecture provides a solid foundation for building a scalable, profitable SaaS product while solving the immediate SEO automation needs for Ohh Glam's jewelry store.

---

**Document Status:** Draft
**Next Review:** Architecture review with development team
**Dependencies:** Shopify Partner account, AI API access