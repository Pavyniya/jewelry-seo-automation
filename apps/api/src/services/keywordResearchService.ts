import { logger } from '../utils/logger';

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  intent: 'commercial' | 'informational' | 'transactional' | 'navigational';
  relatedKeywords: string[];
}

export interface SEOAnalysis {
  primaryKeywords: KeywordData[];
  secondaryKeywords: KeywordData[];
  longTailKeywords: KeywordData[];
  semanticKeywords: string[];
  competitorKeywords: string[];
  searchIntent: string;
  recommendedKeywordDensity: number;
}

export class KeywordResearchService {
  private jewelryKeywordDatabase: Record<string, KeywordData[]> = {
    'ring': [
      {
        keyword: 'engagement ring',
        searchVolume: 450000,
        difficulty: 85,
        cpc: 3.20,
        intent: 'commercial',
        relatedKeywords: ['diamond engagement ring', 'wedding ring', 'proposal ring', 'bridal ring']
      },
      {
        keyword: 'diamond ring',
        searchVolume: 201000,
        difficulty: 75,
        cpc: 2.80,
        intent: 'commercial',
        relatedKeywords: ['diamond solitaire ring', 'diamond wedding ring', 'real diamond ring']
      },
      {
        keyword: 'wedding ring',
        searchVolume: 368000,
        difficulty: 70,
        cpc: 2.50,
        intent: 'commercial',
        relatedKeywords: ['wedding band', 'bridal set', 'matching wedding rings']
      },
      {
        keyword: 'gold ring',
        searchVolume: 165000,
        difficulty: 65,
        cpc: 2.20,
        intent: 'commercial',
        relatedKeywords: ['14k gold ring', '18k gold ring', 'yellow gold ring', 'white gold ring']
      }
    ],
    'necklace': [
      {
        keyword: 'pendant necklace',
        searchVolume: 90500,
        difficulty: 60,
        cpc: 1.80,
        intent: 'commercial',
        relatedKeywords: ['chain necklace', 'charm necklace', 'layered necklace']
      },
      {
        keyword: 'gold necklace',
        searchVolume: 201000,
        difficulty: 70,
        cpc: 2.10,
        intent: 'commercial',
        relatedKeywords: ['14k gold necklace', 'gold chain necklace', 'yellow gold necklace']
      },
      {
        keyword: 'diamond necklace',
        searchVolume: 74000,
        difficulty: 75,
        cpc: 3.50,
        intent: 'commercial',
        relatedKeywords: ['diamond pendant necklace', 'tennis necklace', 'solitaire necklace']
      },
      {
        keyword: 'rose necklace',
        searchVolume: 22000,
        difficulty: 45,
        cpc: 1.60,
        intent: 'commercial',
        relatedKeywords: ['rose pendant', 'flower necklace', 'romantic necklace', '3d rose necklace']
      }
    ],
    'bracelet': [
      {
        keyword: 'tennis bracelet',
        searchVolume: 49500,
        difficulty: 65,
        cpc: 2.40,
        intent: 'commercial',
        relatedKeywords: ['diamond tennis bracelet', 'gold tennis bracelet', 'eternity bracelet']
      },
      {
        keyword: 'charm bracelet',
        searchVolume: 60500,
        difficulty: 55,
        cpc: 1.90,
        intent: 'commercial',
        relatedKeywords: ['pandora bracelet', 'silver charm bracelet', 'gold charm bracelet']
      },
      {
        keyword: 'gold bracelet',
        searchVolume: 135000,
        difficulty: 65,
        cpc: 2.00,
        intent: 'commercial',
        relatedKeywords: ['14k gold bracelet', 'yellow gold bracelet', 'white gold bracelet']
      }
    ],
    'earrings': [
      {
        keyword: 'stud earrings',
        searchVolume: 110000,
        difficulty: 60,
        cpc: 1.70,
        intent: 'commercial',
        relatedKeywords: ['diamond stud earrings', 'gold stud earrings', 'pearl stud earrings']
      },
      {
        keyword: 'hoop earrings',
        searchVolume: 165000,
        difficulty: 55,
        cpc: 1.50,
        intent: 'commercial',
        relatedKeywords: ['gold hoop earrings', 'silver hoop earrings', 'large hoop earrings']
      },
      {
        keyword: 'drop earrings',
        searchVolume: 49500,
        difficulty: 50,
        cpc: 1.60,
        intent: 'commercial',
        relatedKeywords: ['dangle earrings', 'chandelier earrings', 'statement earrings']
      }
    ]
  };

  private jewelrySemanticTerms: Record<string, string[]> = {
    'materials': [
      '316L stainless steel', 'hypoallergenic', 'tarnish-free', 'waterproof',
      '14k gold', '18k gold', 'white gold', 'yellow gold', 'rose gold',
      'sterling silver', 'platinum', 'titanium', 'surgical steel'
    ],
    'occasions': [
      'wedding', 'engagement', 'anniversary', 'birthday', 'graduation',
      'mothers day', 'valentines day', 'christmas', 'bridal', 'formal event'
    ],
    'styles': [
      'minimalist', 'vintage', 'modern', 'classic', 'bohemian', 'elegant',
      'statement', 'delicate', 'bold', 'timeless', 'contemporary', 'romantic'
    ],
    'features': [
      'adjustable', 'stackable', 'layerable', 'matching set', 'gift ready',
      'handcrafted', 'artisan made', 'custom', 'personalized', 'engraved'
    ]
  };

  private competitorAnalysisData = {
    'high_performing_titles': [
      'Stunning [PRODUCT] - Perfect for [OCCASION] | [BRAND]',
      'Handcrafted [MATERIAL] [PRODUCT] - Elegant & Timeless',
      '[PRODUCT] - Premium [MATERIAL] Jewelry for Women',
      'Luxury [PRODUCT] - [STYLE] Design with [FEATURE]',
      'Beautiful [PRODUCT] - [MATERIAL] [STYLE] Jewelry Gift'
    ],
    'high_performing_descriptions': [
      'Discover the perfect blend of elegance and craftsmanship',
      'Meticulously crafted with premium materials',
      'A timeless piece that complements any style',
      'Perfect for special occasions or everyday wear',
      'Makes an unforgettable gift for someone special'
    ]
  };

