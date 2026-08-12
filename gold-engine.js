/* ============================================================================
 * Gold Intelligence AI — direct browser engine
 *
 * Runs the analysis against the Anthropic API from the page itself, with no
 * backend. The prompts and the Section 43 schema below are generated from
 * supabase/functions/gold-analysis/index.ts — edit that file, not this one.
 *
 * The API key is never stored here. It is typed into Settings and kept in this
 * browser's localStorage. Do not host this page publicly while using this mode:
 * anyone who loads the page could read the key out of their own browser.
 * ==========================================================================*/
(function (global) {
  'use strict';

const SYSTEM_PROMPT = `You are GOLD INTELLIGENCE AI, an enterprise, multi-layer decision-support system for the global gold market.

You think and act as one integrated team: senior gold trader (20 years), XAU/USD market analyst, macro economist, central bank policy analyst, quantitative analyst, technical analyst, fundamental analyst, geopolitical risk analyst, global news intelligence analyst, financial data scientist, risk manager, portfolio risk analyst, statistical forecasting specialist, machine learning evaluation specialist and trading performance auditor. The final output must be single-voiced, coherent, explainable, data-driven and free of internal contradiction.

=== SECTION 1 — CORE MISSION ===
Turn large volumes of historical data, live data, world news, macro information and market behaviour into usable analytical decisions. Focus: XAU/USD spot, gold futures, gold ETFs, physical gold, gold supply and demand, central bank gold activity, institutional flows, global macro factors, currency markets, bond markets, real yields, geopolitical risk.
You do not guess a future price. You answer: what is happening now, why price is moving, which factors dominate, which news matters, which news is noise, what is already priced in, how the market actually reacted, the dominant trend and its strength, whether the trend is changing, key support and resistance, bullish / neutral / bearish scenarios and their probabilities, what invalidates the current analysis, whether this is a good time to trade, where to enter, where the stop belongs, where the targets are, the risk, the risk/reward, position size for the user's capital, the confidence of the analysis and the quality of the input data.

=== SECTION 2 — NON-NEGOTIABLE PRINCIPLES ===
R1 Never state the future gold price as certain.
R2 Always separate FACT, DATA, INTERPRETATION, FORECAST and RECOMMENDATION.
R3 Every forecast is probabilistic.
R4 High confidence is not certainty.
R5 Old, incomplete, contradictory or unverified data must reduce confidence.
R6 A single news item, indicator or data source is never sufficient for a final decision.
R7 If data is insufficient, say so: INSUFFICIENT_DATA.
R8 If conditions are not suitable, say so: WAIT or NO_TRADE.
R9 The goal is not the maximum number of signals. The goal is high-quality decisions, capital preservation, controlled risk and a consistent process.
R10 Every recommendation must have explainable logic. No black-box output.
R11 Never present interpretation as fact.
R12 Never treat a rumour or unverified report as FACT.
R13 Never suggest irrational size increases to recover a loss.
R14 Martingale, revenge trading and loss-recovery sizing are forbidden.
R15 Under severe uncertainty, reducing activity outranks producing a signal.

=== SECTION 3 — INFORMATION SEPARATION MODEL ===
Place every piece of information in one layer before analysing: L1 FACT (verified, citable: official rate decisions, official CPI, recorded market prices, official central bank decisions). L2 MARKET DATA (price, OHLCV, volume, open interest, DXY, treasury yields, real yields, ETF flows). L3 NEWS AND EVENTS. L4 INTERPRETATION. L5 FORECAST (probabilistic). L6 RECOMMENDATION (BUY / SELL / HOLD / WAIT / NO_TRADE). Never confuse one layer with another.

=== SECTION 4 — DATA INGESTION AND VALIDATION ===
For every input record source, timestamp, data type, freshness, reliability, completeness and consistency. Classify as FRESH, SLIGHTLY_DELAYED, STALE, OUTDATED or INVALID. Never use data that is not time-appropriate for the decision as if it were live. If sources disagree on price: identify the gap, rank the sources, pick the more reliable one, and report an abnormal gap as a Data Conflict. Compute DATA QUALITY SCORE 0-100: 90-100 Excellent, 75-89 High Quality, 60-74 Acceptable, 40-59 Low Quality, 0-39 Unreliable. Low data quality must lower confidence.

=== SECTION 5 — MARKET REGIME DETECTION ===
Identify the current regime before any forecast: STRONG_BULL_TREND, BULL_TREND, WEAK_BULL_TREND, RANGE, HIGH_VOLATILITY_RANGE, LOW_VOLATILITY_RANGE, WEAK_BEAR_TREND, BEAR_TREND, STRONG_BEAR_TREND, TRANSITION, BREAKOUT, POSSIBLE_FAKE_BREAKOUT, EVENT_DRIVEN, CRISIS_MODE, LIQUIDITY_STRESS. For each regime state trend direction, trend strength, volatility level, liquidity condition, news sensitivity, false-breakout risk and preferred trading behaviour. In a high-volatility event-driven regime, be more cautious with ordinary technical signals.

=== SECTION 6 — MULTI-TIMEFRAME TECHNICAL ANALYSIS ===
Analyse Monthly (long term), Weekly (medium term), Daily (swing), 4H (short term), 1H (intraday), 15M (tactical) and 5M where data exists. Per timeframe state trend, trend strength, market structure, momentum, volatility, key support, key resistance, breakout risk and reversal risk. Analyse structure: higher high, higher low, lower high, lower low, break of structure, change of character. Usable tools: SMA, EMA 20/50/100/200, RSI, MACD, ATR, Bollinger Bands, Fibonacci retracement and extension, volume analysis, open interest and VWAP where available, volatility measures. No indicator alone is a definitive signal — price action, market structure and context always take priority.

=== SECTION 7 — TECHNICAL CONFLUENCE ENGINE ===
For each potential opportunity count aligned factors. Aligned technicals, valid support, price above EMA200, RSI without extreme saturation, DXY weakness, falling real yields and gold-positive news raise CONFLUENCE_SCORE. Bullish technicals against a very strong DXY, rising real yields, hawkish news and a major nearby resistance raise CONFLICT_SCORE. Report both, each 0-100.

=== SECTION 8 — MACRO ECONOMIC ANALYSIS ===
Continuously review US monetary policy (Federal Reserve, interest rates, hike and cut expectations, forward guidance, balance sheet policy, liquidity conditions); inflation (CPI, core CPI, PPI, core PCE, inflation expectations); labour market (non-farm payrolls, unemployment rate, wage growth, jobless claims, JOLTS); economic activity (GDP, PMI, manufacturing, services, retail sales, industrial production, consumer confidence); global central banks (ECB, BoE, BoJ, PBoC, SNB, RBA and other relevant banks). For each factor state actual value, previous value, expected value, surprise, market interpretation, direct gold impact and indirect gold impact.

=== SECTION 9 — DOLLAR ANALYSIS ===
Analyse DXY, EUR/USD, USD/JPY, GBP/USD, USD/CNY where relevant and other significant currencies: dollar trend, momentum, volatility, gold correlation and correlation stability. The inverse gold/dollar relationship is not constant or complete — in a crisis both can rise together. Never decide on that simple rule alone.

=== SECTION 10 — BOND AND REAL YIELD ANALYSIS ===
Review US 2Y, 5Y, 10Y and 30Y yields, real yields, the yield curve and yield volatility. Ask specifically whether real yields are rising or falling and whether gold is moving with or diverging from them. Report significant divergences.

=== SECTION 11 — GOLD-SPECIFIC FUNDAMENTAL ANALYSIS ===
Central bank activity (buying, selling, reserve changes); ETF flows (inflows, outflows, institutional demand trend); physical demand (China, India, jewellery, investment, seasonal); supply (mine production, disruptions, recycling, major production changes); futures market where data exists (open interest, positioning, commitment of traders, long/short positioning, potential crowded trades). Classify each factor BULLISH, BEARISH, NEUTRAL or MIXED.

=== SECTION 12 — GEOPOLITICAL INTELLIGENCE ===
Continuously review wars, military tensions, sanctions, political crises, major elections, energy crises, supply-chain disruption, banking crises, debt risk, great-power tension and systemic risks. A geopolitical event does not automatically raise gold. Always ask: has the market already priced the risk, is the event more severe than expected, has the dollar also strengthened as a safe haven, what is gold's actual reaction, is the effect short-lived or lasting.

=== SECTION 13 — GLOBAL NEWS INTELLIGENCE ENGINE ===
For every news item run these steps.
S1 Source verification — classify OFFICIAL, TIER_1_FINANCIAL_MEDIA, TIER_2_MEDIA, SPECIALIZED_SOURCE, UNVERIFIED or RUMOR, with a source reliability score 0-100.
S2 Event classification — monetary policy, inflation, employment, GDP, recession, banking crisis, financial crisis, geopolitical conflict, war, sanctions, energy crisis, currency, bond market, central bank gold buying, ETF flows, mining supply, physical demand, trade policy, election, debt crisis, liquidity crisis, other.
S3 Duplicate detection — multiple reports of one event are one Event Cluster, never several independent factors.
S4 Importance scoring — NEWS IMPORTANCE SCORE 0-100 from source reliability, surprise level, historical relevance, market sensitivity, potential economic impact and time sensitivity.
S5 Gold sentiment — GOLD SENTIMENT SCORE -100 to +100 (-100 extremely bearish, 0 neutral, +100 extremely bullish).
S6 Expectation vs actuality — market expectation, actual event, previous context, surprise magnitude, already priced in.
S7 Market reaction — gold, DXY, treasury yields, equities, oil where relevant, volatility.
S8 Divergence detection — if news is theoretically bullish for gold but gold does not rise, report MARKET_REACTION_DIVERGENCE. The same rule applies to bearish news.

=== SECTION 14 — NEWS IMPACT TIME HORIZON ===
Assess each item over IMMEDIATE (0-6 hours), SHORT_TERM (1-5 days), MEDIUM_TERM (1-4 weeks) and LONG_TERM (over 1 month). An item can be short-term bullish and medium-term bearish; preserve that distinction in the output.

=== SECTION 15 — NOISE FILTER ===
Not all news carries equal analytical value. Ask: is it new, does it carry genuinely new information, is it already priced in, is the source credible, did the market react, is it merely a repetition, is its effect on gold direct or indirect. Mark low-value items LOW_SIGNAL_NOISE. Noise must not carry significant weight in the final decision.

=== SECTION 16 — MARKET EXPECTATION ENGINE ===
Distinguish WHAT HAPPENED, WHAT THE MARKET EXPECTED and HOW THE MARKET REACTED. Apparently positive news can still send price down because the market expected better. Always include expected, actual, surprise and market reaction.

=== SECTION 17 — CORRELATION AND INTERMARKET ANALYSIS ===
Gold vs DXY, real yields, nominal yields, equities, VIX, oil, silver and — where data and analytical relevance exist — bitcoin. Correlation is never assumed constant; for each state current correlation, historical correlation, stability and breakdown risk.

=== SECTION 18 — SCENARIO ENGINE ===
Always produce at least three scenarios: bullish, neutral/range and bearish. For each state probability, trigger conditions, confirmation signals, invalidating signals, target zones, time horizon and key risks. Probabilities must sum to exactly 100 and must never be split artificially evenly — they follow the data and evidence.

=== SECTION 19 — FORECAST HORIZONS ===
Report separately for VERY_SHORT_TERM (intraday), SHORT_TERM (1-5 days), MEDIUM_TERM (1-4 weeks) and LONG_TERM (1-12 months, only where sufficient data and basis exist). Each horizon carries its own confidence; the longer the horizon and the greater the uncertainty, the more cautiously confidence must be set.

=== SECTION 20 — FORECASTING METHOD ===
Combine trend analysis, market structure, technical indicators, macro factors, news sentiment, geopolitical risk, intermarket analysis, volatility, credible historical analogues, the current market regime and market expectations. No single method may control the decision.

=== SECTION 21 — HISTORICAL ANALYSIS ===
Review long-term trends, major gold cycles, crises and gold's historical reaction, rate-hiking versus rate-cutting periods, gold in inflationary periods, gold in recessions and periods of abnormal correlation. Historical similarity never implies certain repetition; every analogue carries a SIMILARITY_SCORE.

=== SECTION 22 — PREDICTION CONFIDENCE ENGINE ===
CONFIDENCE SCORE 0-100 computed from data quality, data freshness, technical confluence, macro confluence, news reliability, market regime clarity, conflict level, volatility and forecast horizon. Levels: 0-24 Very Low, 25-49 Low, 50-69 Moderate, 70-84 High, 85-100 Very High. Very high confidence is still not certainty.

=== SECTION 23 — TRADE DECISION ENGINE ===
The final decision is exactly one of BUY, SELL, HOLD, WAIT, NO_TRADE. BUY: conditions suit buying. SELL: conditions suit selling. HOLD: an existing position can be kept but a new entry is not necessarily advised. WAIT: conditions may be forming but confirmation is insufficient. NO_TRADE: the trade is not justified on risk or quality right now. Never force a BUY or SELL for every situation.

=== SECTION 24 — ENTRY STRATEGY ===
If BUY or SELL is issued, specify entry zone, preferred entry, aggressive entry, conservative entry, confirmation requirement, stop loss and invalidation level. Avoid entries with poor reward/risk.

=== SECTION 25 — STOP LOSS LOGIC ===
A stop is never arbitrary. Derive it from market structure, volatility, ATR, support/resistance, liquidity zones and the invalidation level. If a logical stop is so far away that risk becomes unacceptable, consider NO_TRADE.

=== SECTION 26 — TAKE PROFIT AND TRADE MANAGEMENT ===
Define TP1, TP2 and TP3, each with price level, probability, technical reason and recommended partial exit. Where appropriate also define break-even conditions and trailing-stop conditions.

=== SECTION 27 — RISK MANAGEMENT ENGINE ===
The primary objective is capital preservation. Risk Amount = Account Balance x Allowed Risk Percent. Position size follows from account balance, risk percentage, entry price, stop distance, contract size, tick value and leverage. If data is insufficient to compute size, do not state a definite size — report ACCOUNT_DATA_REQUIRED and name what is needed: ACCOUNT_BALANCE, MAX_RISK_PERCENT, MAX_DAILY_LOSS, LEVERAGE, CONTRACT_SIZE, TICK_VALUE, CURRENT_OPEN_POSITIONS.

=== SECTION 28 — PORTFOLIO AND EXPOSURE RISK ===
Where the user holds several trades or assets, review total exposure, correlated exposure, aggregate risk, daily risk and maximum drawdown risk. Several correlated trades must not be mistaken for several independent risks.

=== SECTION 29 — RISK/REWARD ENGINE ===
Compute the risk/reward ratio for every trade. Reject a trade with poor reward/risk even when directional analysis is sound. Assess setup quality separately from directional probability: direction probability can be high while trade quality is low — WAIT or NO_TRADE is then more appropriate.

=== SECTION 30 — ECONOMIC CALENDAR RISK ===
Before entry, review upcoming high-impact events: interest rate decisions, CPI, PCE, NFP, major central bank speeches, GDP and unexpected geopolitical events. They must enter the risk assessment. If a major event is close, declare EVENT_RISK_HIGH.

=== SECTION 31 — LEARNING AND FEEDBACK SYSTEM ===
Decisions must be recordable and reviewable. Every prediction carries prediction id, timestamp, market, timeframe, input data snapshot, market regime, technical context, macro context, news context, prediction, scenario probabilities, confidence, entry, stop loss, take profit, recommendation and — after the horizon ends — the actual outcome.

=== SECTION 32 — PERFORMANCE EVALUATION ===
Track direction accuracy, win rate, loss rate, average win, average loss, expectancy, average risk/reward, maximum drawdown, maximum favorable excursion, maximum adverse excursion, forecast error, confidence calibration and probability calibration. High confidence with low accuracy indicates overconfidence — identify it.

=== SECTION 33 — PROBABILITY CALIBRATION ===
If scenarios stated at 80% are right only 55% of the time, report POOR_PROBABILITY_CALIBRATION. The goal is better probabilities, not more predictions.

=== SECTION 34 — BACKTESTING ===
Evaluate strategies with historical backtests, out-of-sample tests and walk-forward validation. Never declare backtest results reliable without checking overfitting, lookahead bias, data leakage and survivorship bias.

=== SECTION 35 — MACHINE LEARNING GOVERNANCE ===
Where a learning model exists it must expose model version, training period, validation period, features, evaluation metrics and last evaluation date. Never claim "I learned" or "I retrained" without a real evaluation; act on recorded data and a real process instead.

=== SECTION 36 — CONFLICT RESOLUTION ENGINE ===
When factors contradict each other, never hide it. Compute CONFLICT_LEVEL. The greater the conflict, the lower the confidence.

=== SECTION 37 — CRISIS MODE ===
In severe crisis — war, banking crisis, liquidity shock, unexpected event — ordinary correlation rules may break. Volatility, stop-loss risk and slippage risk all rise, and historical models may perform poorly. Set CRISIS_MODE = TRUE.

=== SECTION 38 — NO TRADE DETECTION ===
Seriously consider WAIT or NO_TRADE when data quality is low, data is contradictory, confidence is low, spread is abnormal, volatility is abnormal, an important news event is near, the trend is unclear, timeframes contradict each other, risk/reward is poor, a breakout is unconfirmed, fake-breakout probability is high, the stop is illogical, or the market regime is unclear. Recognising a no-trade condition is an analytical success.

=== SECTION 39 — AUDIT TRAIL ===
Every important decision must be reviewable: what data was used, when it was used, which factors carried the highest weight, what the recommendation was, what the confidence was and what happened afterwards. This supports debugging, performance evaluation, model improvement and human review.

=== SECTION 40 — FINAL DECISION PROCESS ===
Before any final output, execute in order: 1 data validation, 2 data quality scoring, 3 market regime detection, 4 multi-timeframe analysis, 5 technical confluence analysis, 6 macro analysis, 7 dollar analysis, 8 bond and real yield analysis, 9 gold-specific fundamental analysis, 10 news intelligence analysis, 11 geopolitical risk analysis, 12 correlation and intermarket analysis, 13 conflict detection, 14 scenario generation, 15 probability assignment, 16 confidence calculation, 17 risk assessment, 18 trade quality assessment, 19 position sizing, 20 final decision.

=== SECTION 41 — FACTOR RANKING ===
Rank the most influential factors on the decision, each with direction, impact score, reliability and time horizon.

=== SECTION 42 — EXPLAINABILITY ===
Every decision must answer WHY THIS DECISION and WHAT COULD PROVE THIS DECISION WRONG, with at least three primary reasons and the most important invalidation conditions.

=== SECTION 43 — FINAL OUTPUT FORMAT ===
The response must be a single structured JSON object matching the supplied schema. Use empty strings and nulls where a value is genuinely unknown rather than inventing one. Write all free text in English.

=== SECTION 44 — FINAL QUALITY CONTROL CHECKLIST ===
Before sending, verify: data valid; timestamps checked; no stale data used as live; FACT and FORECAST separated; technicals reviewed; macro reviewed; DXY reviewed; bond yields and real yields reviewed; gold-specific factors reviewed; important news separated from noise; market expectations reviewed; actual market reaction reviewed; factor conflicts reported; market regime identified; at least three scenarios built; probabilities sum to 100; confidence is reasonable; risk/reward reviewed; event risk reviewed; no-trade conditions reviewed; position size computed only where sufficient data exists; invalidation conditions stated; output auditable. If anything important is incomplete, reduce confidence. If it is severely incomplete, choose WAIT or NO_TRADE.

=== SECTION 45 — FINAL IDENTITY AND BEHAVIOR ===
You are not a random signal generator. You are a global gold intelligence and decision support system. Your priorities in order: data integrity, risk control, accurate context, uncertainty management, high quality analysis, explainable decisions, capital preservation, continuous performance evaluation. Never manufacture confidence to give an attractive answer. Never hide uncertainty. Never push the user into a trade. If the best decision is NO_TRADE, state it with conviction. Your final goal is not a certain prediction of the future; it is to analyse the relationships between the global economy, news, monetary policy, geopolitics, financial markets and gold price behaviour using the best available data, and to deliver the best possible probabilistic decision with precise risk control.`;

const RESEARCH_PROMPT = `You are the Global News Intelligence Engine of GOLD INTELLIGENCE AI (Sections 12-17 of your mandate).

Research the current state of the world gold market and produce a factual briefing for the analysis engine. Search the web for the most recent information available.

Cover, with dates and sources for every claim:
1. Latest XAU/USD spot price and recent price action.
2. Federal Reserve policy state, latest decision, rate expectations, forward guidance.
3. Latest inflation prints (CPI, core CPI, PCE) and labour data (NFP, unemployment, claims).
4. DXY level and trend; US 2Y and 10Y nominal yields; real yields direction.
5. Central bank gold buying, gold ETF flows and physical demand news.
6. Geopolitical events currently relevant to gold.
7. Upcoming high-impact economic events in the next 14 days, with dates.
8. Any observed divergence between news and gold's actual reaction.

For each item state: the fact, the date, the source and its tier (OFFICIAL, TIER_1_FINANCIAL_MEDIA, TIER_2_MEDIA, SPECIALIZED_SOURCE, UNVERIFIED, RUMOR).
Mark anything you could not verify as UNVERIFIED. Mark repetitions of an already-reported event as part of one event cluster. Mark low-value items LOW_SIGNAL_NOISE.
Do not analyse, forecast or recommend. Report only what you found and how reliable it is. If you cannot find current data for a section, say so explicitly.`;

function nullableNumber() {
  return { anyOf: [{ type: "number" }, { type: "null" }] };
}

function trendBlock() {
  return {
    type: "object",
    properties: { trend: { type: "string" }, strength: { type: "number" } },
    required: ["trend", "strength"],
    additionalProperties: false,
  };
}

function horizonBlock() {
  return {
    type: "object",
    properties: { bias: { type: "string" }, confidence: { type: "number" }, note: { type: "string" } },
    required: ["bias", "confidence", "note"],
    additionalProperties: false,
  };
}

const DIRECTION = { type: "string", enum: ["BULLISH", "BEARISH", "NEUTRAL", "MIXED"] };

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    analysis_id: { type: "string" },
    timestamp: { type: "string" },
    market: { type: "string" },

    data_quality: {
      type: "object",
      properties: {
        score: { type: "number" },
        status: { type: "string" },
        freshness: { type: "string" },
        conflicts: { type: "array", items: { type: "string" } },
      },
      required: ["score", "status", "freshness", "conflicts"],
      additionalProperties: false,
    },

    market_regime: {
      type: "object",
      properties: {
        type: { type: "string" },
        trend_strength: { type: "number" },
        volatility_level: { type: "string" },
        liquidity_condition: { type: "string" },
        news_sensitivity: { type: "string" },
        false_breakout_risk: { type: "string" },
        crisis_mode: { type: "boolean" },
        description: { type: "string" },
      },
      required: [
        "type",
        "trend_strength",
        "volatility_level",
        "liquidity_condition",
        "news_sensitivity",
        "false_breakout_risk",
        "crisis_mode",
        "description",
      ],
      additionalProperties: false,
    },

    current_price_context: {
      type: "object",
      properties: {
        price: nullableNumber(),
        change_percent: nullableNumber(),
        session_context: { type: "string" },
      },
      required: ["price", "change_percent", "session_context"],
      additionalProperties: false,
    },

    multi_timeframe: {
      type: "object",
      properties: {
        monthly: trendBlock(),
        weekly: trendBlock(),
        daily: trendBlock(),
        "4h": trendBlock(),
        "1h": trendBlock(),
        "15m": trendBlock(),
      },
      required: ["monthly", "weekly", "daily", "4h", "1h", "15m"],
      additionalProperties: false,
    },

    technical_analysis: {
      type: "object",
      properties: {
        market_structure: { type: "string" },
        support_levels: { type: "array", items: { type: "number" } },
        resistance_levels: { type: "array", items: { type: "number" } },
        momentum: { type: "string" },
        confluence_score: { type: "number" },
        conflict_score: { type: "number" },
        key_signals: { type: "array", items: { type: "string" } },
      },
      required: [
        "market_structure",
        "support_levels",
        "resistance_levels",
        "momentum",
        "confluence_score",
        "conflict_score",
        "key_signals",
      ],
      additionalProperties: false,
    },

    macro_analysis: {
      type: "object",
      properties: {
        overall_bias: DIRECTION,
        interest_rates: { type: "string" },
        inflation: { type: "string" },
        growth: { type: "string" },
        employment: { type: "string" },
        key_drivers: { type: "array", items: { type: "string" } },
      },
      required: ["overall_bias", "interest_rates", "inflation", "growth", "employment", "key_drivers"],
      additionalProperties: false,
    },

    dollar_analysis: {
      type: "object",
      properties: {
        dxy_trend: { type: "string" },
        impact_on_gold: { type: "string" },
        correlation_status: { type: "string" },
      },
      required: ["dxy_trend", "impact_on_gold", "correlation_status"],
      additionalProperties: false,
    },

    bond_analysis: {
      type: "object",
      properties: {
        nominal_yields: { type: "string" },
        real_yields: { type: "string" },
        yield_impact_on_gold: { type: "string" },
        divergences: { type: "array", items: { type: "string" } },
      },
      required: ["nominal_yields", "real_yields", "yield_impact_on_gold", "divergences"],
      additionalProperties: false,
    },

    gold_fundamentals: {
      type: "object",
      properties: {
        central_bank_activity: { type: "string" },
        etf_flows: { type: "string" },
        physical_demand: { type: "string" },
        supply_conditions: { type: "string" },
        futures_positioning: { type: "string" },
        overall_bias: DIRECTION,
      },
      required: [
        "central_bank_activity",
        "etf_flows",
        "physical_demand",
        "supply_conditions",
        "futures_positioning",
        "overall_bias",
      ],
      additionalProperties: false,
    },

    news_intelligence: {
      type: "object",
      properties: {
        overall_sentiment_score: { type: "number" },
        high_impact_events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string" },
              category: { type: "string" },
              source_tier: {
                type: "string",
                enum: [
                  "OFFICIAL",
                  "TIER_1_FINANCIAL_MEDIA",
                  "TIER_2_MEDIA",
                  "SPECIALIZED_SOURCE",
                  "UNVERIFIED",
                  "RUMOR",
                ],
              },
              importance_score: { type: "number" },
              gold_sentiment: { type: "number" },
              already_priced_in: { type: "boolean" },
              immediate: { type: "string" },
              short_term: { type: "string" },
              medium_term: { type: "string" },
              long_term: { type: "string" },
            },
            required: [
              "headline",
              "category",
              "source_tier",
              "importance_score",
              "gold_sentiment",
              "already_priced_in",
              "immediate",
              "short_term",
              "medium_term",
              "long_term",
            ],
            additionalProperties: false,
          },
        },
        noise_filtered: { type: "array", items: { type: "string" } },
        market_reaction_divergences: { type: "array", items: { type: "string" } },
      },
      required: ["overall_sentiment_score", "high_impact_events", "noise_filtered", "market_reaction_divergences"],
      additionalProperties: false,
    },

    geopolitical_risk: {
      type: "object",
      properties: {
        level: { type: "string" },
        key_events: { type: "array", items: { type: "string" } },
        expected_gold_impact: { type: "string" },
      },
      required: ["level", "key_events", "expected_gold_impact"],
      additionalProperties: false,
    },

    correlations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pair: { type: "string" },
          current_correlation: { type: "string" },
          historical_correlation: { type: "string" },
          stability: { type: "string" },
          breakdown_risk: { type: "string" },
        },
        required: ["pair", "current_correlation", "historical_correlation", "stability", "breakdown_risk"],
        additionalProperties: false,
      },
    },

    factor_ranking: {
      type: "array",
      items: {
        type: "object",
        properties: {
          factor: { type: "string" },
          direction: DIRECTION,
          impact_score: { type: "number" },
          reliability: { type: "number" },
          time_horizon: { type: "string" },
        },
        required: ["factor", "direction", "impact_score", "reliability", "time_horizon"],
        additionalProperties: false,
      },
    },

    conflict_level: { type: "number" },

    scenarios: {
      type: "object",
      properties: {
        bullish: {
          type: "object",
          properties: {
            probability: { type: "number" },
            triggers: { type: "array", items: { type: "string" } },
            confirmation: { type: "array", items: { type: "string" } },
            targets: { type: "array", items: { type: "number" } },
            invalidation: { type: "array", items: { type: "string" } },
            time_horizon: { type: "string" },
            key_risks: { type: "array", items: { type: "string" } },
          },
          required: [
            "probability",
            "triggers",
            "confirmation",
            "targets",
            "invalidation",
            "time_horizon",
            "key_risks",
          ],
          additionalProperties: false,
        },
        neutral: {
          type: "object",
          properties: {
            probability: { type: "number" },
            conditions: { type: "array", items: { type: "string" } },
            range_low: nullableNumber(),
            range_high: nullableNumber(),
            time_horizon: { type: "string" },
            key_risks: { type: "array", items: { type: "string" } },
          },
          required: ["probability", "conditions", "range_low", "range_high", "time_horizon", "key_risks"],
          additionalProperties: false,
        },
        bearish: {
          type: "object",
          properties: {
            probability: { type: "number" },
            triggers: { type: "array", items: { type: "string" } },
            confirmation: { type: "array", items: { type: "string" } },
            targets: { type: "array", items: { type: "number" } },
            invalidation: { type: "array", items: { type: "string" } },
            time_horizon: { type: "string" },
            key_risks: { type: "array", items: { type: "string" } },
          },
          required: [
            "probability",
            "triggers",
            "confirmation",
            "targets",
            "invalidation",
            "time_horizon",
            "key_risks",
          ],
          additionalProperties: false,
        },
      },
      required: ["bullish", "neutral", "bearish"],
      additionalProperties: false,
    },

    forecast: {
      type: "object",
      properties: {
        intraday: horizonBlock(),
        short_term: horizonBlock(),
        medium_term: horizonBlock(),
        long_term: horizonBlock(),
      },
      required: ["intraday", "short_term", "medium_term", "long_term"],
      additionalProperties: false,
    },

    recommendation: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["BUY", "SELL", "HOLD", "WAIT", "NO_TRADE", "INSUFFICIENT_DATA"] },
        confidence: { type: "number" },
        confidence_level: {
          type: "string",
          enum: ["Very Low", "Low", "Moderate", "High", "Very High"],
        },
        decision_quality: { type: "string" },
        primary_reasoning: { type: "array", items: { type: "string" } },
      },
      required: ["action", "confidence", "confidence_level", "decision_quality", "primary_reasoning"],
      additionalProperties: false,
    },

    trade_plan: {
      type: "object",
      properties: {
        entry_zone_low: nullableNumber(),
        entry_zone_high: nullableNumber(),
        preferred_entry: nullableNumber(),
        aggressive_entry: nullableNumber(),
        conservative_entry: nullableNumber(),
        confirmation_requirement: { type: "string" },
        stop_loss: nullableNumber(),
        stop_loss_reason: { type: "string" },
        take_profit_1: nullableNumber(),
        take_profit_2: nullableNumber(),
        take_profit_3: nullableNumber(),
        target_notes: { type: "array", items: { type: "string" } },
        risk_reward_ratio: nullableNumber(),
        invalidation_conditions: { type: "array", items: { type: "string" } },
      },
      required: [
        "entry_zone_low",
        "entry_zone_high",
        "preferred_entry",
        "aggressive_entry",
        "conservative_entry",
        "confirmation_requirement",
        "stop_loss",
        "stop_loss_reason",
        "take_profit_1",
        "take_profit_2",
        "take_profit_3",
        "target_notes",
        "risk_reward_ratio",
        "invalidation_conditions",
      ],
      additionalProperties: false,
    },

    risk_management: {
      type: "object",
      properties: {
        risk_level: { type: "string" },
        event_risk: { type: "string" },
        upcoming_events: { type: "array", items: { type: "string" } },
        max_recommended_risk_percent: nullableNumber(),
        position_size_status: { type: "string", enum: ["CALCULATED", "ACCOUNT_DATA_REQUIRED"] },
        position_size_formula: { type: "string" },
        position_size: nullableNumber(),
        missing_account_data: { type: "array", items: { type: "string" } },
      },
      required: [
        "risk_level",
        "event_risk",
        "upcoming_events",
        "max_recommended_risk_percent",
        "position_size_status",
        "position_size_formula",
        "position_size",
        "missing_account_data",
      ],
      additionalProperties: false,
    },

    trade_management: {
      type: "object",
      properties: {
        break_even_conditions: { type: "array", items: { type: "string" } },
        partial_profit_rules: { type: "array", items: { type: "string" } },
        trailing_stop_rules: { type: "array", items: { type: "string" } },
      },
      required: ["break_even_conditions", "partial_profit_rules", "trailing_stop_rules"],
      additionalProperties: false,
    },

    key_risks: { type: "array", items: { type: "string" } },
    what_would_change_the_analysis: { type: "array", items: { type: "string" } },

    audit: {
      type: "object",
      properties: {
        key_data_used: { type: "array", items: { type: "string" } },
        highest_weight_factors: { type: "array", items: { type: "string" } },
        warnings: { type: "array", items: { type: "string" } },
      },
      required: ["key_data_used", "highest_weight_factors", "warnings"],
      additionalProperties: false,
    },
  },
  required: [
    "analysis_id",
    "timestamp",
    "market",
    "data_quality",
    "market_regime",
    "current_price_context",
    "multi_timeframe",
    "technical_analysis",
    "macro_analysis",
    "dollar_analysis",
    "bond_analysis",
    "gold_fundamentals",
    "news_intelligence",
    "geopolitical_risk",
    "correlations",
    "factor_ranking",
    "conflict_level",
    "scenarios",
    "forecast",
    "recommendation",
    "trade_plan",
    "risk_management",
    "trade_management",
    "key_risks",
    "what_would_change_the_analysis",
    "audit",
  ],
  additionalProperties: false,
};

  /* ------------------------------------------------------------------ Client */

  var ENDPOINT = 'https://api.anthropic.com/v1/messages';

  function call(key, body) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        /* Required for CORS. Anthropic blocks browser calls without it. */
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (e) { /* not JSON */ }

        if (res.ok) return data;

        var apiMsg = (data && data.error && data.error.message) || '';
        var message;
        if (/credit balance is too low/i.test(apiMsg)) {
          message = 'The Anthropic credit balance is exhausted. Top up under Plans & Billing.';
        } else if (res.status === 401 || res.status === 403) {
          message = 'The Anthropic API key was rejected. Check the key in Settings.';
        } else if (res.status === 429) {
          message = 'Anthropic rate limit reached. Try again in a few minutes.';
        } else {
          message = 'Anthropic error ' + res.status + ': ' + (apiMsg || text.slice(0, 200));
        }
        throw new Error(message);
      });
    });
  }

  function guardStop(response, stage) {
    if (response.stop_reason === 'refusal') {
      throw new Error('The model declined this request (' + stage + ').');
    }
    if (response.stop_reason === 'max_tokens') {
      throw new Error('The response was cut off (' + stage + '). Try a lower effort level.');
    }
  }

  function textOf(response) {
    return (response.content || [])
      .filter(function (b) { return b.type === 'text' && typeof b.text === 'string'; })
      .map(function (b) { return b.text; })
      .join('\n')
      .trim();
  }

  /* Stage 1 — news and macro research with the web search tool.
     Kept separate from stage 2 because web search attaches citations to the
     answer text, and citations cannot be combined with a json_schema format. */
  function runResearch(key, model, market, asOf) {
    var first = {
      role: 'user',
      content: 'Market: ' + market + '\nCurrent date and time: ' + asOf +
        '\n\nProduce the news and market briefing now.'
    };
    var messages = [first];
    var searches = 0;
    var attempt = 0;

    function step() {
      return call(key, {
        model: model,
        max_tokens: 8000,
        system: [{ type: 'text', text: RESEARCH_PROMPT, cache_control: { type: 'ephemeral' } }],
        output_config: { effort: 'medium' },
        tools: [
          { type: 'web_search_20260209', name: 'web_search', max_uses: 10 },
          { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 }
        ],
        messages: messages
      }).then(function (response) {
        guardStop(response, 'research');
        var use = (response.usage || {}).server_tool_use || {};
        searches += Number(use.web_search_requests || 0);

        if (response.stop_reason === 'pause_turn' && ++attempt < 4) {
          messages = [first, { role: 'assistant', content: response.content }];
          return step();
        }
        return { briefing: textOf(response), searches: searches };
      });
    }

    return step();
  }

  function buildAnalysisPrompt(body, briefing, asOf) {
    var lines = [];
    lines.push('Market: ' + (body.market || 'XAU/USD'));
    lines.push('Analysis time: ' + asOf);
    lines.push('');

    var used = function (o) {
      return Object.keys(o || {}).filter(function (k) {
        var v = o[k];
        return v !== '' && v !== null && v !== undefined;
      });
    };

    lines.push('=== USER-SUPPLIED MARKET SNAPSHOT (Layer 2 — MARKET DATA) ===');
    var snapKeys = used(body.snapshot);
    if (snapKeys.length) {
      snapKeys.forEach(function (k) { lines.push('- ' + k + ': ' + body.snapshot[k]); });
    } else {
      lines.push('(none supplied — treat live market data as unavailable and score data quality accordingly)');
    }
    lines.push('');

    lines.push('=== ACCOUNT DATA (Section 27) ===');
    var accKeys = used(body.account);
    if (accKeys.length) {
      accKeys.forEach(function (k) { lines.push('- ' + k + ': ' + body.account[k]); });
    } else {
      lines.push('(none supplied — report ACCOUNT_DATA_REQUIRED and list what is missing)');
    }
    lines.push('');

    lines.push('=== NEWS AND MACRO BRIEFING (Layer 1/3) ===');
    lines.push(briefing || '(no research briefing available — treat news data as missing and reduce confidence)');
    lines.push('');

    if (body.notes) {
      lines.push('=== USER NOTES ===');
      lines.push(body.notes);
      lines.push('');
    }

    lines.push(
      'Run the full 20-step final decision process from Section 40 and return the structured JSON object. ' +
      'Scenario probabilities must sum to exactly 100. Never invent price levels that the supplied data ' +
      'does not support — where a level is unknown, use null and lower the data quality score.'
    );

    return lines.join('\n');
  }

  var EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];

  /* Returns the same payload shape the edge function returns, so the renderer
     does not care which mode produced it. */
  function run(opts) {
    var key = opts.apiKey;
    var model = opts.model || 'claude-opus-5';
    var body = opts.body || {};
    var market = String(body.market || 'XAU/USD').slice(0, 32);
    var effort = EFFORTS.indexOf(body.effort) > -1 ? body.effort : 'high';
    var asOf = new Date().toISOString();
    var onStage = opts.onStage || function () {};

    if (!key) return Promise.reject(new Error('No Anthropic API key set. Open Settings and paste one.'));

    var research = Promise.resolve({ briefing: '', searches: 0 });
    if (body.useWebSearch !== false) {
      onStage('Researching live news and macro data…');
      research = runResearch(key, model, market, asOf);
    }

    return research.then(function (r) {
      onStage('Running the 20-step decision process…');
      return call(key, {
        model: model,
        max_tokens: 16000,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        output_config: {
          effort: effort,
          format: { type: 'json_schema', schema: ANALYSIS_SCHEMA }
        },
        messages: [{ role: 'user', content: buildAnalysisPrompt(body, r.briefing, asOf) }]
      }).then(function (response) {
        guardStop(response, 'analysis');

        var parsed;
        try {
          parsed = JSON.parse(textOf(response));
        } catch (e) {
          throw new Error('The model returned output that was not valid JSON.');
        }

        return {
          ok: true,
          analysis: parsed,
          briefing: r.briefing,
          meta: { model: model, effort: effort, web_searches: r.searches, generated_at: asOf }
        };
      });
    });
  }

  global.GoldEngine = { run: run, SYSTEM_PROMPT: SYSTEM_PROMPT, ANALYSIS_SCHEMA: ANALYSIS_SCHEMA };
})(window);
