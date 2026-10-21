# Two models, 2026: why the executor and the decider stay separate

Research that shaped rules 18–21 of `AGENTS.md`. Collected 2026-10-01.

Each entry names its source and the number it rests on, as rule 10 requires.
Primary sources are arXiv and ACL Anthology papers. Where a vendor page or an
aggregator is the only thing available, it is labelled indicative and is not
used on its own to justify a design choice.

## The question

Forgepair's objective is "two models, one terminal, one project": an executor
does the work, a second model decides whether the result answers the request
that was frozen before any edit. Should that stay, and in what shape?

Three sub-questions decided the answer:

1. Can one model judge its own work? (If yes, one model would do.)
2. Is a small decider good enough to sit in the gate?
3. Where does the deterministic check belong?

## 1. A model judging its own work is the wrong design

**arXiv:2604.06996 — "Self-Preference Bias in Rubric-Based Evaluation"**
(Pombal, Rei, Martins; Apr 2026, v3 Aug 2026). The closest paper to
Forgepair's actual shape: judges issue **binary verdicts on individual
programmatically verifiable rubrics**, on IFEval and LiveCodeBench.

- Self-preference persists *even when the criteria are entirely objective*.
- Among rubrics the generator **failed**, judges are **more than 50% more
  likely to incorrectly mark them satisfied** when the output is their own.
- Ensembling several judges mitigates it but does not remove it.
- On the subjective HealthBench, SPB skews scores by up to 10 points.

This is the single strongest reason Forgepair uses two models. The failure is
not hypothetical and not caused by fuzzy criteria.

**arXiv:2504.03846 — "Do LLM Evaluators Prefer Themselves for a Reason?"**
Much of the apparent self-preference in stronger models tracks real quality
rather than bias, **but harmful self-preference grows when the stronger model
is wrong as a generator** — "stronger models struggle more to recognize when
they are wrong." Long CoT before the verdict reduces it.

**arXiv:2604.22891 — "Quantifying and Mitigating Self-Preference Bias"**
Across 20 models, discriminability and low self-preference are uncorrelated or
negatively correlated. Practical consequence: **upgrading the judge is not a
fix for a biased judge.**

**"Pride and Prejudice" (ACL 2024, aclanthology.org/2024.acl-long.826)** — self-
bias *amplifies* across self-refinement iterations, and self-feedback can make
performance worse. Forgepair's retry loop is precisely self-refinement, so a
self-judging design would compound its own error three times over.

**arXiv:2604.23178 — "Judging the Judges"** — the dominant bias is **style
(0.76–0.92)**, not position (≤0.04). Judges strongly prefer markdown over plain
prose with identical content. Since Forgepair feeds a `git diff` to the decider,
formatting normalisation before judging is not optional. The same paper measures
confidence proxies from token probabilities as often miscalibrated.

Conclusion → **rule 18** (different models) and the K-repeat guidance in **rule 21**.

## 2. A small decider is a second gate, not the arbiter

**arXiv:2509.17995 — "Variation in Verification"** — the load-bearing result:

- Verifier capability maps onto verification quality as **saturated for easy
  problems, linear for medium, threshold-limited for hard** ones.
- **Errors from stronger generators are harder to detect.** Weak generators
  fail in ways that are easy to catch.

Both cut against a small local decider. A 2B model is expected to be
threshold-limited exactly where it matters, and to get *relatively weaker* as
the executor improves. That is an architectural decay trend, not a tuning
problem.

**arXiv:2606.29713 (SEVA)** — two findings that attack the current design
directly:

- Training a verifier with a **binary reward collapses the signal**: "binary
  reward compresses all verification quality into a single bit" and training
  stalls past SFT. Forgepair currently reduces the decider to a boolean and
  puts its confidence into a log string.
- Its four-round self-evolution loop produced **benchmark specialists, not
  generalists** — +15 pp on the in-domain HaluEval alongside −10 to −14 pp on
  TruthfulQA, still present at 4× the data. A narrowly fine-tuned decider is
  trustworthy only near its training distribution.

**ACL 2026, aclanthology.org/2026.acl-long.788** — verifiers that read surface
text are swayed by stylistic artefacts, and token-probability confidence is
often miscalibrated. Its proposed alternative, *Clue*, reads hidden states and
gains most **on smaller and less-calibrated models** (1.5B: 56.7% → 70.0% on
AIME 24). Noted as a direction; it needs a local model's hidden states, which
is out of reach for an HTTP endpoint today.

Conclusion → **rule 20** and the "do not call it a probability" clause in
**rule 21**.

## 3. The deterministic check stays first

**arXiv:2510.06135** and Wei's asymmetry of verification: on BrowseComp, GLM-4.5
needs ~75 search calls to solve a problem but ~18 to verify a candidate answer.
Verification is the cheaper half, so spend there.

But asymmetry is **not universal** — matrix multiplication is the standard
counter-example, and the Alignment Forum's summary is that among NP problems
verification is easier, not in general. Hence the ordering in **rule 19**: the
repo's own `:verify-command` is the primary evidence, and the asymmetry
argument only justifies spending compute on the model check second.

**ACL 2026 findings, aclanthology.org/2026.findings-acl.1611 (VPRMs)** —
deterministic rule-based verification of intermediate reasoning beats
outcome-only verification by 6.5% F1, and beats SOTA by up to 20%. Deterministic
checks are worth more, not less, as agents get better.

**ACL 2026 findings, aclanthology.org/2026.findings-acl.1243 (DeepVerifier)** —
a rubric-based outcome-reward verifier beats vanilla agent-as-judge and plain
LLM-judge baselines by **12–48% F1**, and rubric-guided test-time verification
returns 8–11% accuracy on GAIA and XBench. Judging against a written rubric is
what makes a model check worth having — which is why Forgepair freezes the
request text before the executor sees it.

Conclusion → **rule 19**, and rule 13's ban on narrative validators stays,
because the papers back it.

## What the research did *not* justify

- **Routing or a provider catalog.** No finding requires picking a model at
  runtime. That stays out of scope under rule 13.
- **A stronger online decider.** Nothing here shows a frontier model in the
  decider slot fixes anything: arXiv:2604.22891 finds capability uncorrelated
  with low self-preference, and arXiv:2509.17995 says stronger verifiers only
  help on medium difficulty. A second paid provider would add cost and
  correlation, not evidence.
- **Treating the decider as authoritative.** Every source above argues against
  a model-only gate.

## Market context, indicative only

Vendor and aggregator pages, not primary, listed as rule 10 requires. Prices and
scores as of roughly September 2026.

- Claude Haiku 4.5 ≈ Claude Sonnet 4 on SWE-bench Verified (73.3% vs 72.7%) at
  about a third of the price.
- Claude Opus 5 (July 2026) reaches ~96% on SWE-bench Verified.
- Small models are strong on short tasks and fall off on long ones — the same
  shape as the threshold-limited result above.

The one durable takeaway: **a cheap model can match a frontier model on
verification-shaped work.** That is what makes a small local decider defensible
at all. It is not evidence that this particular 2B decider is well calibrated,
which is why rule 20 keeps it in second place.

## Open, not settled

- Whether K-repeated decider calls pay for themselves locally. The variance
  argument is sound (arXiv:2607.05391, O(1/K)) but no source measures the cost
  for a 0.1–0.3 s local call.
- Whether a confidence floor helps or just adds false rejections. Needs a
  measurement against real accepted and rejected patches.
- Whether a hidden-state verifier is reachable through a local model that can
  also serve as an executor. The 4 GB card in the documented setup cannot hold
  both.