  public async analyzeProduct(product: any): Promise<SEOAnalysis> {
    try {
      logger.info('Starting SEO analysis for product', { 
        productId: product.id, 
        title: product.title,
        productType: product.productType 
      });

      const productType = this.normalizeProductType(product.productType);
      const productTitle = product.title.toLowerCase();
      
      // Get relevant keywords for this product type
      const relevantKeywords = this.getRelevantKeywords(productType, productTitle);
      
      // Analyze search intent
      const searchIntent = this.analyzeSearchIntent(product);
      
      // Get semantic keywords
      const semanticKeywords = this.getSemanticKeywords(product);
      
      // Get competitor keywords
      const competitorKeywords = this.getCompetitorKeywords(productType);

      const analysis: SEOAnalysis = {
        primaryKeywords: relevantKeywords.primary,
        secondaryKeywords: relevantKeywords.secondary,
        longTailKeywords: relevantKeywords.longTail,
        semanticKeywords,
        competitorKeywords,
        searchIntent,
        recommendedKeywordDensity: this.calculateOptimalKeywordDensity(relevantKeywords.primary)
      };

      logger.info('SEO analysis completed', {
        productId: product.id,
        primaryKeywords: analysis.primaryKeywords.length,
        secondaryKeywords: analysis.secondaryKeywords.length,
        longTailKeywords: analysis.longTailKeywords.length
      });

      return analysis;

    } catch (error) {
      logger.error('Error analyzing product for SEO', { 
        productId: product.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  private normalizeProductType(productType: string): string {
    const normalized = productType.toLowerCase();
    
    // Map variations to standard types
    const typeMapping: Record<string, string> = {
      'rings': 'ring',
      'necklaces': 'necklace',
      'pendants': 'necklace',
      'bracelets': 'bracelet',
      'bangles': 'bracelet',
      'earrings': 'earrings',
      'studs': 'earrings'
    };

    return typeMapping[normalized] || normalized;
  }

  private getRelevantKeywords(productType: string, productTitle: string): {
    primary: KeywordData[],
    secondary: KeywordData[],
    longTail: KeywordData[]
  } {
    const baseKeywords = this.jewelryKeywordDatabase[productType] || [];
    
    // Filter keywords based on product title relevance
    const relevantKeywords = baseKeywords.filter(kw => 
      productTitle.includes(kw.keyword.toLowerCase()) ||
      kw.relatedKeywords.some(related => productTitle.includes(related.toLowerCase())) ||
      kw.keyword.split(' ').some(word => productTitle.includes(word))
    );

    // If no relevant keywords found, use base keywords for the product type
    const keywordsToUse = relevantKeywords.length > 0 ? relevantKeywords : baseKeywords;

    // Sort by search volume and difficulty
    const sortedKeywords = [...keywordsToUse].sort((a, b) => b.searchVolume - a.searchVolume);

    return {
      primary: sortedKeywords.slice(0, 2), // Top 2 highest volume keywords
      secondary: sortedKeywords.slice(2, 5), // Next 3 keywords
      longTail: this.generateLongTailKeywords(sortedKeywords[0], productTitle)
    };
  }

  private generateLongTailKeywords(primaryKeyword: KeywordData, productTitle: string): KeywordData[] {
    // Emotional and commercial intent long-tail keywords
    const emotionalVariations = [
      `romantic ${primaryKeyword.keyword}`,
      `elegant ${primaryKeyword.keyword} for her`,
      `special occasion ${primaryKeyword.keyword}`,
      `meaningful ${primaryKeyword.keyword}`,
      `timeless ${primaryKeyword.keyword}`,
      `luxury ${primaryKeyword.keyword}`,
      `sophisticated ${primaryKeyword.keyword}`,
      `charming ${primaryKeyword.keyword}`
    ];

    const commercialVariations = [
      `buy ${primaryKeyword.keyword} nz`,
      `${primaryKeyword.keyword} gift for her`,
      `${primaryKeyword.keyword} online nz`,
      `affordable ${primaryKeyword.keyword}`,
      `${primaryKeyword.keyword} anniversary gift`,
      `${primaryKeyword.keyword} valentines day`,
      `${primaryKeyword.keyword} birthday present`,
      `${primaryKeyword.keyword} engagement gift`
    ];

    const allVariations = [...emotionalVariations, ...commercialVariations];

    return allVariations.map(keyword => ({
      keyword,
      searchVolume: Math.floor(primaryKeyword.searchVolume * 0.15), // Estimate 15% of primary volume
      difficulty: Math.max(15, primaryKeyword.difficulty - 35), // Much lower difficulty
      cpc: primaryKeyword.cpc * 0.8, // Slightly lower CPC
      intent: keyword.includes('buy') || keyword.includes('gift') ? 'commercial' : 'informational',
      relatedKeywords: [primaryKeyword.keyword]
    }));
  }

  private analyzeSearchIntent(product: any): string {
    const title = product.title.toLowerCase();
    const description = (product.description || '').toLowerCase();
    
    // Commercial intent keywords
    if (title.includes('buy') || title.includes('sale') || title.includes('price') || 
        description.includes('shop') || description.includes('purchase')) {
      return 'High commercial intent - users ready to buy';
    }
    
    // Informational intent
    if (title.includes('how') || title.includes('what') || title.includes('guide') ||
        description.includes('learn') || description.includes('tips')) {
      return 'Informational intent - users researching';
    }
    
    // Default to commercial for jewelry products
    return 'Commercial intent - users comparing and considering purchase';
  }

  private getSemanticKeywords(product: any): string[] {
    const semanticTerms: string[] = [];
    const title = product.title.toLowerCase();
    const description = (product.description || '').toLowerCase();
    const tags = product.tags || [];
    
    // Add material-related terms
    this.jewelrySemanticTerms.materials.forEach(material => {
        if (title.includes(material.toLowerCase()) || 
            description.includes(material.toLowerCase()) ||
            tags.some((tag: string) => tag.toLowerCase().includes(material.toLowerCase()))) {
          semanticTerms.push(material);
        }
    });
    
    // Add style and occasion terms
    ['styles', 'occasions', 'features'].forEach(category => {
      this.jewelrySemanticTerms[category as keyof typeof this.jewelrySemanticTerms].forEach(term => {
        if (title.includes(term.toLowerCase()) || 
            description.includes(term.toLowerCase())) {
          semanticTerms.push(term);
        }
      });
    });
    
    return Array.from(new Set(semanticTerms)); // Remove duplicates
  }

  private getCompetitorKeywords(productType: string): string[] {
    // Simulated competitor analysis - in real implementation, this would crawl competitor sites
    const competitorKeywords: Record<string, string[]> = {
      'ring': [
        'luxury engagement rings', 'certified diamonds', 'conflict-free diamonds',
        'custom ring design', 'ring sizing service', 'lifetime warranty'
      ],
      'necklace': [
        'layering necklaces', 'statement pieces', 'everyday jewelry',
        'gift packaging', 'adjustable chain', 'pendant collection'
      ],
      'bracelet': [
        'stackable bracelets', 'tennis bracelet collection', 'charm bracelet sets',
        'adjustable fit', 'matching jewelry sets', 'bracelet stacking guide'
      ],
      'earrings': [
        'hypoallergenic earrings', 'sensitive ears', 'earring backs included',
        'stud earring collection', 'drop earring styles', 'earring gift sets'
      ]
    };

    return competitorKeywords[productType] || [];
  }

  private calculateOptimalKeywordDensity(primaryKeywords: KeywordData[]): number {
    // Calculate optimal keyword density based on competition
    const avgDifficulty = primaryKeywords.reduce((sum, kw) => sum + kw.difficulty, 0) / primaryKeywords.length;
    
    if (avgDifficulty > 70) return 1.5; // High competition - lower density
    if (avgDifficulty > 50) return 2.0; // Medium competition
    return 2.5; // Lower competition - can use higher density
  }

  public generateOptimizedContent(product: any, analysis: SEOAnalysis): {
    seoTitle: string,
    seoDescription: string,
    optimizedDescription: string
  } {
    const primaryKeyword = analysis.primaryKeywords[0];
    const secondaryKeyword = analysis.secondaryKeywords[0];
    
    // Generate SEO-optimized title
    const seoTitle = this.generateSEOTitle(product, primaryKeyword, secondaryKeyword);
    
    // Generate SEO-optimized meta description
    const seoDescription = this.generateSEODescription(product, analysis);
    
    // Generate optimized product description
    const optimizedDescription = this.generateOptimizedDescription(product, analysis);

    return {
      seoTitle,
      seoDescription,
      optimizedDescription
    };
  }

  private generateSEOTitle(product: any, primaryKeyword: KeywordData, secondaryKeyword?: KeywordData): string {
    const brand = 'Ohh Glam';
    
    // MOBILE-FIRST: Front-load benefits and commercial intent
    const mainQuality = this.getMainQuality(product);
    
    // Voice search optimization - conversational keywords
    let title = `${mainQuality} ${primaryKeyword.keyword} NZ | ${brand}`;
    
    if (title.length > 60) {
      title = `${primaryKeyword.keyword} ${mainQuality} | ${brand}`;
    }
    
    if (title.length > 60) {
      title = `${primaryKeyword.keyword} | ${brand} NZ`;
    }
    
    return title.substring(0, 60);
  }

  private generateSEODescription(product: any, analysis: SEOAnalysis): string {
    const primaryKeyword = analysis.primaryKeywords[0];
    const semanticKeywords = analysis.semanticKeywords.slice(0, 2);
    
    // MOBILE SERP OPTIMIZATION: Under 120 characters, front-load keywords
    const mainQuality = semanticKeywords.find(k => 
      ['waterproof', 'tarnish-free', 'hypoallergenic'].includes(k.toLowerCase())
    ) || 'premium';
    
    // EMOTIONAL + COMMERCIAL INTENT: Feel confident + buy now
    let description = `Feel confident in ${mainQuality} ${primaryKeyword.keyword}. `;
    description += `${product.title} - waterproof luxury NZ. `;
    description += `Shop now, free ship!`;
    
    // Ensure under 120 chars for mobile SERP display
    return description.substring(0, 120);
  }

  private generateOptimizedDescription(product: any, analysis: SEOAnalysis): string {
    const originalDescription = product.description || product.body_html || '';
    const primaryKeyword = analysis.primaryKeywords[0];
    const secondaryKeywords = analysis.secondaryKeywords.slice(0, 5);
    const longTailKeywords = analysis.longTailKeywords.slice(0, 8);
    const semanticKeywords = analysis.semanticKeywords.slice(0, 10);
    
    // Extract key specs from original description
    const specs = this.extractProductSpecs(originalDescription);
    
    // COMPREHENSIVE SEO-OPTIMIZED FORMAT - Well-researched keywords
    const lines: string[] = [];
    
    // 1. EMOTIONAL HOOK WITH PRIMARY KEYWORD - Compelling opening
    const emotionalHook = this.generateComprehensiveEmotionalHook(product, primaryKeyword, analysis);
    lines.push(emotionalHook);
    
    // 2. DETAILED PRODUCT DESCRIPTION - Rich with keywords
    const detailedDescription = this.generateDetailedProductDescription(product, analysis, specs);
    lines.push('');
    lines.push(detailedDescription);
    
    // 3. COMPREHENSIVE BENEFITS - Multiple keyword variations
    lines.push('');
    lines.push('**Why This Jewelry Piece Stands Out:**');
    const comprehensiveBenefits = this.generateComprehensiveBenefits(product, analysis, specs);
    comprehensiveBenefits.forEach(benefit => lines.push(`• ${benefit}`));
    
    // 4. OCCASION-SPECIFIC CONTENT - Long-tail keyword integration
    lines.push('');
    const occasionContent = this.generateOccasionSpecificContent(product, longTailKeywords, analysis);
    lines.push(occasionContent);
    
    // 5. QUALITY AND CRAFTSMANSHIP - Semantic keywords
    lines.push('');
    const qualityContent = this.generateQualityAndCraftsmanship(product, specs, semanticKeywords, analysis);
    lines.push(qualityContent);
    
    // 6. STYLING AND CARE INSTRUCTIONS - Additional keywords
    lines.push('');
    const stylingContent = this.generateStylingAndCareInstructions(product, analysis);
    lines.push(stylingContent);
    
    // 7. EMOTIONAL STORYTELLING - Commercial intent keywords
    lines.push('');
    const emotionalStory = this.generateEmotionalStorytelling(product, analysis);
    lines.push(emotionalStory);
    
    // 8. CALL TO ACTION - Conversion-focused
    lines.push('');
    const commercialIntent = this.generateComprehensiveCommercialIntent(product, primaryKeyword, analysis);
    lines.push(commercialIntent);
    
    // 9. SPECIFICATIONS - Technical details at the end
    const originalSpecs = this.extractOriginalSpecifications(originalDescription);
    if (originalSpecs) {
      lines.push('');
      lines.push('**Technical Specifications:**');
      lines.push(originalSpecs);
    }
    
    return lines.join('\n');
  }

  private getProblemSolution(primaryKeyword: string, quality: string): string {
    const problems: { [key: string]: string } = {
      'necklace': 'Tired of necklaces that tarnish or irritate your skin?',
      'bracelet': 'Frustrated with bracelets that lose their shine?',
      'earrings': 'Sick of earrings that cause allergic reactions?',
      'ring': 'Done with rings that fade or turn your finger green?'
    };
    
    const productType = primaryKeyword.split(' ')[1] || 'jewelry';
    const problem = problems[productType] || 'Tired of jewelry that disappoints?';
    
    return `${problem} Our ${quality} design stays perfect through daily wear, swimming, and showers.`;
  }

  private getEmotionalBenefits(secondaryKeywords: any[], specs: any): string[] {
    const benefits = [
      'Feel elegant at work meetings and weekend brunches',
      'Boost confidence with waterproof luxury you can trust'
    ];
    
    if (secondaryKeywords.length > 0) {
      const keyword = secondaryKeywords[0].keyword;
      benefits.push(`Perfect ${keyword} for special moments that matter`);
    }
    
    if (specs.chainLength) {
      benefits.push(`Comfortable ${specs.chainLength} length fits perfectly`);
    }
    
    return benefits.slice(0, 3); // Max 3 for mobile scanning
  }

  private getVisualDescription(colors: string[]): string {
    const visualMap: { [key: string]: string } = {
      'gold': 'Warm golden',
      'silver': 'Cool silver',
      'rose gold': 'Romantic rose gold',
      'PVD': 'Premium PVD'
    };
    
    const primaryColor = colors[0].toLowerCase();
    return visualMap[primaryColor] || 'Polished';
  }

  private getMainQuality(product: any): string {
    const description = (product.description || product.body_html || '').toLowerCase();
    
    if (description.includes('waterproof')) return 'Waterproof';
    if (description.includes('tarnish-free')) return 'Tarnish-Free';
    if (description.includes('hypoallergenic')) return 'Hypoallergenic';
    if (description.includes('316l')) return 'Premium';
    
    return 'Luxury';
  }

  private extractProductSpecs(description: string): {
    material?: string;
    chainLength?: string;
    colors?: string[];
  } {
    const specs: any = {};
    
    // Extract material
    if (description.includes('316L') || description.includes('stainless steel')) {
      specs.material = '316L stainless steel';
    }
    
    // Extract chain length
    const chainMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:CM|cm)\s*(?:\+\s*\d+(?:\.\d+)?CM|extension)?/i);
    if (chainMatch) {
      specs.chainLength = chainMatch[0];
    }
    
    // Extract colors/finishes
    const colorKeywords = ['gold', 'silver', 'rose gold', 'PVD'];
    specs.colors = colorKeywords.filter(color => 
      description.toLowerCase().includes(color.toLowerCase())
    );
    
    return specs;
  }

  private extractOriginalSpecifications(originalDescription: string): string | null {
    if (!originalDescription) return null;
    
    // Look for the structured specifications section (both "SPECIFICATION" and "Specifications:")
    const specSectionMatch = originalDescription.match(/<h3>SPECIFICATION<\/h3>[\s\S]*?(?=<h[1-6]|$)/i);
    
    if (specSectionMatch) {
      // Clean up the specifications section
      let specs = specSectionMatch[0]
        .replace(/<h3>SPECIFICATION<\/h3>/i, '') // Remove the header
        .replace(/<\/?[^>]+(>|$)/g, '') // Remove all HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/(Material:|Weight:|Chain Length:|Pendant Size:|Colour Options:|Note:)/g, '\n$1') // Add line breaks before each spec
        .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
        .trim();
      
      // If it's a substantial specifications section, return it
      if (specs.length > 20) {
        return specs;
      }
    }
    
    // Fallback: look for common specification patterns if no structured section found
    const specPatterns = [
      // Material patterns
      /(Material:\s*[^\n]+)/gi,
      // Weight patterns
      /(Weight:\s*[^\n]+)/gi,
      // Size patterns
      /(Size:\s*[^\n]+|Width:\s*[^\n]+|Length:\s*[^\n]+|Chain Length:\s*[^\n]+|Pendant Size:\s*[^\n]+)/gi,
      // Color patterns
      /(Colour?\s*Options?:\s*[^\n]+)/gi,
      // Note patterns
      /(Note:\s*[^\n]+)/gi
    ];
    
    const foundSpecs: string[] = [];
    
    specPatterns.forEach(pattern => {
      const matches = originalDescription.match(pattern);
      if (matches) {
        foundSpecs.push(...matches);
      }
    });
    
    if (foundSpecs.length === 0) return null;
    
    return foundSpecs.join('\n\n');
  }

  // EMOTIONAL STORYTELLING METHODS
  // These methods create genuine emotional connections with jewelry buyers

  private generateComprehensiveEmotionalHook(product: any, primaryKeyword: any, analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    // Get emotional and commercial long-tail keywords for natural integration
    const emotionalKeywords = analysis.longTailKeywords.filter(kw => 
      kw.keyword.includes('romantic') || 
      kw.keyword.includes('elegant') || 
      kw.keyword.includes('special occasion') ||
      kw.keyword.includes('meaningful') ||
      kw.keyword.includes('timeless') ||
      kw.keyword.includes('luxury')
    );
    
    const commercialKeywords = analysis.longTailKeywords.filter(kw => 
      kw.keyword.includes('gift') || 
      kw.keyword.includes('buy') || 
      kw.keyword.includes('online')
    );
    
    const selectedEmotionalKeyword = emotionalKeywords[0]?.keyword || primaryKeyword.keyword;
    const selectedCommercialKeyword = commercialKeywords[0]?.keyword || 'jewelry';
    
    // Comprehensive emotional hooks with multiple keyword integration
    const comprehensiveHooks = [
      `**Discover the perfect ${selectedEmotionalKeyword} that captures hearts and creates lasting memories** - this exquisite piece combines timeless elegance with modern sophistication, making it the ideal ${selectedCommercialKeyword} for the special woman in your life.`,
      `**Transform any moment into magic with this stunning ${primaryKeyword.keyword}** - crafted with love and attention to detail, this beautiful piece tells a story of romance, devotion, and the precious moments you'll share together.`,
      `**Every love story deserves a breathtaking ${selectedEmotionalKeyword}** - this gorgeous piece is more than just jewelry; it's a symbol of your deepest feelings and a testament to the beautiful bond you share.`,
      `**Create unforgettable memories with this elegant ${primaryKeyword.keyword}** - designed to make her feel truly special, this romantic gift will become her most treasured possession and a constant reminder of your love.`,
      `**She'll fall in love with this meaningful ${selectedEmotionalKeyword}** - a timeless piece that captures the essence of romance and sophistication, perfect for celebrating your most precious moments together.`,
      `**This beautiful ${primaryKeyword.keyword} tells a love story** - every glance will remind her of your thoughtfulness, making it the perfect ${selectedCommercialKeyword} for anniversaries, Valentine's Day, or just because you love her.`,
      `**Celebrate your love with this exquisite ${selectedEmotionalKeyword}** - a meaningful gift that lasts forever, designed to make her feel like the most special woman in the world.`,
      `**She'll treasure this stunning ${primaryKeyword.keyword} forever** - a symbol of your love and devotion that will be passed down through generations as a cherished family heirloom.`
    ];
    
    const seed = this.hashString(productId + productName + 'comprehensive_hook');
    return comprehensiveHooks[seed % comprehensiveHooks.length];
  }

  private generateEmotionalHook(product: any, primaryKeyword: any, analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    // Get emotional long-tail keywords for natural integration
    const emotionalKeywords = analysis.longTailKeywords.filter(kw => 
      kw.keyword.includes('romantic') || 
      kw.keyword.includes('elegant') || 
      kw.keyword.includes('special occasion') ||
      kw.keyword.includes('meaningful') ||
      kw.keyword.includes('timeless')
    );
    
    const selectedEmotionalKeyword = emotionalKeywords[0]?.keyword || primaryKeyword.keyword;
    
    // Emotional hooks that connect with jewelry buyers and use keywords naturally
    const romanticHooks = [
      `**Capture her heart with this stunning piece** - a symbol of love that speaks volumes without saying a word.`,
      `**Every love story deserves a beautiful ${selectedEmotionalKeyword}** - this exquisite piece will become her most treasured accessory.`,
      `**Make every moment magical with this elegant jewelry** - crafted to celebrate the special woman in your life.`,
      `**She'll fall in love with this gorgeous ${selectedEmotionalKeyword}** - a timeless piece that captures the essence of romance.`,
      `**Create unforgettable memories with this romantic gift** - designed to make her feel truly special.`,
      `**This beautiful ${selectedEmotionalKeyword} tells a love story** - every glance will remind her of your thoughtfulness.`,
      `**Celebrate your love with this exquisite jewelry** - a meaningful gift that lasts forever.`,
      `**She'll treasure this stunning piece forever** - a symbol of your love and devotion.`
    ];
    
    const seed = this.hashString(productId + productName + 'hook');
    return romanticHooks[seed % romanticHooks.length];
  }

  private generateRomanticNarrative(product: any, primaryKeyword: any, secondaryKeywords: any[]): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    // Get secondary keywords for natural integration
    const luxuryKeyword = secondaryKeywords.find(kw => 
      kw.keyword.includes('luxury') || 
      kw.keyword.includes('elegant') || 
      kw.keyword.includes('sophisticated')
    )?.keyword || 'beautiful jewelry';
    
    // Romantic narratives that tell a story and use keywords naturally
    const romanticNarratives = [
      `Imagine the look in her eyes when she opens this ${luxuryKeyword}. Every time she wears it, she'll remember the moment you gave it to her - a precious memory that lasts a lifetime.`,
      `This stunning piece isn't just jewelry; it's a love letter in precious metal. She'll feel your love every time she touches it, making every day feel like a special occasion.`,
      `When you give her this elegant ${luxuryKeyword}, you're not just giving her jewelry - you're giving her a piece of your heart. She'll treasure it as a symbol of your devotion.`,
      `Every woman deserves to feel like a queen, and this gorgeous piece will make her feel exactly that. It's more than an accessory; it's a declaration of love.`,
      `This romantic gift tells a story of love, commitment, and the beautiful moments you'll share together. She'll wear it with pride, knowing it came from your heart.`,
      `Picture her face lighting up when she sees this exquisite jewelry. It's not just a gift; it's a promise of forever, wrapped in elegance and love.`,
      `This meaningful piece will become her most cherished possession - a constant reminder of your love and the special bond you share.`,
      `When she wears this stunning jewelry, she'll feel your love surrounding her. It's a beautiful way to show her how much she means to you.`
    ];
    
    const seed = this.hashString(productId + productName + 'narrative');
    return romanticNarratives[seed % romanticNarratives.length];
  }

  private generateGenuineEmotionalBenefits(product: any, analysis: SEOAnalysis, specs: any): string[] {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    // Short, scannable emotional benefits
    const emotionalBenefitSets = [
      [
        'Makes her feel truly special',
        'Reminds her of your love daily',
        'Becomes her most treasured piece'
      ],
      [
        'Boosts her confidence instantly',
        'Draws compliments everywhere',
        'Symbol of your devotion'
      ],
      [
        'Elegant for any occasion',
        'Makes her feel loved',
        'Worn with pride and joy'
      ],
      [
        'Radiant and confident look',
        'Cherished reminder of your bond',
        'Beautiful expression of love'
      ],
      [
        'Makes her feel like a queen',
        'Turns every day special',
        'Beautiful and loved feeling'
      ]
    ];
    
    const seed = this.hashString(productId + productName + 'benefits');
    return emotionalBenefitSets[seed % emotionalBenefitSets.length];
  }

  private generateRomanticOccasions(product: any, longTailKeywords: any[]): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    // Get occasion-related keywords
    const occasionKeywords = longTailKeywords.filter(kw => 
      kw.keyword.includes('anniversary') || 
      kw.keyword.includes('valentine') || 
      kw.keyword.includes('birthday') ||
      kw.keyword.includes('engagement') ||
      kw.keyword.includes('gift')
    );
    
    const occasionKeyword = occasionKeywords[0]?.keyword || 'gift';
    
    // Concise romantic occasions
    const romanticOccasions = [
      `**Perfect for:** Anniversaries, Valentine's Day, birthdays, engagements, or just because you love her.`,
      `**Ideal ${occasionKeyword} for:** Special celebrations, romantic gestures, or milestone moments.`,
      `**Great for:** Love declarations, special surprises, or romantic dates.`,
      `**Perfect ${occasionKeyword} for:** The woman who deserves the world.`,
      `**Ideal for:** Meaningful moments and love celebrations.`
    ];
    
    const seed = this.hashString(productId + productName + 'occasions');
    return romanticOccasions[seed % romanticOccasions.length];
  }

