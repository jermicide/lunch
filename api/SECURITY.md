# Security Best Practices for Wheel of Lunch API

This document outlines the security measures implemented in the standalone Azure Function App API and recommendations for maintaining security.

## Implemented Security Measures

### 1. CORS (Cross-Origin Resource Sharing)

**Implementation**: `api/middleware.js`

The API implements CORS protection with configurable allowed origins:

```javascript
// Production: Only specific domain allowed
'Access-Control-Allow-Origin': 'https://icy-mushroom-0aa01d710.azurestaticapps.net'

// Development: Allow localhost
'Access-Control-Allow-Origin': '*' (dev only)
```

**Best Practices**:
- ✅ Never use `*` in production
- ✅ Whitelist only your Static Web App domain
- ✅ Update CORS origins when domain changes

**Configuration**:
Update `middleware.js` with your actual domain:
```javascript
const allowedOrigins = [
    'https://your-static-web-app.azurestaticapps.net',
    'http://localhost:5173'  // Dev only
];
```

### 2. Rate Limiting

**Implementation**: In-memory rate limiting (100 requests/minute per IP)

**Current Limits**:
- 100 requests per minute per IP address
- Automatic cleanup of expired records

**Recommendations for Production**:

For production-grade rate limiting, use one of these options:

#### Option A: Azure API Management
```bash
# Apply rate limiting policy
az apim api policy create \
  --resource-group wheel-of-lunch-rg \
  --service-name wheel-of-lunch-apim \
  --api-id wheel-of-lunch-api \
  --policy-content '
    <policies>
      <inbound>
        <rate-limit calls="100" renewal-period="60" />
      </inbound>
    </policies>
  '
```

#### Option B: Azure Redis Cache
For distributed rate limiting across multiple function instances:

```bash
# Create Redis Cache
az redis create \
  --resource-group wheel-of-lunch-rg \
  --name wheel-of-lunch-cache \
  --location eastus \
  --sku Basic \
  --vm-size c0

# Get connection string
az redis list-keys \
  --resource-group wheel-of-lunch-rg \
  --name wheel-of-lunch-cache
```

### 3. Input Validation & Sanitization

**Implemented Validations**:

#### Places API
- Latitude: -90 to 90 degrees
- Longitude: -180 to 180 degrees
- Radius: 500 to 50,000 meters
- Input sanitization for all string inputs

#### Geocode API
- ZIP code format validation
- Input sanitization to prevent injection attacks
- Maximum input length: 1000 characters

**Functions**:
```javascript
// Removes dangerous characters
sanitizeInput(userInput)

// Validates coordinates
isValidCoordinates(lat, lng)

// Validates ZIP codes
isValidZipCode(zipCode)
```

### 4. Environment Variable Protection

**Required Environment Variables**:
- `GOOGLE_API_KEY` - Google Maps API key
- `GOOGLE_SIGNING_SECRET` - URL signing secret (optional)

**Security**:
- ✅ Never commit API keys to source control
- ✅ Store in Azure Function App Configuration
- ✅ Use Azure Key Vault for enhanced security (recommended)

**Using Azure Key Vault**:

```bash
# Create Key Vault
az keyvault create \
  --name wheel-of-lunch-vault \
  --resource-group wheel-of-lunch-rg \
  --location eastus

# Store secrets
az keyvault secret set \
  --vault-name wheel-of-lunch-vault \
  --name GoogleApiKey \
  --value "your-api-key"

# Grant Function App access
az functionapp identity assign \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg

PRINCIPAL_ID=$(az functionapp identity show \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --query principalId -o tsv)

az keyvault set-policy \
  --name wheel-of-lunch-vault \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get

# Reference in Function App
az functionapp config appsettings set \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --settings "GOOGLE_API_KEY=@Microsoft.KeyVault(SecretUri=https://wheel-of-lunch-vault.vault.azure.net/secrets/GoogleApiKey/)"
```

### 5. Error Handling

**Secure Error Responses**:
- ✅ No stack traces exposed in production
- ✅ Sensitive data redacted from logs
- ✅ Generic error messages for security issues
- ✅ Detailed logging server-side only

**Example**:
```javascript
// Client receives
{
  "error": "Failed to fetch restaurants",
  "timestamp": "2026-02-03T19:00:00.000Z"
}

// Server logs
{
  "error": "Failed to fetch restaurants",
  "message": "Google API returned 403",
  "stack": "...",
  "apiKey": "[REDACTED]"
}
```

### 6. Request Logging

