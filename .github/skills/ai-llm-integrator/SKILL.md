---
name: ai-llm-integrator
description: AI & LLM integration, prompt engineering, streaming responses, structured JSON outputs, embeddings, and RAG architecture. Trigger when connecting Gemini/OpenAI APIs or building AI workflows.
---

# AI & LLM Integrator Skill Instructions

When integrating AI models (Gemini API, OpenAI SDK, LangChain) into applications, adhere to these guidelines:

## 1. Prompt Engineering & System Prompts
- Clearly separate system instructions, user context, and dynamic inputs using explicit delimiter tags.
- Provide structured output schemas (e.g. JSON schema, Zod validation) when expecting parsed object responses.
- Implement token budget management and context truncation strategies for long prompts.

## 2. API Communication & Streaming
- Utilize Server-Sent Events (SSE) or WebSockets for real-time response streaming to provide responsive user feedback.
- Handle rate limits, network timeouts, and model errors with exponential backoff retries and fallback responses.
- Secure API keys in backend route handlers or server functions; never expose LLM keys to client bundles.

## 3. RAG & Vector Embeddings
- Chunk text data logically (by paragraph, function, or header block) before generating vector embeddings.
- Implement similarity search scoring thresholds to filter out low-relevance context documents before sending to the LLM.
