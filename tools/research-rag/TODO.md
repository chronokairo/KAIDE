# TODO.md - Athena Server Improvements

This document outlines identified issues, technical debt, and potential improvements for the Athena server codebase. Based on code analysis, these items should be prioritized for better maintainability, performance, security, and scalability.

## 🚨 Critical Issues

### Security Vulnerabilities
- [ ] **Input Validation**: Add comprehensive input sanitization for all API endpoints. Currently relies on basic Express middleware without schema validation.
- [ ] **Rate Limiting**: Current rate limiting is basic; implement more granular limits per endpoint and user.
- [ ] **Authentication**: No proper authentication system beyond basic session handling. Consider JWT or OAuth for API access.
- [ ] **Environment Variables**: Add validation and defaults for all env vars. Currently, missing vars could cause runtime errors.
- [ ] **CORS Configuration**: CORS is configured but may be too permissive in production. Add whitelist validation.
- [ ] **Helmet Security Headers**: Review and tighten CSP headers, especially for script-src and style-src.

### Error Handling & Reliability
- [ ] **Error Propagation**: Many async operations lack proper error boundaries. Implement centralized error handling middleware.
- [ ] **Graceful Shutdown**: Add signal handlers for SIGTERM/SIGINT to close connections cleanly.
- [ ] **Health Checks**: Current health endpoint is basic. Add dependency checks (Ollama, TOTVS APIs, vector store).
- [ ] **Circuit Breaker**: Implement circuit breaker pattern for TOTVS API calls to prevent cascading failures.
- [ ] **Retry Logic**: Add exponential backoff for failed API calls and LLM requests.

## ⚡ Performance Issues

### Caching & Optimization
- [ ] **Cache Invalidation**: Current cache doesn't handle API data changes. Implement cache versioning or TTL-based invalidation.
- [ ] **Memory Leaks**: Vector store loads everything into memory. Consider streaming or pagination for large datasets.
- [ ] **Database Connection Pooling**: If using databases, implement connection pooling (currently uses lowdb which is file-based).
- [ ] **Embedding Optimization**: Ollama embeddings are synchronous. Consider batch processing or async queues.
- [ ] **Response Compression**: Already enabled but could be optimized for different content types.

### API Efficiency
- [ ] **N+1 Query Problem**: TOTVS client makes multiple sequential API calls. Implement parallel requests where possible.
- [ ] **Response Size**: Some API responses may be large. Add pagination and selective field retrieval.
- [ ] **Streaming Optimization**: Chat streaming works but could benefit from better backpressure handling.

## 🏗️ Architecture & Code Quality

### Code Structure
- [ ] **Layer Violations**: Some features import from other features directly, violating Feature-Sliced Design principles.
- [ ] **Circular Dependencies**: Check for circular imports between features (e.g., rag ↔ chat ↔ api-client).
- [ ] **Singleton Pattern Abuse**: TOTVSClient and other services use singletons, making testing difficult.
- [ ] **Type Safety**: Some `any` types remain. Add proper TypeScript interfaces throughout.
- [ ] **Code Duplication**: Similar API client patterns repeated. Extract common HTTP client utilities.

### Testing & Quality Assurance
- [ ] **Unit Tests**: No test suite exists. Add Jest/Vitest with coverage requirements.
- [ ] **Integration Tests**: Test API endpoints, RAG pipeline, and MCP server.
- [ ] **E2E Tests**: Test full chat flow from client to LLM response.
- [ ] **Load Testing**: Performance test with realistic workloads.
- [ ] **Linting**: Add stricter ESLint rules and Prettier configuration.

## 🔧 Operational Concerns

### Monitoring & Observability
- [ ] **Structured Logging**: Replace console.log with proper logging library (Winston, Pino) with log levels.
- [ ] **Metrics**: Add Prometheus metrics for request latency, error rates, cache hits.
- [ ] **Tracing**: Implement distributed tracing for API calls and LLM requests.
- [ ] **Alerting**: Set up alerts for API failures, high latency, or resource exhaustion.