**Logged Information**:
- Timestamp
- HTTP method
- Request URL
- Client IP address
- User agent
- Query parameters

**Privacy Compliance**:
- IP addresses anonymized after 30 days (configure in Application Insights)
- No PII (Personally Identifiable Information) logged
- Compliant with GDPR requirements

### 7. HTTPS Enforcement

Azure Functions automatically enforces HTTPS. Ensure it's enabled:

```bash
az functionapp config set \
  --name wheel-of-lunch-api \
  --resource-group wheel-of-lunch-rg \
  --https-only true
```

### 8. Authentication (Optional Enhancement)

For additional security, consider implementing authentication:

#### Option A: API Keys
```javascript
// In middleware.js
function validateApiKey(req) {
    const apiKey = req.headers['x-api-key'];
    const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validKeys.includes(apiKey);
}
```

#### Option B: Azure AD Authentication
```bash
az functionapp auth update \
  --resource-group wheel-of-lunch-rg \
  --name wheel-of-lunch-api \
  --enabled true \
  --action LoginWithAzureActiveDirectory
```

## Monitoring & Alerts

### Application Insights

**Configure Alerts**:

```bash
# Alert on high error rate
az monitor metrics alert create \
  --name HighErrorRate \
  --resource-group wheel-of-lunch-rg \
  --scopes $(az functionapp show --name wheel-of-lunch-api --resource-group wheel-of-lunch-rg --query id -o tsv) \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m
```

**Key Metrics to Monitor**:
- Request count and rate
- Error rate
- Response time
- Dependency failures (Google API)

### Security Monitoring

**Set up alerts for**:
1. Unusual traffic patterns
2. High rate of 4xx errors (potential scanning)
3. Geographic anomalies
4. Failed authentication attempts (if using auth)

## Compliance

### GDPR Compliance

1. **Data Retention**:
   - Configure Application Insights data retention
   - Anonymize IP addresses
   - Delete old logs

2. **User Rights**:
   - No user data stored (location is not persisted)
   - Request logs automatically expire

### Google API Compliance

1. **Terms of Service**:
   - Display Google attribution
   - Don't cache results beyond allowed limits
   - Don't manipulate search results

2. **Rate Limits**:
   - Monitor quota usage
   - Implement caching to reduce API calls

## Security Checklist

Before going to production:

- [ ] Update CORS allowed origins to production domain only
- [ ] Store all secrets in Azure Key Vault
- [ ] Enable HTTPS-only
- [ ] Configure Application Insights
- [ ] Set up monitoring alerts
- [ ] Enable managed identity for Function App
- [ ] Review and test rate limiting
- [ ] Configure IP restrictions (if needed)
- [ ] Enable diagnostic logging
- [ ] Set up Azure Monitor alerts
- [ ] Review and update firewall rules
- [ ] Implement API versioning strategy
- [ ] Document incident response procedures
- [ ] Regular security audits scheduled

## Incident Response

### If API Keys Are Compromised:

1. **Immediate Actions**:
   ```bash
   # Rotate Google API key immediately
   # Update in Azure Key Vault
   az keyvault secret set \
     --vault-name wheel-of-lunch-vault \
     --name GoogleApiKey \
     --value "new-api-key"
   
   # Restart function app to pick up new key
   az functionapp restart \
     --name wheel-of-lunch-api \
     --resource-group wheel-of-lunch-rg
   ```

2. **Investigation**:
   - Review Application Insights logs
   - Check for unauthorized access
   - Identify compromised endpoints

3. **Remediation**:
   - Update all affected keys
   - Review access policies
   - Strengthen monitoring

### If DDoS Attack Detected:

1. **Enable Azure DDoS Protection**:
   ```bash
   az network ddos-protection create \
     --resource-group wheel-of-lunch-rg \
     --name wheel-of-lunch-ddos
   ```

2. **Implement Stricter Rate Limiting**:
   - Reduce requests per minute
   - Implement CAPTCHA (if applicable)
   - Block malicious IPs

## Regular Maintenance

### Weekly:
- Review error logs
- Check rate limiting effectiveness
- Monitor API quota usage

### Monthly:
- Review Application Insights metrics
- Check for security updates
- Review access logs

### Quarterly:
- Rotate API keys
- Security audit
- Update dependencies
- Review CORS configuration

## Resources

- [Azure Functions Security](https://docs.microsoft.com/azure/azure-functions/security-concepts)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google Maps Platform Security](https://developers.google.com/maps/api-security-best-practices)
- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
