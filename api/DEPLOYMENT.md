# Wheel of Lunch - API Deployment Guide

This directory contains the standalone Azure Function App for the Wheel of Lunch API.

## Overview

The API has been separated from the Static Web App deployment to follow Azure best practices:
- Independent scaling and resource management
- Better security isolation
- Separate deployment pipelines
- Cost optimization

## Prerequisites

- Azure CLI installed
- Azure subscription with permissions to create Function Apps
- GitHub repository secrets configured

## Local Development

### Setup

1. Copy the template settings file:
```bash
cp local.settings.json.template local.settings.json
```

2. Edit `local.settings.json` and add your Google API credentials:
```json
{
  "Values": {
    "GOOGLE_API_KEY": "your-actual-api-key",
    "GOOGLE_SIGNING_SECRET": "your-actual-signing-secret"
  }
}
```

3. Install dependencies:
```bash
npm install
```

### Running Locally

Start the Azure Functions runtime:
```bash
func start
```

The API will be available at `http://localhost:7071/api`

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Azure Function App Creation

### Using Azure CLI

```bash
# Variables
RESOURCE_GROUP="wheel-of-lunch-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="wheeloflunchstorage"
FUNCTION_APP_NAME="wheel-of-lunch-api"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name $FUNCTION_APP_NAME \
  --storage-account $STORAGE_ACCOUNT \
  --os-type Linux
```

### Configure CORS

```bash
az functionapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP_NAME \
  --allowed-origins "https://icy-mushroom-0aa01d710.azurestaticapps.net"
```

### Configure Application Settings

```bash
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    "GOOGLE_API_KEY=your-api-key" \
    "GOOGLE_SIGNING_SECRET=your-signing-secret" \
    "WEBSITE_NODE_DEFAULT_VERSION=~18" \
    "FUNCTIONS_WORKER_RUNTIME=node"
```

### Enable Application Insights (Recommended)

```bash
# Create Application Insights
az monitor app-insights component create \
  --app $FUNCTION_APP_NAME-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app $FUNCTION_APP_NAME-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Configure Function App to use App Insights
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings "APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY"
```

## GitHub Actions Setup

### Required Secrets

Configure the following secrets in your GitHub repository:

1. **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**
   - Get from Azure Portal: Function App → Deployment Center → Manage publish profile
   
2. **AZURE_SUBSCRIPTION_ID**
   - Your Azure subscription ID
   
3. **AZURE_RESOURCE_GROUP**
   - Resource group name: `wheel-of-lunch-rg`
   
4. **GOOGLE_API_KEY**
   - Your Google Maps API key
   
5. **GOOGLE_SIGNING_SECRET**
   - Your Google API URL signing secret (optional)

### Deployment Workflow

The deployment workflow (`.github/workflows/azure-function-app-deploy.yml`) automatically:
1. Builds the function app with production dependencies
2. Deploys to Azure Functions
3. Configures application settings
4. Runs on push to main branch or manual trigger

## API Endpoints

### GET /api/places

Fetch nearby restaurants.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Search radius in meters (500-50000, default: 1500)
- `rankBy` (optional): Use "distance" for distance-based ranking

**Example:**
```
GET /api/places?lat=32.7767&lng=-96.7970&radius=5000
```

### GET /api/geocode

Convert ZIP code to coordinates.

**Query Parameters:**
- `zipCode` (required): US ZIP code

**Example:**
```
GET /api/geocode?zipCode=75201
```

### GET /api/diagnostic

Check API health and configuration.

**Example:**
```
GET /api/diagnostic
```

### GET /api/test

Simple test endpoint.

**Example:**
```
GET /api/test
```

## Security Best Practices

### CORS Configuration
- Configure allowed origins to only include your Static Web App domain
- Never use `*` for production

### API Keys
- Store all secrets in Azure Function App Configuration
- Never commit secrets to source control
- Rotate keys periodically

### Authentication (Optional Enhancement)
Consider adding Azure AD authentication for additional security:
```bash
az functionapp auth update \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP_NAME \
  --enabled true \
  --action LoginWithAzureActiveDirectory
```

### Rate Limiting
The Google Places API has quotas. Consider implementing:
- Azure API Management for rate limiting
- Caching layer with Azure Redis Cache
- Request throttling middleware

## Monitoring

### View Logs
```bash
az functionapp log tail \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Application Insights Queries
- Failed requests
- Response times
- Dependency calls to Google API

## Cost Optimization

1. **Consumption Plan**: Pay only for execution time
2. **Monitor Usage**: Track function executions in Azure Portal
3. **Optimize Dependencies**: Only install production dependencies
4. **Caching**: Consider caching Google API responses

## Troubleshooting

### Function not responding
1. Check Application Insights for errors
2. Verify environment variables are set
3. Review function logs
4. Check CORS configuration

### Google API errors
1. Verify API key is valid and has necessary permissions
2. Check quota limits in Google Cloud Console
3. Review diagnostic endpoint response

### Deployment fails
1. Verify publish profile is current
2. Check Node.js version compatibility
3. Review GitHub Actions logs

## Frontend Integration

The frontend uses the `VITE_API_BASE_URL` environment variable to configure the API endpoint:

**Development:**
```bash
VITE_API_BASE_URL=http://localhost:7071/api
```

**Production:**
```bash
VITE_API_BASE_URL=https://wheel-of-lunch-api.azurewebsites.net/api
```

## Rollback

If issues occur, revert to the previous deployment:
```bash
az functionapp deployment slot swap \
  --resource-group $RESOURCE_GROUP \
  --name $FUNCTION_APP_NAME \
  --slot staging
```

## Additional Resources

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Azure Function Best Practices](https://docs.microsoft.com/azure/azure-functions/functions-best-practices)
