# LLM Provider Support

The Activi Desktop Agent supports multiple LLM providers for agentic reasoning and autonomous operation.

## Supported Providers

### 1. OpenAI
**Best for**: Production use, highest quality reasoning

**Models**:
- `gpt-4o-mini` - Recommended for most use cases (fast, cheap, good quality)
- `gpt-4o` - Best quality, slower, more expensive
- `gpt-4-turbo-preview` - Good balance
- `gpt-3.5-turbo` - Fastest, cheapest, lower quality

**Setup**:
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Select "OpenAI" as provider
3. Enter your API key
4. Choose model (recommend `gpt-4o-mini`)

**Pricing**: Pay per token
- GPT-4o Mini: $0.15/1M input tokens, $0.60/1M output tokens
- GPT-4o: $2.50/1M input tokens, $10/1M output tokens

---

### 2. Groq
**Best for**: Ultra-fast inference, development, testing

**Models**:
- `llama-3.3-70b-versatile` - Recommended (best quality)
- `llama-3.1-70b-versatile` - Very good quality
- `llama-3.1-8b-instant` - Ultra fast, lower quality
- `mixtral-8x7b-32768` - Good for long context

**Setup**:
1. Get API key from [Groq Console](https://console.groq.com/keys)
2. Select "Groq (Ultra Fast)" as provider
3. Enter your API key
4. Choose model (recommend `llama-3.3-70b-versatile`)

**Pricing**: Free tier available
- 30 requests/minute
- 14,400 requests/day
- Extremely fast inference (300+ tokens/sec)

**Why Groq?**
- Fastest inference speed (10-100x faster than OpenAI)
- Free tier is generous
- Great for development and testing
- Good quality with Llama 3.3 70B

---

### 3. Google Gemini
**Best for**: Multimodal tasks, long context, free tier

**Models**:
- `gemini-2.0-flash-exp` - Latest experimental model (fast)
- `gemini-1.5-pro` - Best quality, 2M token context
- `gemini-1.5-flash` - Fast, good quality

**Setup**:
1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Select "Google Gemini" as provider
3. Enter your API key
4. Choose model (recommend `gemini-2.0-flash-exp`)

**Pricing**: Generous free tier
- 1,500 requests/day (free)
- 1M tokens/minute (free)
- Paid tier available for higher limits

**Why Gemini?**
- Huge context window (up to 2M tokens)
- Excellent free tier
- Good reasoning capabilities
- Native multimodal support

---

### 4. Activi.ai Cloud
**Best for**: Managed service, no API key management

**Setup**:
1. Select "Activi.ai Cloud" as provider
2. No API key needed (uses your Activi account)

---

### 5. Azure OpenAI
**Best for**: Enterprise deployments, compliance requirements

**Setup**:
1. Deploy OpenAI models in Azure
2. Select "Azure OpenAI" as provider
3. Enter your Azure API key
4. Configure endpoint URL

---

### 6. Local (LM Studio / Ollama)
**Best for**: Privacy, offline use, custom models

**Setup**:
1. Install [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.ai/)
2. Start local server (default: http://localhost:1234)
3. Select "Local" as provider
4. Choose your local model

**Recommended Local Models**:
- Llama 3.1 8B
- Mistral 7B
- Phi-3 Medium

---

## Comparison

| Provider | Speed | Quality | Cost | Free Tier | Best For |
|----------|-------|---------|------|-----------|----------|
| **OpenAI** | Medium | Excellent | $$$ | Limited | Production |
| **Groq** | Ultra Fast | Very Good | Free/$ | Yes (generous) | Development |
| **Gemini** | Fast | Very Good | $$ | Yes (generous) | Long context |
| **Activi Cloud** | Medium | Excellent | $$ | Trial | Managed |
| **Azure** | Medium | Excellent | $$$ | No | Enterprise |
| **Local** | Varies | Good | Free | N/A | Privacy |

---

## Recommendations by Use Case

### For Development & Testing
**Use Groq** with `llama-3.3-70b-versatile`
- Ultra fast iteration
- Free tier is generous
- Good quality for testing

### For Production
**Use OpenAI** with `gpt-4o-mini`
- Best reliability
- Good quality/cost balance
- Proven at scale

### For Cost Optimization
**Use Gemini** with `gemini-2.0-flash-exp`
- Generous free tier
- Good quality
- Fast inference

### For Privacy
**Use Local** with Ollama
- No data leaves your machine
- No API costs
- Full control

---

## Configuration Example

```json
{
  "llm": {
    "provider": "groq",
    "apiKey": "gsk_...",
    "model": "llama-3.3-70b-versatile"
  }
}
```

---

## Troubleshooting

### "API key invalid"
- Check you're using the correct API key for the provider
- Verify the key hasn't expired
- Ensure you have credits/quota remaining

### "Model not found"
- Verify the model name is correct for your provider
- Check if you have access to that model
- Try a different model from the same provider

### "Rate limit exceeded"
- You've hit the provider's rate limit
- Wait a few minutes and try again
- Consider upgrading to paid tier
- Switch to a different provider temporarily

### Slow responses
- OpenAI can be slow during peak times
- Try Groq for faster inference
- Check your internet connection
- Consider using a smaller model

---

## Getting API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy and save the key (shown only once)

### Groq
1. Go to https://console.groq.com/keys
2. Sign in with Google/GitHub
3. Click "Create API Key"
4. Copy the key

### Google Gemini
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

---

## Best Practices

1. **Start with Groq** for development (fast, free)
2. **Test with multiple providers** to find best fit
3. **Use environment variables** for API keys (don't commit)
4. **Monitor costs** if using paid tiers
5. **Have a backup provider** configured
6. **Use appropriate models** for task complexity
7. **Cache responses** when possible to reduce costs

---

## Future Providers

Coming soon:
- Anthropic Claude (via native SDK)
- Cohere
- Together.ai
- Replicate
- Custom OpenAI-compatible endpoints