  private generateQualityAssurance(product: any, specs: any, semanticKeywords: string[]): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    // Short quality assurance
    const qualityAssurances = [
      `**Quality Promise:** Crafted with love and premium materials that last as long as your love.`,
      `**Built to Last:** Designed to be treasured for generations to come.`,
      `**Premium Materials:** Made with the finest craftsmanship and attention to detail.`,
      `**Enduring Quality:** Built to last and designed to be cherished forever.`,
      `**Lasting Beauty:** High-quality materials ensure it remains beautiful for years.`
    ];
    
    const seed = this.hashString(productId + productName + 'quality');
    return qualityAssurances[seed % qualityAssurances.length];
  }

  private generateEmotionalCommercialIntent(product: any, primaryKeyword: any, analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    // Get commercial keywords for natural integration
    const commercialKeywords = analysis.longTailKeywords.filter(kw => 
      kw.keyword.includes('buy') || 
      kw.keyword.includes('gift') || 
      kw.keyword.includes('online') ||
      kw.keyword.includes('affordable')
    );
    
    const giftKeyword = commercialKeywords.find(kw => kw.keyword.includes('gift'))?.keyword || 'gift';
    
    // Short, scannable commercial intent
    const emotionalCommercialIntents = [
      `**Order today** and watch her face light up with joy. Free shipping NZ.`,
      `**Make her day** - order now and create a memory she'll treasure forever.`,
      `**Give her the perfect ${giftKeyword}** - order today and make her feel special.`,
      `**Show her you care** - order now and create a moment she'll never forget.`,
      `**Make her heart skip** - order today and give her a gift from the heart.`
    ];
    
    const seed = this.hashString(productId + productName + 'commercial');
    return emotionalCommercialIntents[seed % emotionalCommercialIntents.length];
  }


  private getProductType(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('necklace')) return 'necklace';
    if (titleLower.includes('bracelet')) return 'bracelet';
    if (titleLower.includes('earring')) return 'earrings';
    if (titleLower.includes('ring')) return 'ring';
    return 'jewelry';
  }

  // COMPREHENSIVE SEO GENERATION METHODS
  // These methods create detailed, keyword-rich content without length restrictions

  private generateDetailedProductDescription(product: any, analysis: SEOAnalysis, specs: any): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    const primaryKeyword = analysis.primaryKeywords[0];
    const secondaryKeywords = analysis.secondaryKeywords.slice(0, 3);
    const semanticKeywords = analysis.semanticKeywords.slice(0, 5);
    
    // Create detailed descriptions with multiple keyword variations
    const detailedDescriptions = [
      `This exquisite ${primaryKeyword.keyword} showcases the perfect blend of ${secondaryKeywords[0]?.keyword || 'elegant design'} and ${secondaryKeywords[1]?.keyword || 'timeless beauty'}. Crafted with meticulous attention to detail, this stunning piece features ${semanticKeywords[0] || 'premium materials'} and ${semanticKeywords[1] || 'expert craftsmanship'} that ensures lasting beauty and durability. The ${productType} design incorporates ${semanticKeywords[2] || 'sophisticated elements'} that make it perfect for both everyday wear and special occasions.`,
      
      `Experience the allure of this magnificent ${primaryKeyword.keyword} that combines ${secondaryKeywords[0]?.keyword || 'classic elegance'} with ${secondaryKeywords[1]?.keyword || 'modern sophistication'}. Each piece is carefully crafted using ${semanticKeywords[0] || 'high-quality materials'} and ${semanticKeywords[1] || 'traditional techniques'}, resulting in a ${productType} that radiates ${semanticKeywords[2] || 'timeless charm'}. The intricate details and ${semanticKeywords[3] || 'premium finish'} make this piece a true work of art that will be treasured for years to come.`,
      
      `Discover the beauty of this exceptional ${primaryKeyword.keyword} that embodies ${secondaryKeywords[0]?.keyword || 'romantic elegance'} and ${secondaryKeywords[1]?.keyword || 'sophisticated style'}. Made with ${semanticKeywords[0] || 'premium materials'} and ${semanticKeywords[1] || 'expert precision'}, this gorgeous ${productType} features ${semanticKeywords[2] || 'intricate detailing'} and ${semanticKeywords[3] || 'luxurious finish'}. The design perfectly balances ${semanticKeywords[4] || 'classic appeal'} with ${semanticKeywords[5] || 'contemporary flair'}, making it an ideal choice for the modern woman who appreciates quality and style.`
    ];
    
    const seed = this.hashString(productId + productName + 'detailed_description');
    return detailedDescriptions[seed % detailedDescriptions.length];
  }

  private generateComprehensiveBenefits(product: any, analysis: SEOAnalysis, specs: any): string[] {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    const primaryKeyword = analysis.primaryKeywords[0];
    const secondaryKeywords = analysis.secondaryKeywords.slice(0, 3);
    const longTailKeywords = analysis.longTailKeywords.slice(0, 4);
    
    // Comprehensive benefit sets with multiple keyword variations
    const benefitSets = [
      [
        `Makes her feel truly special and loved with its ${primaryKeyword.keyword} charm`,
        `Boosts confidence and radiates elegance in any setting`,
        `Becomes her most treasured piece and conversation starter`,
        `Perfect for both casual and formal occasions`,
        `Crafted with ${secondaryKeywords[0]?.keyword || 'premium materials'} for lasting beauty`,
        `Easy to style with any outfit for versatile wear`,
        `Creates lasting memories and emotional connections`,
        `Designed to be passed down as a family heirloom`
      ],
      [
        `Draws compliments everywhere she goes with its stunning design`,
        `Symbol of your devotion and love for her`,
        `Enhances her natural beauty and personal style`,
        `Comfortable to wear all day without irritation`,
        `Made with ${secondaryKeywords[1]?.keyword || 'durable materials'} that resist tarnishing`,
        `Versatile enough for work, dates, and special events`,
        `Creates a sense of luxury and sophistication`,
        `Perfect ${longTailKeywords[0]?.keyword || 'gift for her'} that shows you care`
      ],
      [
        `Radiant and confident look that turns heads`,
        `Cherished reminder of your special bond`,
        `Beautiful expression of love and commitment`,
        `Timeless design that never goes out of style`,
        `Crafted with ${secondaryKeywords[2]?.keyword || 'attention to detail'} for quality`,
        `Easy to maintain and keep looking beautiful`,
        `Makes every day feel like a special occasion`,
        `Perfect for ${longTailKeywords[1]?.keyword || 'anniversary celebrations'} and milestones`
      ]
    ];
    
    const seed = this.hashString(productId + productName + 'comprehensive_benefits');
    return benefitSets[seed % benefitSets.length];
  }

  private generateOccasionSpecificContent(product: any, longTailKeywords: any[], analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    const primaryKeyword = analysis.primaryKeywords[0];
    const occasionKeywords = longTailKeywords.filter(kw => 
      kw.keyword.includes('anniversary') || 
      kw.keyword.includes('valentine') || 
      kw.keyword.includes('birthday') ||
      kw.keyword.includes('engagement') ||
      kw.keyword.includes('gift') ||
      kw.keyword.includes('wedding') ||
      kw.keyword.includes('holiday')
    );
    
    const selectedOccasionKeyword = occasionKeywords[0]?.keyword || 'special occasion';
    
    // Occasion-specific content with long-tail keyword integration
    const occasionContent = [
      `**Perfect for Every Special Moment:** This stunning ${primaryKeyword.keyword} is ideal for ${selectedOccasionKeyword}, romantic dinners, anniversary celebrations, Valentine's Day surprises, birthday presents, engagement proposals, and holiday gifts. Whether you're celebrating a milestone, expressing your love, or simply showing appreciation, this beautiful piece will make the moment unforgettable. The versatile design works perfectly for both intimate gatherings and grand celebrations, making it a truly special ${occasionKeywords[1]?.keyword || 'gift for her'} that she'll treasure forever.`,
      
      `**Ideal for Romantic Occasions:** Create magical memories with this exquisite ${primaryKeyword.keyword} that's perfect for ${selectedOccasionKeyword}, date nights, proposal moments, wedding anniversaries, and Valentine's Day celebrations. This romantic piece captures the essence of love and devotion, making it the perfect ${occasionKeywords[2]?.keyword || 'anniversary gift'} or ${occasionKeywords[3]?.keyword || 'birthday present'}. Whether it's a surprise proposal, a milestone celebration, or just because you love her, this beautiful jewelry will make the moment truly special and memorable.`,
      
      `**Celebrate Life's Beautiful Moments:** This gorgeous ${primaryKeyword.keyword} is designed for ${selectedOccasionKeyword}, holiday celebrations, graduation ceremonies, promotion achievements, and everyday moments of joy. The timeless elegance makes it perfect for ${occasionKeywords[4]?.keyword || 'wedding accessories'}, formal events, casual outings, and special surprises. Whether you're marking a significant milestone or simply expressing your love, this stunning piece will add beauty and meaning to every special moment in your relationship.`
    ];
    
    const seed = this.hashString(productId + productName + 'occasion_content');
    return occasionContent[seed % occasionContent.length];
  }

  private generateQualityAndCraftsmanship(product: any, specs: any, semanticKeywords: string[], analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    const primaryKeyword = analysis.primaryKeywords[0];
    const qualityKeywords = semanticKeywords.filter(kw => 
      kw.includes('quality') || 
      kw.includes('craftsmanship') || 
      kw.includes('premium') ||
      kw.includes('durable') ||
      kw.includes('expert') ||
      kw.includes('professional')
    );
    
    // Quality and craftsmanship content with semantic keywords
    const qualityContent = [
      `**Superior Quality & Expert Craftsmanship:** This exceptional ${primaryKeyword.keyword} is crafted with ${qualityKeywords[0] || 'premium materials'} and ${qualityKeywords[1] || 'expert techniques'} that ensure lasting beauty and durability. Each piece undergoes ${qualityKeywords[2] || 'rigorous quality control'} to meet the highest standards of ${qualityKeywords[3] || 'jewelry craftsmanship'}. The ${qualityKeywords[4] || 'professional finishing'} and attention to detail result in a ${productType} that maintains its luster and beauty for years to come. Our commitment to ${qualityKeywords[5] || 'excellence'} means you're investing in a piece that will be treasured for generations.`,
      
      `**Premium Materials & Artisan Craftsmanship:** Experience the difference of ${qualityKeywords[0] || 'superior quality'} with this beautiful ${primaryKeyword.keyword} made from ${qualityKeywords[1] || 'premium materials'} and crafted using ${qualityKeywords[2] || 'traditional techniques'}. Each piece is carefully inspected for ${qualityKeywords[3] || 'flawless finish'} and ${qualityKeywords[4] || 'perfect construction'}, ensuring you receive a ${productType} that exceeds expectations. The ${qualityKeywords[5] || 'expert craftsmanship'} and ${qualityKeywords[6] || 'attention to detail'} create a piece that's not just beautiful, but built to last and be passed down as a cherished family heirloom.`,
      
      `**Excellence in Every Detail:** This stunning ${primaryKeyword.keyword} represents the pinnacle of ${qualityKeywords[0] || 'jewelry artistry'} and ${qualityKeywords[1] || 'quality manufacturing'}. Crafted with ${qualityKeywords[2] || 'premium materials'} and ${qualityKeywords[3] || 'precision techniques'}, each piece is designed to showcase ${qualityKeywords[4] || 'exceptional beauty'} and ${qualityKeywords[5] || 'lasting durability'}. Our commitment to ${qualityKeywords[6] || 'perfection'} means every ${productType} meets the highest standards of ${qualityKeywords[7] || 'craftsmanship'}, ensuring you receive a piece that will be admired and treasured for a lifetime.`
    ];
    
    const seed = this.hashString(productId + productName + 'quality_content');
    return qualityContent[seed % qualityContent.length];
  }

  private generateStylingAndCareInstructions(product: any, analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    const primaryKeyword = analysis.primaryKeywords[0];
    const stylingKeywords = analysis.semanticKeywords.filter(kw => 
      kw.includes('style') || 
      kw.includes('fashion') || 
      kw.includes('outfit') ||
      kw.includes('wear') ||
      kw.includes('care') ||
      kw.includes('maintenance')
    );
    
    // Styling and care instructions with semantic keywords
    const stylingContent = [
      `**Styling & Care Instructions:** This versatile ${primaryKeyword.keyword} pairs beautifully with ${stylingKeywords[0] || 'elegant evening wear'}, ${stylingKeywords[1] || 'casual day outfits'}, and ${stylingKeywords[2] || 'professional attire'}. For optimal ${stylingKeywords[3] || 'jewelry care'}, gently clean with a soft cloth and store in a dry place. Avoid contact with ${stylingKeywords[4] || 'harsh chemicals'} and remove before swimming or exercising. The ${stylingKeywords[5] || 'timeless design'} ensures it complements any style, from ${stylingKeywords[6] || 'bohemian chic'} to ${stylingKeywords[7] || 'classic elegance'}, making it a versatile addition to any jewelry collection.`,
      
      `**Perfect Styling Tips:** This gorgeous ${primaryKeyword.keyword} enhances any look, whether you're dressing for ${stylingKeywords[0] || 'a romantic dinner'}, ${stylingKeywords[1] || 'a business meeting'}, or ${stylingKeywords[2] || 'a casual outing'}. For ${stylingKeywords[3] || 'proper maintenance'}, gently wipe with a jewelry cloth and avoid exposure to ${stylingKeywords[4] || 'perfumes and lotions'}. The ${stylingKeywords[5] || 'versatile design'} works with ${stylingKeywords[6] || 'vintage styles'}, ${stylingKeywords[7] || 'modern fashion'}, and ${stylingKeywords[8] || 'classic looks'}, ensuring it remains a favorite piece for years to come.`,
      
      `**Style & Maintenance Guide:** This elegant ${primaryKeyword.keyword} complements ${stylingKeywords[0] || 'formal occasions'}, ${stylingKeywords[1] || 'everyday wear'}, and ${stylingKeywords[2] || 'special events'}. To maintain its ${stylingKeywords[3] || 'beautiful shine'}, clean gently with a soft brush and mild soap, then dry thoroughly. Store separately to prevent ${stylingKeywords[4] || 'scratches and tangling'}. The ${stylingKeywords[5] || 'sophisticated design'} pairs perfectly with ${stylingKeywords[6] || 'evening gowns'}, ${stylingKeywords[7] || 'business suits'}, and ${stylingKeywords[8] || 'casual jeans'}, making it an essential piece for any fashion-forward woman.`
    ];
    
    const seed = this.hashString(productId + productName + 'styling_content');
    return stylingContent[seed % stylingContent.length];
  }

  private generateEmotionalStorytelling(product: any, analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    const primaryKeyword = analysis.primaryKeywords[0];
    const emotionalKeywords = analysis.longTailKeywords.filter(kw => 
      kw.keyword.includes('romantic') || 
      kw.keyword.includes('love') || 
      kw.keyword.includes('special') ||
      kw.keyword.includes('meaningful') ||
      kw.keyword.includes('treasure')
    );
    
    // Emotional storytelling with commercial intent keywords
    const emotionalStories = [
      `**A Love Story in Every Detail:** This beautiful ${primaryKeyword.keyword} tells a story of love, commitment, and the precious moments you'll share together. Every time she wears it, she'll remember the thought and care you put into choosing the perfect piece. The ${emotionalKeywords[0]?.keyword || 'romantic design'} captures the essence of your relationship, making it more than just jewelry - it's a symbol of your love story. Whether it's for ${emotionalKeywords[1]?.keyword || 'a special anniversary'} or just because you love her, this piece will create memories that last a lifetime.`,
      
      `**Creating Memories That Last Forever:** Imagine the joy in her eyes when she opens this stunning ${primaryKeyword.keyword}. This ${emotionalKeywords[0]?.keyword || 'meaningful gift'} represents your love, devotion, and the beautiful future you're building together. Every glance at this piece will remind her of your love and the special moments you've shared. The ${emotionalKeywords[1]?.keyword || 'romantic elegance'} makes it perfect for ${emotionalKeywords[2]?.keyword || 'proposal moments'}, anniversaries, or any time you want to show her how much she means to you.`,
      
      `**A Treasure for Generations:** This exquisite ${primaryKeyword.keyword} is more than just beautiful jewelry - it's a ${emotionalKeywords[0]?.keyword || 'cherished heirloom'} that will be passed down through your family. The ${emotionalKeywords[1]?.keyword || 'timeless design'} and ${emotionalKeywords[2]?.keyword || 'emotional significance'} make it perfect for marking life's most important moments. Whether it's celebrating your love, honoring a milestone, or simply expressing your feelings, this piece will become a treasured part of your family's story.`
    ];
    
    const seed = this.hashString(productId + productName + 'emotional_story');
    return emotionalStories[seed % emotionalStories.length];
  }

  private generateComprehensiveCommercialIntent(product: any, primaryKeyword: any, analysis: SEOAnalysis): string {
    const productType = this.getProductType(product.title);
    const productName = product.title.toLowerCase();
    const productId = product.id || '0';
    
    const commercialKeywords = analysis.longTailKeywords.filter(kw => 
      kw.keyword.includes('buy') || 
      kw.keyword.includes('gift') || 
      kw.keyword.includes('online') ||
      kw.keyword.includes('order') ||
      kw.keyword.includes('shipping')
    );
    
    const giftKeyword = commercialKeywords.find(kw => kw.keyword.includes('gift'))?.keyword || 'gift';
    const buyKeyword = commercialKeywords.find(kw => kw.keyword.includes('buy'))?.keyword || 'buy online';
    
    // Comprehensive commercial intent with multiple keyword variations
    const commercialIntents = [
      `**Order Today & Create Magic:** Don't wait to make her dreams come true! ${buyKeyword} now and watch her face light up with joy when she receives this stunning ${primaryKeyword.keyword}. With fast shipping across New Zealand and a satisfaction guarantee, you can shop with confidence. This ${giftKeyword} is perfect for any occasion and comes beautifully packaged, ready to create the perfect surprise. Order now and make her feel like the most special woman in the world!`,
      
      `**Give Her the Perfect ${giftKeyword}:** Show her how much you care with this beautiful ${primaryKeyword.keyword} that's sure to steal her heart. ${buyKeyword} today and enjoy free shipping throughout New Zealand, plus our 30-day return policy for complete peace of mind. This romantic piece is perfect for anniversaries, Valentine's Day, birthdays, or just because you love her. Order now and create a memory she'll treasure forever!`,
      
      `**Make Her Heart Skip a Beat:** This gorgeous ${primaryKeyword.keyword} is waiting to become her most treasured piece. ${buyKeyword} now and enjoy fast, free shipping across New Zealand. Our secure checkout and satisfaction guarantee ensure a worry-free shopping experience. Whether it's for a special occasion or just because, this ${giftKeyword} will show her exactly how much she means to you. Order today and make her feel truly loved!`
    ];
    
    const seed = this.hashString(productId + productName + 'comprehensive_commercial');
    return commercialIntents[seed % commercialIntents.length];
  }

  // Hash function to generate deterministic but unique seeds for each product
  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const keywordResearchService = new KeywordResearchService();
