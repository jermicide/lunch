# Azure Infrastructure Setup Script
# This script creates all required Azure resources for the Wheel of Lunch API

# Configuration Variables
RESOURCE_GROUP="wheel-of-lunch-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="wheeloflunchstorage"
FUNCTION_APP_NAME="wheel-of-lunch-api"
APP_INSIGHTS_NAME="wheel-of-lunch-insights"
STATIC_WEB_APP_DOMAIN="icy-mushroom-0aa01d710.azurestaticapps.net"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Wheel of Lunch - Azure Infrastructure${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Login check
echo -e "\n${YELLOW}Checking Azure login...${NC}"
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Please login to Azure first:"
    az login
fi

# Create Resource Group
echo -e "\n${YELLOW}Creating resource group...${NC}"
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --tags "project=wheel-of-lunch" "environment=production"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Resource group created${NC}"
else
    echo "Failed to create resource group"
    exit 1
fi

# Create Storage Account
echo -e "\n${YELLOW}Creating storage account...${NC}"
az storage account create \
    --name $STORAGE_ACCOUNT \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP \
    --sku Standard_LRS \
    --kind StorageV2 \
    --min-tls-version TLS1_2 \
    --allow-blob-public-access false

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Storage account created${NC}"
fi

# Create Application Insights
echo -e "\n${YELLOW}Creating Application Insights...${NC}"
az monitor app-insights component create \
    --app $APP_INSIGHTS_NAME \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP \
    --application-type web

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Application Insights created${NC}"
fi

# Get Application Insights Instrumentation Key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
    --app $APP_INSIGHTS_NAME \
    --resource-group $RESOURCE_GROUP \
    --query instrumentationKey -o tsv)

# Create Function App (Linux Consumption Plan)
echo -e "\n${YELLOW}Creating Function App...${NC}"
az functionapp create \
    --resource-group $RESOURCE_GROUP \
    --consumption-plan-location $LOCATION \
    --runtime node \
    --runtime-version 18 \
    --functions-version 4 \
    --name $FUNCTION_APP_NAME \
    --storage-account $STORAGE_ACCOUNT \
    --os-type Linux \
    --disable-app-insights false

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Function App created${NC}"
fi

# Configure Function App Settings
echo -e "\n${YELLOW}Configuring Function App settings...${NC}"
az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        "WEBSITE_NODE_DEFAULT_VERSION=~18" \
        "FUNCTIONS_WORKER_RUNTIME=node" \
        "APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY" \
        "NODE_ENV=production"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Function App settings configured${NC}"
fi

# Enable HTTPS Only
echo -e "\n${YELLOW}Enabling HTTPS-only...${NC}"
az functionapp config set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --https-only true

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ HTTPS-only enabled${NC}"
fi

# Configure CORS
echo -e "\n${YELLOW}Configuring CORS...${NC}"
az functionapp cors remove \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --allowed-origins

az functionapp cors add \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --allowed-origins "https://$STATIC_WEB_APP_DOMAIN"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ CORS configured${NC}"
fi

# Enable Managed Identity
echo -e "\n${YELLOW}Enabling Managed Identity...${NC}"
az functionapp identity assign \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Managed Identity enabled${NC}"
fi

# Get Function App URL
FUNCTION_APP_URL=$(az functionapp show \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query defaultHostName -o tsv)

# Get Publish Profile (for GitHub Actions)
echo -e "\n${YELLOW}Getting publish profile...${NC}"
az functionapp deployment list-publishing-profiles \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --xml > publish-profile.xml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Publish profile saved to publish-profile.xml${NC}"
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nResource Group: ${YELLOW}$RESOURCE_GROUP${NC}"
echo -e "Function App: ${YELLOW}$FUNCTION_APP_NAME${NC}"
echo -e "Function App URL: ${YELLOW}https://$FUNCTION_APP_URL${NC}"
echo -e "Storage Account: ${YELLOW}$STORAGE_ACCOUNT${NC}"
echo -e "Application Insights: ${YELLOW}$APP_INSIGHTS_NAME${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Add the following secrets to your GitHub repository:"
echo "   - AZURE_FUNCTIONAPP_PUBLISH_PROFILE (content of publish-profile.xml)"
echo "   - AZURE_SUBSCRIPTION_ID"
echo "   - AZURE_RESOURCE_GROUP ($RESOURCE_GROUP)"
echo "   - GOOGLE_API_KEY (your Google API key)"
echo "   - GOOGLE_SIGNING_SECRET (optional)"
echo ""
echo "2. Set API secrets in Function App:"
echo "   az functionapp config appsettings set \\"
echo "     --name $FUNCTION_APP_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --settings \\"
echo "       \"GOOGLE_API_KEY=your-api-key\" \\"
echo "       \"GOOGLE_SIGNING_SECRET=your-signing-secret\""
echo ""
echo "3. Update frontend environment variable:"
echo "   VITE_API_BASE_URL=https://$FUNCTION_APP_URL/api"
echo ""
echo "4. Test the API:"
echo "   curl https://$FUNCTION_APP_URL/api/diagnostic"
echo ""
echo -e "${GREEN}Done!${NC}"
