# Shopify Store Setup Guide

## To sync your real Shopify products, follow these steps:

### 1. Get Shopify API Credentials

1. **Log in to your Shopify Admin**
2. Go to **Apps** → **Develop apps**
3. Click **Create app**
4. Give it a name (e.g., "Jewelry SEO Automation")
5. Configure **Admin API integration**:
   - Check **Products** (read access)
   - Check **Orders** (read access)
   - Check **Customers** (read access)

6. **Create the app** and install it
7. **Copy your credentials**:
   - API Key
   - API Secret
   - Admin API access token

### 2. Update Environment Variables

Edit the `.env` file in the project root:

```bash
# Your Shopify Store Configuration
SHOPIFY_STORE_NAME=your-store-name.myshopify.com
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_ACCESS_TOKEN=shpat_your_access_token_here

# Example:
SHOPIFY_STORE_NAME=ohh-glam.myshopify.com
SHOPIFY_API_KEY=b4b8e3e3a3e3e3e3e3e3e3e3e3e3e3e
SHOPIFY_API_SECRET=shpss_your_secret_key_here
SHOPIFY_ACCESS_TOKEN=shpat_your_access_token_here
```

### 3. Restart the Servers

Stop the current test server and start the real API server:

```bash
# Stop test server
pkill -f "test-server-fixed.js"

# Start real API server
cd apps/api
pnpm dev
```

### 4. Test Real Sync

1. Go to http://localhost:4000
2. Navigate to Products page
3. Click "Sync Products" button
4. You should see your real Shopify products!

## Troubleshooting

### Common Issues:
- **401 Unauthorized**: Check your API credentials
- **404 Not Found**: Verify your store name
- **Rate Limited**: Wait a few minutes and try again
- **No Products**: Make sure your store has products

### How to Check Logs:
```bash
# Check API server logs
cd apps/api
pnpm dev

# Look for messages like:
# "Starting to fetch all products from Shopify"
# "Successfully fetched X products"
```

## Ready to Test!

Once you have your Shopify credentials, replace the demo server with the real one and you'll see your actual jewelry products instead of the demo items.