# Credentials System Documentation

## Overview

The AI Browser Testing Agent includes a secure credentials management system that allows users to store login credentials for different websites. These credentials are automatically used by the AI agent when generating test flows and executing browser automation tasks.

## How It Works

### 1. **Secure Storage**

- Credentials are stored in-memory on the backend (in production, use a secure database)
- Passwords are never displayed in plain text in the UI
- All credential operations are logged for audit purposes

### 2. **AI Integration**

- When generating test flows, the AI automatically receives information about available credentials
- The AI uses placeholder names (e.g., `x_username`, `x_password`) in its instructions
- **IMPORTANT**: You must use these placeholder names in your prompts, NOT the actual values
- The system automatically substitutes real values during execution

### 3. **Browser Use Cloud Integration**

- Credentials are passed to Browser Use Cloud using the `sensitive_data` parameter
- Follows the exact format specified in Browser Use documentation:

```python
agent = Agent(
    task='Log into example.com as user x_username with password x_password',
    sensitive_data={
        'https://example.com': {
            'x_username': 'abc@example.com',
            'x_password': 'abc123456',
        },
    },
)
```

## Usage

### Adding Credentials

1. **Click the Key Icon** - Located in the bottom-right corner of the main page
2. **Enter Domain** - Specify the website domain (e.g., `example.com`)
3. **Add Credential Fields** - Define key-value pairs (e.g., `username: john@example.com`)
4. **Save** - Click "Add Credentials" to store them

### Using Credentials in Prompts

**✅ CORRECT - Use placeholder names:**

```
"Test login with x_username and x_password"
"Login to the site using x_username and x_password"
"Verify user can sign in with x_username and x_password"
```

**❌ INCORRECT - Don't use actual values:**

```
"Test login with john@example.com and password123"
"Login using demo@example.com and demo123456"
```

### Why Use Placeholder Names?

1. **Security**: The AI never sees your actual passwords
2. **Automatic Substitution**: The system automatically replaces `x_username` with your stored username
3. **Browser Use Integration**: Follows the exact format required by Browser Use Cloud
4. **Audit Trail**: All credential usage is logged without exposing sensitive data

### Supported Credential Types

- **Username/Password** - Standard login credentials
- **Email/Password** - Email-based authentication
- **Custom Fields** - Any key-value pairs needed for forms
- **Multiple Fields** - Add as many credential fields as needed

### Domain Matching

The system supports:

- **Exact domains**: `example.com`
- **Wildcard subdomains**: `*.example.com` (automatically added)
- **Protocol handling**: Automatically removes `http://` or `https://`

## Example Workflow

### 1. **Store Credentials**

```
Domain: example.com
Credentials:
  - username: demo@example.com
  - password: demo123456
```

### 2. **Generate Test Flows**

```
User Prompt: "Test the login functionality"
Website: example.com
```

The AI automatically receives:

```
CREDENTIALS AVAILABLE FOR example.com:
x_username: demo@example.com
x_password: demo123456

IMPORTANT: Use these credentials when needed for authentication...
```

### 3. **AI Generates Flows**

```json
{
  "name": "Login Test",
  "description": "Test user authentication flow",
  "instructions": "Step 1: Navigate to login page. Step 2: Enter x_username in email field. Step 3: Enter x_password in password field. Step 4: Click login button. Step 5: Verify dashboard loads."
}
```

### 4. **Execution with Credentials**

The system automatically converts the flow to:

```python
agent = Agent(
    task='Step 1: Navigate to login page. Step 2: Enter x_username in email field...',
    sensitive_data={
        'https://example.com': {
            'x_username': 'demo@example.com',
            'x_password': 'demo123456',
        },
    },
)
```

## Security Features

### 1. **Credential Masking**

- Passwords are displayed as `••••••••` by default
- Toggle visibility with eye icon (temporary, session-only)
- No plain text storage in frontend

### 2. **Access Control**

- Credentials are isolated per user session
- No cross-user credential sharing
- All operations are logged and auditable

### 3. **Secure Transmission**

- Credentials are transmitted over HTTPS
- API endpoints require authentication
- Sensitive data is never logged

## API Endpoints

### Add Credentials

```http
POST /api/credentials/add
{
  "domain": "example.com",
  "credentials": {
    "username": "user@example.com",
    "password": "secret123"
  }
}
```

### List Credentials

```http
GET /api/credentials/list
```

### Remove Credentials

```http
DELETE /api/credentials/{domain}
```

## Best Practices

### 1. **Credential Naming**

- Use descriptive keys: `username`, `email`, `password`
- Follow Browser Use conventions with `x_` prefix
- Keep keys consistent across similar websites

### 2. **Domain Management**

- Use base domains without protocols
- Consider subdomain variations
- Remove trailing slashes

### 3. **Security**

- Use strong, unique passwords
- Regularly rotate credentials
- Never share credential screenshots
- Clear credentials when no longer needed

## Troubleshooting

### Common Issues

1. **Credentials Not Working**
   - Verify domain matches exactly
   - Check credential field names
   - Ensure Browser Use API key is configured

2. **AI Not Using Credentials**
   - Check if domain has stored credentials
   - Verify credential format (key-value pairs)
   - Review AI prompt for credential references

3. **Browser Use Errors**
   - Confirm API key is valid
   - Check network connectivity
   - Verify credential format matches API requirements

### Debug Information

- Check backend logs for credential operations
- Verify API responses in browser dev tools
- Monitor Browser Use Cloud dashboard for task status

## Future Enhancements

### Planned Features

- **Encrypted Storage** - Database encryption for production
- **Credential Templates** - Pre-defined credential types
- **Bulk Import** - CSV/JSON credential import
- **Credential Sharing** - Team credential management
- **Audit Logs** - Detailed credential usage tracking

### Integration Opportunities

- **Password Managers** - 1Password, LastPass integration
- **SSO Systems** - SAML, OAuth credential handling
- **Vault Systems** - HashiCorp Vault, AWS Secrets Manager

## Support

For issues or questions about the credentials system:

1. Check this documentation
2. Review backend logs
3. Test with simple credentials first
4. Contact the development team

---

**Note**: This system is designed for testing and development purposes. In production environments, implement proper security measures including encrypted storage, access controls, and audit logging.
