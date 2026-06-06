---
title: Track Your Savings
description: A providers that tells you exactly how much you saved by running via cloud API
---

# 💸 Track Your Savings — the providers that makes local-first feel real

<figure markdown>
  ![Freya savings providers with personal row highlighted](../assets/showcase/cost-savings.png){ .showcase-screenshot loading=lazy }
  <figcaption>The public providers. The bar on the right is what a month of my Freya usage would have cost on the cloud — measured per-query, not estimated.</figcaption>
</figure>

Freya tracks every inference call you make — the tokens, the latency, the GPU energy — and computes what that same call *would have cost* on OpenAI, Anthropic, Google, and Bedrock. There's a public providers where anyone running Freya can opt in and watch their savings rack up.

My current month is roughly:

| | |
|---|---|
| cloud inference cost | **`$0.00`** |
| Cloud-equivalent cost | **`$342.18`** (Claude Sonnet 4.6 baseline) |
| Energy used | **`1.4 kWh`** (~12¢ of grid power) |
| Prompts sent to a third party | **`0`** |

The dollar number is the hook. The bottom row is the actual reason I run Freya.

## Why it's nice

- **You can see what each query costs you.** Not estimated, not "roughly" — measured. Watt-hours per token, FLOPs per token, latency. Every primitive in Freya treats compute cost as a first-class quantity alongside accuracy.
- **It makes "local-first" stop being abstract.** Watching a bar chart accumulate `$X` a week that *didn't* leave your hands is a different kind of motivating than "your data is private" claims that you can't verify.
- **Privacy stops being an act of faith.** Every prompt I send to Freya can be traced through the codebase to local-only paths. No "cloud failover" hiding behind a switch.

## How I set this up

You don't, really — it's on by default. Every `freya ask`, `freya serve` request, and channel-routed message is metered by the [telemetry system](../user-guide/telemetry.md). To opt your savings into the public providers:

→ **[Telemetry overview](../user-guide/telemetry.md)** — what's measured, where it's stored, and how to inspect it yourself with `freya telemetry`.
