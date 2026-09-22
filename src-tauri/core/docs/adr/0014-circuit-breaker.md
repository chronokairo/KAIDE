# ADR 0014 — Provider Health Checks & Circuit Breaking

**Status:** Accepted  
**Date:** 2026-08-03  
**Author:** Antigravity + Luan  

## Context

The ChronoKairo provider chain already has token-bucket rate limiting and per-provider retry with exponential backoff. However, if a provider is consistently failing (e.g., 5xx errors, timeouts), the chain will keep retrying it on every request, wasting time and tokens. There is no mechanism to temporarily disable unhealthy providers.

## Decision

1. **New `CircuitBreaker` struct in `src/llm/provider_chain.rs`:**
   - States: `Closed`, `Open`, `HalfOpen`
   - Configurable `threshold` (failures before opening) and `cooldown` (duration before half-open)
   - `allow()`: returns `true` if requests should be allowed
   - `record_success()`: resets failure counter and closes circuit
   - `record_failure()`: increments counter; opens circuit if threshold reached

2. **New `CircuitBreakerProvider` wrapper:**
   - Wraps any `Arc<dyn CompletionProvider>`
   - On `complete()`: checks `allow()`, delegates to inner, records success/failure
   - Returns `ProviderError::Transient` when circuit is open

3. **Integrated into `FallbackChain::new`:**
   - All providers are automatically wrapped with `CircuitBreakerProvider::new(p, 3, 30s)`
   - No API changes for existing callers

4. **Tests added:**
   - `circuit_breaker_opens_after_threshold_failures`: verifies circuit opens after 3 failures
   - `circuit_breaker_records_success`: verifies success resets the circuit

## Consequences

- Providers that fail 3 times consecutively are skipped for 30 seconds
- After cooldown, the provider is tried again (half-open)
- Successful responses reset the failure counter
- All existing tests pass (174 total)
