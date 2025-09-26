import { ShopifyProduct } from '@jewelry-seo/shared';

const BRAND_VOICE = `
**Brand Voice and Tone:**
- **Accessible Luxury:** Professional yet approachable, sophisticated but not intimidating.
- **Focus:** Versatility (from professional settings to casual outings), durability, and creating a polished look with minimal effort.
- **Value Proposition:** High-quality, stylish jewelry that is easy to maintain and affordable.
- **Target Audience:** Professional women in New Zealand.
- **Key Features to Highlight:** 316L stainless steel, hypoallergenic, waterproof, tarnish-free, 1-year warranty.
`;

export const generateSeoTitlePrompt = (product: ShopifyProduct): string => {
  return `
${BRAND_VOICE}

**Task:** Generate 5 compelling and SEO-optimized titles for a jewelry product.

**Product Information:**
- **Title:** ${product.title}
- **Type:** ${product.productType}
- **Vendor:** ${product.vendor}
- **Tags:** ${product.tags.join(', ')}

**Instructions:**
- Each title must be under 60 characters.
- Incorporate relevant keywords from the product information.
- Reflect the brand voice: accessible luxury, durable, versatile.
- Target professional women in New Zealand.

**Example Format:**
1. [Title 1]
2. [Title 2]
3. [Title 3]
4. [Title 4]
5. [Title 5]
  `;
};

export const generateSeoDescriptionPrompt = (product: ShopifyProduct): string => {
  return `
${BRAND_VOICE}

**Task:** Write an engaging, SEO-optimized meta description for a jewelry product.

**Product Information:**
- **Title:** ${product.title}
- **Description:** ${product.description}
- **Type:** ${product.productType}
- **Materials:** 316L Stainless Steel
- **Features:** Hypoallergenic, Waterproof, Tarnish-Free

**Instructions:**
- The description must be between 150 and 160 characters.
- Start with a strong hook to capture interest.
- Highlight key features like durability, material, and versatility.
- End with a clear call-to-action.
- Naturally weave in keywords related to the product.
- Adhere to the brand voice.
  `;
};

export const generateProductDescriptionPrompt = (product: ShopifyProduct): string => {
  return `
${BRAND_VOICE}

**Task:** Enhance the product description for a piece of jewelry to be more engaging, informative, and SEO-friendly.

**Product Information:**
- **Title:** ${product.title}
- **Current Description:** ${product.description}
- **Type:** ${product.productType}
- **Vendor:** ${product.vendor}
- **Tags:** ${product.tags.join(', ')}

**Instructions:**
- Rewrite the description to be more narrative and appealing.
- Emphasize the lifestyle and benefits (e.g., "from beach to boardroom").
- Clearly state the key features: 316L stainless steel, hypoallergenic, waterproof, tarnish-free, and the 1-year warranty.
- Structure the description with clear headings or bullet points for readability.
- Ensure the tone aligns perfectly with "accessible luxury."
  `;
};