### Configuration Management
- [ ] **Configuration Validation**: Use libraries like Joi or Zod to validate configuration at startup.
- [ ] **Environment-Specific Configs**: Separate dev/staging/prod configurations.
- [ ] **Secrets Management**: Move sensitive data to proper secret management (Vault, AWS Secrets Manager).

## 📊 Feature Gaps

### RAG System
- [ ] **Multi-Modal Support**: Currently text-only. Consider image/document processing.
- [ ] **Context Window Management**: LLM context limits not handled. Implement context truncation/summarization.
- [ ] **Model Selection**: Hard-coded to gemma3:1b. Allow dynamic model selection.
- [ ] **Fine-Tuning**: No mechanism for model fine-tuning on TOTVS domain data.

### MCP Integration
- [ ] **Tool Discovery**: MCP tools are static. Implement dynamic tool registration.
- [ ] **State Management**: MCP server doesn't persist conversation state.
- [ ] **Authentication**: MCP protocol doesn't handle authentication. Add API key validation.

### API Client
- [ ] **Request Deduplication**: Prevent duplicate API calls for same request.
- [ ] **Response Caching**: Beyond basic TTL, implement smart cache invalidation.
- [ ] **API Versioning**: No versioning strategy for TOTVS API changes.

## 🐳 DevOps & Deployment

### Containerization
- [ ] **Multi-Stage Builds**: Optimize Docker image size with proper multi-stage builds.
- [ ] **Health Checks**: Add Docker health checks for container orchestration.
- [ ] **Resource Limits**: Set CPU/memory limits for containers.

### CI/CD
- [ ] **Automated Testing**: Set up GitHub Actions for build, test, and deploy.
- [ ] **Security Scanning**: Add Snyk or similar for dependency vulnerability scanning.
- [ ] **Code Quality Gates**: Enforce code coverage and quality metrics.

### Production Readiness
- [ ] **Database Migration**: If moving beyond lowdb, implement proper migrations.
- [ ] **Backup Strategy**: Vector store and cache persistence needs backup/recovery.
- [ ] **Scaling**: Design for horizontal scaling (currently single-instance).

## 📈 User Experience

### API Design
- [ ] **RESTful Compliance**: Some endpoints don't follow REST conventions.
- [ ] **API Documentation**: Add OpenAPI/Swagger documentation.
- [ ] **Response Consistency**: Standardize error response formats across all endpoints.

### Chat Features
- [ ] **Conversation History**: Persistent chat history with search.
- [ ] **Multi-User Support**: Currently single-user. Add user isolation.
- [ ] **Real-time Updates**: WebSocket support for live updates.

## 🔍 Code Analysis Findings

### Dependencies
- [ ] **Unused Dependencies**: Audit package.json for unused packages (e.g., jspdf, html2canvas may not be used).
- [ ] **Version Pinning**: Use exact versions for production dependencies to avoid breaking changes.
- [ ] **Bundle Size**: Analyze and optimize bundle size for faster startup.

### Performance Bottlenecks
- [ ] **Synchronous Operations**: Some file I/O operations are synchronous. Convert to async.
- [ ] **Memory Usage**: Vector store loads all embeddings into memory. Consider disk-based alternatives.
- [ ] **CPU Intensive Tasks**: Embedding generation blocks event loop. Move to worker threads.

## 🎯 Priority Matrix

### High Priority (Fix Immediately)
- Security vulnerabilities (input validation, auth)
- Error handling improvements
- Basic testing setup
- Structured logging

### Medium Priority (Next Sprint)
- Performance optimizations
- Code quality improvements
- Monitoring setup
- API documentation

### Low Priority (Future Releases)
- Advanced features (multi-modal, fine-tuning)
- Scaling improvements
- DevOps enhancements

## 📋 Implementation Notes

- Start with security fixes before adding new features
- Implement tests alongside new code
- Use feature flags for gradual rollouts
- Document all API changes
- Consider backward compatibility for existing integrations

---

*Last updated: December 13, 2025*
*Generated from codebase analysis*</content>
<filePath">c:\Users\luann\Documents\GitHub\chronokairo_rag\TODO.md