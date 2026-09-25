# NVIDIA LLM Ranking

<div align="center">

### Stop Wasting Time with Slow Models

**Your model choice is costing you seconds per request.** In production, that's thousands of dollars in compute waste and frustrated users.

**NVIDIA LLM Ranking** automatically benchmarks every NVIDIA AI Foundation model—measuring real latency, tool calling reliability, vision capabilities, and availability—so you choose the right model the first time.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Models Tested](https://img.shields.io/badge/models-92+-green.svg)](https://models.dev/api.json)
[![API](https://img.shields.io/badge/API-models.dev-orange.svg)](https://models.dev)

[View Dashboard Demo](#-dashboard-preview) • [Quick Start](#-quick-start) • [Methodology](#-benchmark-methodology)

</div>

---

## The Problem

You're building with NVIDIA's AI Foundation Models. You need tool calling. You pick a model from the docs.

**Then reality hits:**

- **3 seconds per request** when the docs said "low latency"
- **Tool calls randomly fail** on models that claim support
- **Vision endpoint returns 400** on the model you already integrated
- **Context windows don't match** what you read in the API docs
- **No way to compare** models objectively before committing

**You waste days benchmarking manually.** Or worse—you ship with a slow model and your users suffer.

## The Solution

NVIDIA LLM Ranking runs **automated, production-like benchmarks** on every NVIDIA NIM model:

<table>
<tr>
<td width="50%">

**What We Test:**
- Real latency (p50, p95, min, max)
- Tool calling reliability
- Vision/multimodal support
- Reasoning effort mechanisms
- Context window sizes
- Availability over time

</td>
<td width="50%">

**What You Get:**
- S/A/B/C tiers based on performance
- Live dashboard with sortable results
- models.dev metadata integration
- JSON export for CI/CD pipelines
- Historical trend tracking
- No guesswork, just data

</td>
</tr>
</table>

**One command. Ten minutes. Every model benchmarked.**

---

## Features

<table>
<tr>
<td width="50%">

### Automated Testing
- Tests all 92+ NVIDIA NIM models
- Real production-like workloads
- Multiple rounds for statistical accuracy
- Detects availability issues automatically

### Capability Detection
- Tool/function calling verification
- Vision/multimodal image support
- Reasoning effort mechanisms
- Context window validation

</td>
<td width="50%">

### Performance Metrics
- Latency percentiles (p50, p95)
- Availability scoring
- Dynamic tier assignment (S/A/B/C)
- Comparative ranking

### Professional Dashboard
- Modern Next.js interface
- Light/dark mode
- Real-time updates
- Sortable, filterable tables

</td>
</tr>
</table>

### Integration Ready

Built on [models.dev](https://models.dev/api.json) metadata:
- 134 AI providers cataloged
- Context sizes, costs, capabilities
- Always up-to-date
- No manual maintenance

---

## Dashboard Preview

![NVIDIA LLM Ranking Dashboard](docs/screenshot-dashboard.png)

*Hero section with status badges, stats grid with KPIs, vision leaders showcase, full ranking table with tier badges, company sidebar, and operations panel. Light/dark mode included.*

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- NVIDIA API key ([Get one here](https://build.nvidia.com/))
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/chronokairo/nvidia-llm-ranking.git
cd nvidia-llm-ranking

# Install dependencies
npm install
# or
bun install

# Configure environment
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY
```

### Configuration

Create a `.env` file in the project root:

```env
# Required: NVIDIA API key
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Customize benchmark parameters
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
RANK_PROBE_ROUNDS=3
RANK_PROBE_TIMEOUT_MS=12000
RANK_PROBE_MAX_TOKENS=24
```

### Usage

#### 1. Sync Model Metadata

Fetch latest model information from models.dev:

```bash
npm run models:sync
```

This downloads comprehensive metadata for all NVIDIA models including:
- Model names and families
- Context window sizes
- Tool calling support
- Reasoning capabilities
- Vision/multimodal support
- Cost information

#### 2. Run Ranking Benchmark

Execute the full benchmark suite:

```bash
npm run nvidia:rank
```

This will:
1. Discover all available NVIDIA NIM models
2. Test tool calling with a real function call
3. Check vision support with a test image
4. Probe reasoning/effort mechanisms
5. Measure latency over multiple rounds (p50, p95, min, max)
6. Calculate availability scores
7. Assign dynamic S/A/B/C tiers
8. Generate `data/nvidia-ranking.latest.json`

**Expected runtime**: ~10-20 minutes for all models (depending on API rate limits and timeouts)

#### 3. Start Dashboard

Launch the Next.js web interface:

```bash
npm run dev
```

Open http://localhost:3022 in your browser.

#### One-Command Workflow

Sync metadata + run benchmark:

```bash
npm run rank:full
```

## Project Structure

```
nvidia-llm-ranking/
├── app/                      # Next.js app (UI dashboard)
│   ├── page.tsx             # Main ranking dashboard
│   ├── globals.css          # Professional design system
│   ├── layout.tsx           # Root layout
│   └── api/                 # API routes
│       └── ranking/
│           ├── route.ts     # GET ranking data
│           ├── run/route.ts # POST trigger benchmark
│           └── toggle/route.ts # POST enable/disable models
├── scripts/                  # Benchmark and sync scripts
│   ├── generate-nvidia-ranking.mjs # Main benchmarking engine
│   ├── models-dev-api.mjs   # models.dev integration
│   ├── sync-models-dev.mjs  # Metadata sync script
│   └── context-sizes.mjs    # Context resolution helpers
├── data/                     # Generated benchmark results
│   ├── nvidia-ranking.latest.json  # Latest benchmark data
│   ├── models-dev-cache.json       # Cached models.dev metadata
│   └── nvidia-tool-toggle.json     # User-disabled models
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

---

## Benchmark Methodology

**Why you can trust these results:**

### Scoring Algorithm

Each model receives a composite score based on:

```javascript
score = (availability × 120) + (120 - latency_p50/100) + (tool_call_passed ? 40 : -140)
```

**Components**:
- **Availability Score** (0-120): Success rate over `RANK_PROBE_ROUNDS` attempts
- **Latency Score** (0-120): Faster models score higher (penalty per 100ms)
- **Tool Calling Bonus** (+40) or **Penalty** (-140): Strong incentive for tool support

### Tier Assignment

Dynamic tiers based on percentile ranking among eligible models:

| Tier | Percentile | Requirements |
|------|------------|-------------|
| **S** | Top 15% | Tool calling ✓, Available ✓, Best performance |
| **A** | 15-45% | Tool calling ✓, Available ✓, High performance |
| **B** | 45-80% | Tool calling ✓, Available ✓, Moderate performance |
| **C** | 80-100% | Tool calling ✓, Available ✓, Lower performance |
| **FAIL_TOOL** | - | Tool calling failed |
| **REMOVED** | - | Persistent 404 errors (model removed from API) |
| **DISABLED** | - | Manually disabled by user |

### Capability Tests

#### Tool Calling

Sends a test message with function definition:

```json
{
  "name": "list_files",
  "description": "Lista arquivos do diretório atual",
  "parameters": {
    "type": "object",
    "properties": {
      "directory": { "type": "string" }
    }
  }
}
```

**Pass criteria**: Model returns `tool_calls` in response

#### Vision Support

Sends 1×1 transparent PNG with prompt:

> "What color is the dominant pixel in this image? Reply with one word."

**Pass criteria**: HTTP 200 response (vision input accepted)

#### Reasoning Effort

Tests three effort levels (low, medium, high) with model-specific mechanisms:

- **reasoning_effort** (default) — Most NVIDIA models
- **chat_template_kwargs** — Nemotron-3 family
- **system_prompt** — Nemotron-super/ultra

**Pass criteria**: Accepts effort parameter without error

---

## Dashboard Features

### UI Components

- **Hero Section**: Status badges, inline metrics (active models, vision-ready, companies, fastest model)
- **Stats Grid**: 4 KPI cards with large numbers
- **Best Model Card**: Highlighted recommendation with tier badge
- **Vision Leaders**: Grid of top multimodal models
- **Benchmark Logs**: Real-time streaming output (when running)
- **Ranking Table**: Full sortable table with rank, model, capabilities, latency, score
- **Company Sidebar**: Collapsible groups (NVIDIA, Meta, Mistral AI, DeepSeek, etc.)
- **Operations Panel**: Watchlist + disabled models with toggle controls

### Interactions

- **Theme Toggle**: Switch between light/dark mode (persisted to localStorage)
- **Model Toggle**: Click to enable/disable models (saves to `nvidia-tool-toggle.json`)
- **Run Benchmark**: Trigger new benchmark from dashboard (POST to `/api/ranking/run`)
- **Capability Filters**: Visual pills for tool/vision/reasoning support

---

## API Integration

### models.dev

The project uses [models.dev](https://models.dev) as the authoritative source for model metadata:

- **92 NVIDIA models** (as of 2026-05-24)
- Context window sizes
- Tool calling support flags
- Reasoning/thinking capabilities
- Vision/multimodal indicators
- Cost per token (input/output)
- Release dates and last updated timestamps

**Why models.dev?**:
- Comprehensive catalog across 134 AI providers
- Structured JSON API
- Community-maintained and up-to-date
- No authentication required for metadata

### NVIDIA NIM API

Benchmark script connects to:

```
https://integrate.api.nvidia.com/v1
```

**Endpoints used**:
- `/v1/chat/completions` — Tool calling, vision, effort tests
- `/v1/models` — Model discovery (fallback)

**Rate Limits**: Be mindful of NVIDIA API rate limits. Adjust `RANK_PROBE_ROUNDS` if needed.

---

## Development

### Start Dev Server

```bash
npm run dev
```

Dashboard at http://localhost:3022

### Build for Production

```bash
npm run build
npm start
```

### Manual Benchmark Execution

```bash
# Full benchmark
node scripts/generate-nvidia-ranking.mjs

# Sync models.dev only
node scripts/sync-models-dev.mjs

# Test specific models
node scripts/test-specific-nvidia-models.mjs
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NVIDIA_API_KEY` | *required* | Your NVIDIA API key |
| `NVIDIA_BASE_URL` | `https://integrate.api.nvidia.com/v1` | API base URL |
| `RANK_PROBE_ROUNDS` | `3` | Number of latency test rounds per model |
| `RANK_PROBE_TIMEOUT_MS` | `12000` | Request timeout (12 seconds) |
| `RANK_PROBE_MAX_TOKENS` | `24` | Max tokens for latency probes |

---

## Output Format

### `nvidia-ranking.latest.json`

```json
{
  "testDate": "2026-05-24T00:26:12.718Z",
  "api": "https://integrate.api.nvidia.com/v1",
  "rounds": 3,
  "models": [
    {
      "id": "mistralai/mistral-small-4-119b-2603",
      "company": "mistralai",
      "tier": "C",
      "score": 277,
      "rank": 1,
      "availability": 1.0,
      "attempts": 3,
      "successes": 3,
      "latencyMs": {
        "p50": 346,
        "p95": 346,
        "min": 328,
        "max": 838
      },
      "toolCheck": {
        "passed": true,
        "reason": null
      },
      "visionCheck": {
        "supported": false,
        "ms": 452,
        "reason": "HTTP 400: Vision not supported"
      },
      "effortCheck": {
        "supported": true,
        "mechanism": "reasoning_effort",
        "results": {
          "low": { "passed": true, "ms": 234 },
          "medium": { "passed": true, "ms": 256 },
          "high": { "passed": true, "ms": 289 }
        }
      },
      "contextSize": 163840,
      "errors": [],
      "removed": false,
      "disabledByToggle": false
    }
    // ... more models
  ],
  "companies": [
    {
      "company": "mistralai",
      "models": 3,
      "available": 3,
      "avgScore": 265.67,
      "avgLatency": 1212
    }
    // ... more companies
  ],
  "visionModels": [
    {
      "id": "nvidia/vila",
      "score": 245,
      "latencyMs": 1234
    }
    // ... more vision models
  ],
  "disabledModels": [
    "nvidia/llama-3.1-nemotron-ultra-253b-v1"
  ],
  "possibleRemovals": [
    {
      "id": "nvidia/nemotron-nano-3-30b-a3b",
      "company": "nvidia",
      "reason": "HTTP 404 on first probe round",
      "attempts": 1
    }
  ]
}
```

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- [ ] Add more AI providers (OpenAI, Anthropic, Groq)
- [ ] Implement model search/filter in dashboard
- [ ] Add historical trend charts
- [ ] Export data to CSV/Excel
- [ ] Add cost analysis per model
- [ ] Implement model comparison view
- [ ] Add unit tests for benchmark logic
- [ ] Improve error handling for flaky models

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **NVIDIA**: For providing the AI Foundation Models API
- **models.dev**: For comprehensive model metadata catalog
- **Next.js**: For the amazing React framework
- **Community**: For testing and feedback

## Contact

**Found an issue?** [Open a GitHub Issue](https://github.com/chronokairo/nvidia-llm-ranking/issues)  
**Want to contribute?** See [Contributing](#contributing) above

---

<div align="center">

**Last Updated**: 2026-05-24  
**Models Tested**: 92 NVIDIA models  
**Data Source**: [models.dev](https://models.dev/api.json)

**Stop guessing. Start measuring.**

[★ Star on GitHub](https://github.com/chronokairo/nvidia-llm-ranking) • [🔗 View Live](http://localhost:3022)

</div>

