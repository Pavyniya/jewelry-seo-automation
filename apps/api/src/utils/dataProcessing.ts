import { Product, ProductImage, ProductVariant } from '@jewelry-seo/shared';
import { logger } from './logger';

export class DataProcessingUtils {
  static cleanDescription(description: string): string {
    return description
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  static extractKeywords(text: string, maxKeywords: number = 10): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'what', 'which', 'who',
      'whom', 'whose', 'where', 'when', 'why', 'how', 'there', 'here', 'some', 'any', 'no', 'every', 'each'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  static generateSEOTitle(product: Product, maxLength: number = 60): string {
    const baseTitle = product.title;

    if (baseTitle.length <= maxLength) {
      return baseTitle;
    }

    const titleParts = baseTitle.split(' ');
    let shortenedTitle = titleParts[0];

    for (let i = 1; i < titleParts.length; i++) {
      if ((shortenedTitle + ' ' + titleParts[i]).length <= maxLength - 3) {
        shortenedTitle += ' ' + titleParts[i];
      } else {
        break;
      }
    }

    return shortenedTitle.length < baseTitle.length - 3
      ? shortenedTitle + '...'
      : baseTitle.substring(0, maxLength - 3) + '...';
  }

  static generateSEODescription(product: Product, maxLength: number = 160): string {
    const cleanDesc = this.cleanDescription(product.description);

    if (cleanDesc.length <= maxLength) {
      return cleanDesc;
    }

    const sentences = cleanDesc.split(/[.!?]+/);
    let description = sentences[0];

    for (let i = 1; i < sentences.length; i++) {
      if ((description + '. ' + sentences[i]).length <= maxLength - 3) {
        description += '. ' + sentences[i];
      } else {
        break;
      }
    }

    return description.length < cleanDesc.length - 3
      ? description + '...'
      : cleanDesc.substring(0, maxLength - 3) + '...';
  }

  static generateAltText(product: Product, image: ProductImage): string {
    const keywords = this.extractKeywords(product.title + ' ' + product.description, 5);

    if (image.altText && image.altText.trim()) {
      return image.altText;
    }

    return `${product.title} - ${keywords.slice(0, 3).join(', ')} jewelry`;
  }

  static categorizeProduct(product: Product): {
    category: string;
    subcategory?: string;
    material?: string;
    style?: string;
  } {
    const title = product.title.toLowerCase();
    const description = product.description.toLowerCase();
    const tags = product.tags.map(tag => tag.toLowerCase());
    const allText = `${title} ${description} ${tags.join(' ')}`;

    const categorization = {
      category: 'Uncategorized',
      subcategory: undefined as string | undefined,
      material: undefined as string | undefined,
      style: undefined as string | undefined,
    };

    const categories = {
      rings: ['ring', 'band', 'engagement', 'wedding', 'promise'],
      necklaces: ['necklace', 'pendant', 'chain', 'choker', 'lariat'],
      earrings: ['earring', 'stud', 'hoop', 'drop', 'dangle', 'chandelier'],
      bracelets: ['bracelet', 'bangle', 'cuff', 'tennis', 'charm'],
      brooches: ['brooch', 'pin', 'clasp'],
      watches: ['watch', 'timepiece'],
    };

    const materials = {
      gold: ['gold', '14k', '18k', '24k', 'yellow gold', 'white gold', 'rose gold'],
      silver: ['silver', 'sterling', '925'],
      platinum: ['platinum'],
      diamond: ['diamond', 'diamonds'],
      pearl: ['pearl', 'pearls'],
      gemstone: ['ruby', 'emerald', 'sapphire', 'amethyst', 'topaz', 'garnet'],
    };

    const styles = {
      vintage: ['vintage', 'antique', 'art deco', 'victorian', 'edwardian'],
      modern: ['modern', 'contemporary', 'minimalist', 'geometric'],
      classic: ['classic', 'traditional', 'timeless', 'elegant'],
      bohemian: ['bohemian', 'boho', 'earthy', 'natural'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        categorization.category = category;
        break;
      }
    }

    for (const [material, keywords] of Object.entries(materials)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        categorization.material = material;
        break;
      }
    }

    for (const [style, keywords] of Object.entries(styles)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        categorization.style = style;
        break;
      }
    }

    return categorization;
  }

  static calculateProductScore(product: Product): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (!product.description || product.description.length < 50) {
      issues.push('Description is too short or missing');
      recommendations.push('Add detailed product description (minimum 50 characters)');
      score -= 20;
    }

    if (!product.seoTitle || product.seoTitle.length > 60) {
      issues.push('SEO title is missing or too long');
      recommendations.push('Add SEO title (maximum 60 characters)');
      score -= 15;
    }

    if (!product.seoDescription || product.seoDescription.length > 160) {
      issues.push('SEO description is missing or too long');
      recommendations.push('Add SEO description (maximum 160 characters)');
      score -= 15;
    }

    if (product.images.length === 0) {
      issues.push('No product images');
      recommendations.push('Add high-quality product images');
      score -= 25;
    }

    const imagesWithoutAlt = product.images.filter(img => !img.altText);
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
      recommendations.push('Add descriptive alt text to all images');
      score -= 10;
    }

    if (product.variants.length === 0) {
      issues.push('No product variants');
      recommendations.push('Add product variants with different sizes/options');
      score -= 10;
    }

    if (product.tags.length < 3) {
      issues.push('Insufficient product tags');
      recommendations.push('Add relevant product tags (minimum 3-5)');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  static optimizeImageUrl(imageUrl: string, width?: number, height?: number): string {
    try {
      const url = new URL(imageUrl);

      if (width) {
        url.searchParams.set('width', width.toString());
      }

      if (height) {
        url.searchParams.set('height', height.toString());
      }

      if (!width && !height) {
        url.searchParams.set('width', '800');
        url.searchParams.set('crop', 'center');
      }

      return url.toString();
    } catch (error) {
      logger.warn('Failed to optimize image URL:', { imageUrl, error });
      return imageUrl;
    }
  }

  static sanitizeTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
  }

  static validateProductData(product: Partial<Product>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!product.title || product.title.trim().length === 0) {
      errors.push('Product title is required');
    }

    if (product.title && product.title.length > 255) {
      warnings.push('Product title is very long (255+ characters)');
    }

    if (product.description && product.description.length > 5000) {
      warnings.push('Product description is very long (5000+ characters)');
    }

    if (product.variants && product.variants.length > 100) {
      warnings.push('Product has many variants (100+) which may impact performance');
    }

    if (product.images && product.images.length > 25) {
      warnings.push('Product has many images (25+) which may impact performance');
    }

    if (product.tags && product.tags.length > 50) {
      warnings.push('Product has many tags (50+) which may not be optimal');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}