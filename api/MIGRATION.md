# Migration Guide: Embedded API to Standalone Azure Function App

This guide helps you migrate from the embedded API (within Static Web App) to the standalone Azure Function App deployment.

## Overview

**Before**: API functions were embedded within the Static Web App deployment at `/wheel-of-lunch/api`
**After**: API is a separate Azure Function App that can be deployed and scaled independently

## Benefits of Separation

1. **Independent Scaling**: Scale API and frontend independently based on usage
2. **Cost Optimization**: Pay only for what you use with consumption-based pricing
3. **Security Isolation**: Better security boundaries between frontend and backend
4. **Deployment Flexibility**: Deploy API changes without redeploying frontend
5. **Performance**: Dedicated resources for API processing
6. **Monitoring**: Separate Application Insights for API-specific metrics

## Migration Steps

### Step 1: Provision Azure Resources

Run the automated setup script:

```bash
cd api
./setup-azure.sh
```

Or manually create resources following `DEPLOYMENT.md`.

### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository:

1. **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**
   - Download from Azure Portal: Function App → Deployment Center → Manage publish profile
   
2. **AZURE_SUBSCRIPTION_ID**
   ```bash
   az account show --query id -o tsv
   ```
   
3. **AZURE_RESOURCE_GROUP**
   - Use: `wheel-of-lunch-rg` (or your chosen name)
   
4. **API_BASE_URL** (for frontend)
   ```
   https://wheel-of-lunch-api.azurewebsites.net/api
   ```

### Step 3: Configure Function App Settings

Set the Google API credentials in your Function App:

```bash
az functionapp config appsettings set \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --settings \
    "GOOGLE_API_KEY=your-google-api-key" \
    "GOOGLE_SIGNING_SECRET=your-signing-secret"
```

### Step 4: Deploy the API

The API will automatically deploy when you:
1. Push changes to the `main` branch that affect the `/api` directory
2. Manually trigger the workflow from GitHub Actions

First deployment:
```bash
git add .
git commit -m "Deploy standalone API"
git push origin main
```

### Step 5: Update Frontend Configuration

The frontend is already configured to use the `VITE_API_BASE_URL` environment variable.

For Static Web App deployment, ensure the secret is set:

```bash
# This is configured in the GitHub workflow
# Verify it's in your GitHub secrets:
# Settings → Secrets → Actions → API_BASE_URL
```

### Step 6: Verify Deployment

Test the API:

```bash
# Health check
curl https://wheel-of-lunch-api.azurewebsites.net/api/diagnostic

# Test geocoding
curl "https://wheel-of-lunch-api.azurewebsites.net/api/geocode?zipCode=75201"

# Test places (requires coordinates)
curl "https://wheel-of-lunch-api.azurewebsites.net/api/places?lat=32.7767&lng=-96.7970&radius=5000"
```

### Step 7: Update CORS

Configure CORS to allow your Static Web App domain:

```bash
az functionapp cors remove \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --allowed-origins

az functionapp cors add \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --allowed-origins "https://your-static-web-app.azurestaticapps.net"
```

### Step 8: Deploy Frontend

The frontend will automatically use the new API endpoint when deployed.

Push changes:
```bash
git push origin main
```

### Step 9: Clean Up Old API (Optional)

After verifying the standalone API works:

1. **Remove old API files** from wheel-of-lunch:
   ```bash
   # Keep for reference or remove
   rm -rf wheel-of-lunch/api
   ```

2. **Update Static Web App workflow**:
   - Already done - `api_location` has been removed

## Rollback Plan

If you need to rollback to the embedded API:

1. **Revert workflow changes**:
   ```yaml
   # In .github/workflows/azure-static-web-apps-*.yml
   api_location: "/wheel-of-lunch/api"
   ```

2. **Update frontend**:
   ```bash
   # Remove VITE_API_BASE_URL from environment
   # Or set to: VITE_API_BASE_URL=/api
   ```

3. **Redeploy**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

## Troubleshooting

### API Returns 500 Errors

**Check Environment Variables**:
```bash
az functionapp config appsettings list \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg
```

**View Logs**:
```bash
az functionapp log tail \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg
```

### CORS Errors

**Check CORS Configuration**:
```bash
az functionapp cors show \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg
```

**Fix CORS**:
```bash
az functionapp cors add \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --allowed-origins "https://your-domain.azurestaticapps.net"
```

### Frontend Can't Connect to API

**Check Environment Variable**:
- Verify `VITE_API_BASE_URL` is set correctly
- Check browser console for actual API URL being used
- Verify Function App URL is correct

**Test API Directly**:
```bash
curl https://wheel-of-lunch-api.azurewebsites.net/api/diagnostic
```

### Deployment Fails

**Check Publish Profile**:
```bash
# Get new publish profile
az functionapp deployment list-publishing-profiles \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --xml
```

**Update GitHub Secret**:
- Copy the XML content
- Update `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` secret

## Monitoring After Migration

### Application Insights

View metrics in Azure Portal:
1. Navigate to Function App
2. Click "Application Insights"
3. View:
   - Request rate
   - Response times
   - Error rate
   - Dependency calls (Google API)

### Alerts

Set up alerts for:
- High error rate
- Slow response times
- High Google API usage
- Function failures

### Cost Monitoring

Track costs in Azure Cost Management:
- Function App consumption
- Storage account usage
- Application Insights data retention

## Performance Comparison

### Before (Embedded API)
- Cold start: ~2-3 seconds
- Warm request: ~200-500ms
- Shared resources with Static Web App
- Limited scaling options

### After (Standalone Function App)
- Cold start: ~2-3 seconds (similar)
- Warm request: ~200-500ms (similar)
- Dedicated resources
- Independent scaling
- Better monitoring

## Cost Comparison

### Embedded API
- Included in Static Web App tier
- No separate billing

### Standalone Function App
- **Consumption Plan**: ~$0.20/million executions
- **Storage**: ~$0.02/GB per month
- **Application Insights**: Free tier (5GB/month)
- **Estimated Monthly Cost**: $5-20 for typical usage

## Security Improvements

### Before
- Basic CORS
- Limited rate limiting
- Shared security context

### After
- Configurable CORS
- Rate limiting (100 req/min per IP)
- Input validation and sanitization
- Secure error handling
- Request logging
- Environment variable validation
- Azure Key Vault support

## Next Steps

1. ✅ Deploy API to Azure Function App
2. ✅ Configure GitHub secrets
3. ✅ Test API endpoints
4. ✅ Update frontend configuration
5. ✅ Deploy frontend
6. ⬜ Monitor for 1 week
7. ⬜ Optimize based on usage patterns
8. ⬜ Consider removing old API files

## Support

For issues or questions:
- Check `DEPLOYMENT.md` for detailed instructions
- Review `SECURITY.md` for security best practices
- Check Application Insights for runtime issues
- Review GitHub Actions logs for deployment issues

## References

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
