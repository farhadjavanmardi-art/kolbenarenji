/* ============================================================================
 * Gold Intelligence AI — application logic
 * ==========================================================================*/
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var Store = {
    SETTINGS: 'gold-ai-settings-v1',
    JOURNAL: 'gold-ai-journal-v1',
    settings: { mode: 'direct', apiKey: '', model: 'claude-opus-5', endpoint: '', accessCode: '' },
    journal: [],
    load: function () {
      try {
        /* Merge rather than replace, so settings saved before a field existed
           still pick up its default instead of arriving undefined. */
        var saved = JSON.parse(localStorage.getItem(this.SETTINGS)) || {};
        for (var k in this.settings) {
          if (saved[k] !== undefined && saved[k] !== null) this.settings[k] = saved[k];
        }
      } catch (e) { /* keep defaults */ }
      try { this.journal = JSON.parse(localStorage.getItem(this.JOURNAL)) || []; }
      catch (e) { this.journal = []; }
      return this;
    },
    saveSettings: function () {
      try { localStorage.setItem(this.SETTINGS, JSON.stringify(this.settings)); } catch (e) {}
    },
    saveJournal: function () {
      try { localStorage.setItem(this.JOURNAL, JSON.stringify(this.journal)); } catch (e) {}
    }
  };

  var esc = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var num = function (v, digits) {
    if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '—';
    return Number(v).toFixed(digits === undefined ? 2 : digits);
  };

  var slug = function (v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'); };

  var val = function (id) { return $('#' + id).value.trim(); };
  var numVal = function (id) { var v = val(id); return v === '' ? '' : Number(v); };

  /* ---------------------------------------------------------------- Rendering */

  var Render = {
    list: function (items, emptyText) {
      if (!items || !items.length) return '<p class="dim small">' + esc(emptyText || 'None reported.') + '</p>';
      return '<ul class="clean">' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    },

    metric: function (key, value, sub) {
      return '<div class="metric"><div class="k">' + esc(key) + '</div>' +
        '<div class="v">' + esc(value) + '</div>' +
        (sub ? '<div class="s">' + esc(sub) + '</div>' : '') + '</div>';
    },

    bar: function (value, tone) {
      var pct = Math.max(0, Math.min(100, Number(value) || 0));
      return '<div class="bar ' + (tone || '') + '"><span style="width:' + pct + '%"></span></div>';
    },

    pill: function (text) {
      return '<span class="pill ' + slug(text) + '">' + esc(text || '—') + '</span>';
    },

    kv: function (pairs) {
      var rows = pairs.filter(function (p) { return p[1]; }).map(function (p) {
        return '<dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd>';
      });
      if (!rows.length) return '<p class="dim small">No data.</p>';
      return '<dl class="kv">' + rows.join('') + '</dl>';
    },

    verdict: function (a) {
      var rec = a.recommendation || {};
      var reg = a.market_regime || {};
      var dq = a.data_quality || {};
      return '<div class="verdict">' +
        '<div class="action ' + slug(rec.action) + '">' + esc(rec.action || '—') + '</div>' +
        '<div class="meta">' +
          '<div class="big">Confidence ' + num(rec.confidence, 0) + '/100 · ' + esc(rec.confidence_level || '—') + '</div>' +
          '<div class="dim small">' + esc(rec.decision_quality || '') + '</div>' +
        '</div>' +
        '<div class="grid c3" style="flex:2;min-width:280px">' +
          Render.metric('Regime', reg.type || '—', 'Trend strength ' + num(reg.trend_strength, 0)) +
          Render.metric('Data quality', num(dq.score, 0), dq.status || '') +
          Render.metric('Conflict level', num(a.conflict_level, 0), reg.crisis_mode ? 'CRISIS MODE' : 'Normal conditions') +
        '</div>' +
      '</div>';
    },

    reasoning: function (a) {
      var rec = a.recommendation || {};
      return '<div class="card"><h2>Why this decision <span class="sec">Section 42 — explainability</span></h2>' +
        Render.list(rec.primary_reasoning, 'No reasoning returned.') +
        '<details style="margin-top:14px"><summary>What would prove this wrong</summary>' +
        Render.list(a.what_would_change_the_analysis, 'No invalidation conditions returned.') +
        '</details></div>';
    },

    regime: function (a) {
      var r = a.market_regime || {};
      var dq = a.data_quality || {};
      var cpc = a.current_price_context || {};
      var chg = Number(cpc.change_percent);
      return '<div class="card"><h2>Market regime &amp; data quality <span class="sec">Sections 4–5</span></h2>' +
        '<div class="grid c3" style="margin-bottom:14px">' +
          Render.metric('Price used', num(cpc.price), a.market || 'XAU/USD') +
          Render.metric('Change', isNaN(chg) ? '—' : (chg > 0 ? '+' : '') + num(chg) + '%', 'Since previous close') +
          Render.metric('Session', cpc.session_context || '—', 'Section 5 — liquidity context') +
        '</div>' +
        '<div class="grid c2">' +
          '<div>' + Render.kv([
            ['Regime', r.type], ['Volatility', r.volatility_level], ['Liquidity', r.liquidity_condition],
            ['News sensitivity', r.news_sensitivity], ['False breakout risk', r.false_breakout_risk],
            ['Crisis mode', r.crisis_mode ? 'TRUE' : 'FALSE']
          ]) + '<p class="small dim" style="margin-top:10px">' + esc(r.description || '') + '</p></div>' +
          '<div>' + Render.kv([
            ['Score', num(dq.score, 0) + ' / 100'], ['Status', dq.status], ['Freshness', dq.freshness]
          ]) +
          (dq.conflicts && dq.conflicts.length
            ? '<div style="margin-top:10px"><span class="pill bearish">Data conflicts</span>' + Render.list(dq.conflicts) + '</div>'
            : '') +
          '</div>' +
        '</div></div>';
    },

    timeframes: function (a) {
      var mtf = a.multi_timeframe || {};
      var order = [['monthly', 'Monthly'], ['weekly', 'Weekly'], ['daily', 'Daily'], ['4h', '4H'], ['1h', '1H'], ['15m', '15M']];
      var cells = order.map(function (o) {
        var t = mtf[o[0]] || {};
        var dir = String(t.trend || '').toLowerCase();
        var tone = dir.indexOf('bull') > -1 ? 'bull' : dir.indexOf('bear') > -1 ? 'bear' : 'neutral';
        return '<div class="metric"><div class="k">' + o[1] + '</div>' +
          '<div class="v" style="font-size:.94rem">' + esc(t.trend || '—') + '</div>' +
          Render.bar(t.strength, tone) +
          '<div class="s">Strength ' + num(t.strength, 0) + '</div></div>';
      }).join('');

      var ta = a.technical_analysis || {};
      return '<div class="card"><h2>Multi-timeframe &amp; technicals <span class="sec">Sections 6–7</span></h2>' +
        '<div class="grid c3">' + cells + '</div>' +
        '<div class="grid c2" style="margin-top:14px">' +
          '<div>' + Render.kv([
            ['Structure', ta.market_structure], ['Momentum', ta.momentum],
            ['Support', (ta.support_levels || []).join(' · ')],
            ['Resistance', (ta.resistance_levels || []).join(' · ')]
          ]) + '</div>' +
          '<div class="grid c2">' +
            '<div class="metric"><div class="k">Confluence</div><div class="v">' + num(ta.confluence_score, 0) + '</div>' + Render.bar(ta.confluence_score, 'bull') + '</div>' +
            '<div class="metric"><div class="k">Conflict</div><div class="v">' + num(ta.conflict_score, 0) + '</div>' + Render.bar(ta.conflict_score, 'bear') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:14px"><span class="pill gold">Key signals</span>' + Render.list(ta.key_signals) + '</div>' +
      '</div>';
    },

    macro: function (a) {
      var m = a.macro_analysis || {};
      var d = a.dollar_analysis || {};
      var b = a.bond_analysis || {};
      var g = a.gold_fundamentals || {};
      return '<div class="card"><h2>Macro, dollar, yields &amp; gold fundamentals <span class="sec">Sections 8–11</span></h2>' +
        '<div class="grid c2">' +
          '<div><h3 class="small dim" style="margin:0 0 8px">Macro ' + Render.pill(m.overall_bias) + '</h3>' +
            Render.kv([['Rates', m.interest_rates], ['Inflation', m.inflation], ['Growth', m.growth], ['Employment', m.employment]]) +
            Render.list(m.key_drivers) + '</div>' +
          '<div><h3 class="small dim" style="margin:0 0 8px">Dollar &amp; bonds</h3>' +
            Render.kv([
              ['DXY trend', d.dxy_trend], ['Impact on gold', d.impact_on_gold], ['Correlation', d.correlation_status],
              ['Nominal yields', b.nominal_yields], ['Real yields', b.real_yields], ['Yield impact', b.yield_impact_on_gold]
            ]) +
            (b.divergences && b.divergences.length ? '<span class="pill gold">Divergences</span>' + Render.list(b.divergences) : '') +
          '</div>' +
        '</div>' +
        '<div style="margin-top:14px"><h3 class="small dim" style="margin:0 0 8px">Gold-specific ' + Render.pill(g.overall_bias) + '</h3>' +
          Render.kv([
            ['Central banks', g.central_bank_activity], ['ETF flows', g.etf_flows],
            ['Physical demand', g.physical_demand], ['Supply', g.supply_conditions], ['Futures positioning', g.futures_positioning]
          ]) + '</div>' +
      '</div>';
    },

    news: function (a) {
      var n = a.news_intelligence || {};
      var geo = a.geopolitical_risk || {};
      var rows = (n.high_impact_events || []).map(function (e) {
        return '<tr>' +
          '<td>' + esc(e.headline) + '<div class="dim small">' + esc(e.category) + '</div></td>' +
          '<td>' + Render.pill(e.source_tier) + '</td>' +
          '<td class="mono">' + num(e.importance_score, 0) + '</td>' +
          '<td class="mono">' + (Number(e.gold_sentiment) > 0 ? '+' : '') + num(e.gold_sentiment, 0) + '</td>' +
          '<td>' + (e.already_priced_in ? 'Priced in' : 'Not priced in') + '</td>' +
          '<td class="small">' + esc(e.immediate) + '<div class="dim">1–5d: ' + esc(e.short_term) + '</div>' +
            '<div class="dim">1–4w: ' + esc(e.medium_term) + '</div><div class="dim">&gt;1m: ' + esc(e.long_term) + '</div></td>' +
        '</tr>';
      }).join('');

      var sent = Number(n.overall_sentiment_score) || 0;
      return '<div class="card"><h2>News intelligence <span class="sec">Sections 12–17</span></h2>' +
        '<div class="grid c3">' +
          Render.metric('Gold sentiment', (sent > 0 ? '+' : '') + num(sent, 0), '-100 bearish … +100 bullish') +
          Render.metric('Geopolitical risk', geo.level || '—', geo.expected_gold_impact || '') +
          Render.metric('Noise filtered', String((n.noise_filtered || []).length), 'LOW_SIGNAL_NOISE items') +
        '</div>' +
        (rows
          ? '<div class="table-wrap" style="margin-top:14px"><table><thead><tr>' +
            '<th>Event</th><th>Source</th><th>Impact</th><th>Sentiment</th><th>Priced in</th><th>Horizons</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<p class="dim small" style="margin-top:14px">No high-impact events reported.</p>') +
        (n.market_reaction_divergences && n.market_reaction_divergences.length
          ? '<div style="margin-top:14px"><span class="pill bearish">Market reaction divergence</span>' +
            Render.list(n.market_reaction_divergences) + '</div>'
          : '') +
        (geo.key_events && geo.key_events.length
          ? '<details style="margin-top:14px"><summary>Geopolitical events</summary>' + Render.list(geo.key_events) + '</details>'
          : '') +
        (n.noise_filtered && n.noise_filtered.length
          ? '<details style="margin-top:10px"><summary>Filtered as noise</summary>' + Render.list(n.noise_filtered) + '</details>'
          : '') +
      '</div>';
    },

    correlations: function (a) {
      var rows = (a.correlations || []).map(function (c) {
        return '<tr><td>' + esc(c.pair) + '</td><td>' + esc(c.current_correlation) + '</td>' +
          '<td>' + esc(c.historical_correlation) + '</td><td>' + esc(c.stability) + '</td>' +
          '<td>' + esc(c.breakdown_risk) + '</td></tr>';
      }).join('');
      if (!rows) return '';
      return '<div class="card"><h2>Intermarket correlations <span class="sec">Section 17</span></h2>' +
        '<div class="table-wrap"><table><thead><tr><th>Pair</th><th>Current</th><th>Historical</th>' +
        '<th>Stability</th><th>Breakdown risk</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    },

    factors: function (a) {
      var rows = (a.factor_ranking || []).map(function (f) {
        return '<tr><td>' + esc(f.factor) + '</td><td>' + Render.pill(f.direction) + '</td>' +
          '<td style="min-width:120px">' + num(f.impact_score, 0) + Render.bar(f.impact_score, slug(f.direction) === 'bullish' ? 'bull' : slug(f.direction) === 'bearish' ? 'bear' : 'neutral') + '</td>' +
          '<td class="mono">' + num(f.reliability, 0) + '</td><td>' + esc(f.time_horizon) + '</td></tr>';
      }).join('');
      if (!rows) return '';
      return '<div class="card"><h2>Factor ranking <span class="sec">Section 41</span></h2>' +
        '<div class="table-wrap"><table><thead><tr><th>Factor</th><th>Direction</th><th>Impact</th>' +
        '<th>Reliability</th><th>Horizon</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    },

    scenarios: function (a) {
      var s = a.scenarios || {};
      var sum = ['bullish', 'neutral', 'bearish'].reduce(function (t, k) {
        return t + (Number((s[k] || {}).probability) || 0);
      }, 0);

      var block = function (key, title) {
        var v = s[key] || {};
        var parts = ['<div class="scenario ' + key + '"><h3>' + title + '</h3>' +
          '<div class="prob">' + num(v.probability, 0) + '%</div>' +
          '<p class="dim small">' + esc(v.time_horizon || '') + '</p>'];
        if (v.triggers) parts.push('<strong class="small">Triggers</strong>' + Render.list(v.triggers));
        if (v.conditions) parts.push('<strong class="small">Conditions</strong>' + Render.list(v.conditions));
        if (v.confirmation) parts.push('<strong class="small">Confirmation required</strong>' + Render.list(v.confirmation));
        if (v.targets && v.targets.length) parts.push('<strong class="small">Targets</strong><p class="mono small">' + v.targets.join(' · ') + '</p>');
        if (v.range_low || v.range_high) parts.push('<strong class="small">Range</strong><p class="mono small">' + num(v.range_low) + ' – ' + num(v.range_high) + '</p>');
        if (v.invalidation) parts.push('<strong class="small">Invalidation</strong>' + Render.list(v.invalidation));
        if (v.key_risks) parts.push('<strong class="small">Key risks</strong>' + Render.list(v.key_risks));
        parts.push('</div>');
        return parts.join('');
      };

      var f = a.forecast || {};
      var horizons = [['intraday', 'Intraday'], ['short_term', '1–5 days'], ['medium_term', '1–4 weeks'], ['long_term', '1–12 months']]
        .map(function (h) {
          var v = f[h[0]] || {};
          return '<div class="metric"><div class="k">' + h[1] + '</div>' +
            '<div class="v" style="font-size:1rem">' + esc(v.bias || '—') + '</div>' +
            Render.bar(v.confidence, 'neutral') +
            '<div class="s">Confidence ' + num(v.confidence, 0) + '</div>' +
            (v.note ? '<div class="s dim">' + esc(v.note) + '</div>' : '') + '</div>';
        }).join('');

      return '<div class="card"><h2>Scenarios &amp; forecast horizons <span class="sec">Sections 18–19</span></h2>' +
        '<div class="grid c3">' + block('bullish', 'Bullish') + block('neutral', 'Neutral / range') + block('bearish', 'Bearish') + '</div>' +
        (Math.round(sum) !== 100
          ? '<div class="alert warn">Scenario probabilities sum to ' + num(sum, 0) + ', not 100. Treat the split as unreliable.</div>'
          : '') +
        '<div class="grid c4" style="margin-top:16px">' + horizons + '</div>' +
      '</div>';
    },

    tradePlan: function (a, sizing) {
      var t = a.trade_plan || {};
      var r = a.risk_management || {};
      var tm = a.trade_management || {};
      var rec = a.recommendation || {};
      var directional = rec.action === 'BUY' || rec.action === 'SELL';

      if (!directional) {
        return '<div class="card"><h2>Trade plan <span class="sec">Sections 23–30</span></h2>' +
          '<p class="dim">No trade plan issued — the decision is <strong>' + esc(rec.action) + '</strong>. ' +
          'Recognising a no-trade condition is an analytical success (Section 38).</p>' +
          (r.upcoming_events && r.upcoming_events.length
            ? '<div style="margin-top:12px"><span class="pill gold">Event risk: ' + esc(r.event_risk || '—') + '</span>' +
              Render.list(r.upcoming_events) + '</div>'
            : '') + '</div>';
      }

      return '<div class="card"><h2>Trade plan <span class="sec">Sections 23–30</span></h2>' +
        '<div class="grid c4">' +
          Render.metric('Preferred entry', num(t.preferred_entry), 'Zone ' + num(t.entry_zone_low) + ' – ' + num(t.entry_zone_high)) +
          Render.metric('Stop loss', num(t.stop_loss), t.stop_loss_reason || '') +
          Render.metric('Risk / reward', num(t.risk_reward_ratio), r.risk_level || '') +
          Render.metric('Event risk', r.event_risk || '—', (r.upcoming_events || []).length + ' upcoming') +
        '</div>' +
        '<div class="grid c3" style="margin-top:12px">' +
          Render.metric('TP1', num(t.take_profit_1)) +
          Render.metric('TP2', num(t.take_profit_2)) +
          Render.metric('TP3', num(t.take_profit_3)) +
        '</div>' +
        '<div class="grid c2" style="margin-top:14px">' +
          '<div>' + Render.kv([
            ['Aggressive entry', num(t.aggressive_entry)],
            ['Conservative entry', num(t.conservative_entry)],
            ['Confirmation', t.confirmation_requirement]
          ]) +
          (t.target_notes && t.target_notes.length ? Render.list(t.target_notes) : '') + '</div>' +
          '<div>' +
            '<span class="pill ' + (r.position_size_status === 'CALCULATED' ? 'gold' : 'bearish') + '">' +
              esc(r.position_size_status || '—') + '</span>' +
            Render.kv([
              ['Model size', num(r.position_size, 3)],
              ['Independent size', sizing ? num(sizing.lots, 3) + ' lot · risk ' + num(sizing.riskAmount) : ''],
              ['Max risk %', num(r.max_recommended_risk_percent)],
              ['Formula', r.position_size_formula]
            ]) +
            (r.missing_account_data && r.missing_account_data.length
              ? '<div class="small dim">Missing: ' + esc(r.missing_account_data.join(', ')) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<details style="margin-top:14px"><summary>Trade management &amp; invalidation</summary>' +
          '<div class="grid c2" style="margin-top:10px">' +
            '<div><strong class="small">Break even</strong>' + Render.list(tm.break_even_conditions) +
              '<strong class="small">Partial profit</strong>' + Render.list(tm.partial_profit_rules) +
              '<strong class="small">Trailing stop</strong>' + Render.list(tm.trailing_stop_rules) + '</div>' +
            '<div><strong class="small">Invalidation</strong>' + Render.list(t.invalidation_conditions) +
              '<strong class="small">Upcoming events</strong>' + Render.list(r.upcoming_events) + '</div>' +
          '</div></details>' +
      '</div>';
    },

    audit: function (a, meta, briefing) {
      var au = a.audit || {};
      return '<div class="card"><h2>Audit trail <span class="sec">Section 39</span></h2>' +
        '<div class="grid c2">' +
          '<div><strong class="small">Key data used</strong>' + Render.list(au.key_data_used) + '</div>' +
          '<div><strong class="small">Highest weight factors</strong>' + Render.list(au.highest_weight_factors) + '</div>' +
        '</div>' +
        (au.warnings && au.warnings.length
          ? '<div style="margin-top:12px"><span class="pill bearish">Warnings</span>' + Render.list(au.warnings) + '</div>'
          : '') +
        '<div style="margin-top:12px"><strong class="small">Key risks</strong>' + Render.list(a.key_risks) + '</div>' +
        (briefing
          ? '<details style="margin-top:14px"><summary>Research briefing (Section 13 raw input)</summary>' +
            '<pre class="brief">' + esc(briefing) + '</pre></details>'
          : '') +
        '<p class="dim small" style="margin-top:12px">' +
          esc(a.analysis_id || '') + ' · ' + esc(a.timestamp || '') + ' · model ' + esc(meta.model || '') +
          ' · effort ' + esc(meta.effort || '') + ' · ' + esc(String(meta.web_searches || 0)) + ' web searches' +
        '</p>' +
      '</div>';
    },

    all: function (payload, sizing) {
      var a = payload.analysis || {};
      return Render.verdict(a) +
        Render.reasoning(a) +
        Render.tradePlan(a, sizing) +
        Render.scenarios(a) +
        Render.regime(a) +
        Render.timeframes(a) +
        Render.macro(a) +
        Render.news(a) +
        Render.factors(a) +
        Render.correlations(a) +
        Render.audit(a, payload.meta || {}, payload.briefing);
    }
  };

  /* ------------------------------------------------------------- Position size */

  function computeSize(account, plan) {
    var balance = Number(account.account_balance);
    var riskPct = Number(account.max_risk_percent);
    var contract = Number(account.contract_size);
    var entry = Number(plan.preferred_entry);
    var stop = Number(plan.stop_loss);

    if (!balance || !riskPct || !contract || !entry || !stop) return null;
    var distance = Math.abs(entry - stop);
    if (!distance) return null;

    var riskAmount = balance * riskPct / 100;
    return { riskAmount: riskAmount, distance: distance, lots: riskAmount / (distance * contract) };
  }

  /* -------------------------------------------------------------------- Journal */

  var Journal = {
    add: function (payload, sizing) {
      var a = payload.analysis || {};
      var rec = a.recommendation || {};
      var plan = a.trade_plan || {};
      Store.journal.unshift({
        id: a.analysis_id || ('gia-' + Date.now()),
        at: a.timestamp || new Date().toISOString(),
        market: a.market || 'XAU/USD',
        action: rec.action,
        confidence: Number(rec.confidence) || 0,
        regime: (a.market_regime || {}).type || '',
        dataQuality: Number((a.data_quality || {}).score) || 0,
        entry: plan.preferred_entry,
        stop: plan.stop_loss,
        tp1: plan.take_profit_1,
        rr: plan.risk_reward_ratio,
        bull: ((a.scenarios || {}).bullish || {}).probability,
        bear: ((a.scenarios || {}).bearish || {}).probability,
        lots: sizing ? sizing.lots : null,
        outcome: 'pending'
      });
      Store.journal = Store.journal.slice(0, 300);
      Store.saveJournal();
    },

    metrics: function () {
      var resolved = Store.journal.filter(function (e) { return e.outcome === 'win' || e.outcome === 'loss'; });
      var directional = Store.journal.filter(function (e) {
        return (e.action === 'BUY' || e.action === 'SELL') && e.outcome !== 'pending';
      });
      var wins = resolved.filter(function (e) { return e.outcome === 'win'; });
      var losses = resolved.filter(function (e) { return e.outcome === 'loss'; });

      var avgWinR = wins.length
        ? wins.reduce(function (t, e) { return t + (Number(e.rr) || 1); }, 0) / wins.length : 0;
      var winRate = resolved.length ? wins.length / resolved.length : 0;
      var expectancy = resolved.length ? (winRate * avgWinR) - ((1 - winRate) * 1) : 0;

      var correct = directional.filter(function (e) { return e.outcome === 'win'; }).length;

      return {
        total: Store.journal.length,
        pending: Store.journal.filter(function (e) { return e.outcome === 'pending'; }).length,
        resolved: resolved.length,
        winRate: winRate,
        lossRate: resolved.length ? losses.length / resolved.length : 0,
        avgWinR: avgWinR,
        expectancy: expectancy,
        directionAccuracy: directional.length ? correct / directional.length : 0,
        directionCount: directional.length
      };
    },

    calibration: function () {
      var buckets = [
        { label: '0–24 Very Low', lo: 0, hi: 24 },
        { label: '25–49 Low', lo: 25, hi: 49 },
        { label: '50–69 Moderate', lo: 50, hi: 69 },
        { label: '70–84 High', lo: 70, hi: 84 },
        { label: '85–100 Very High', lo: 85, hi: 100 }
      ];
      return buckets.map(function (b) {
        var items = Store.journal.filter(function (e) {
          return e.outcome !== 'pending' && e.confidence >= b.lo && e.confidence <= b.hi;
        });
        var wins = items.filter(function (e) { return e.outcome === 'win'; }).length;
        var stated = items.length ? items.reduce(function (t, e) { return t + e.confidence; }, 0) / items.length : 0;
        var actual = items.length ? (wins / items.length) * 100 : 0;
        b.count = items.length;
        b.stated = stated;
        b.actual = actual;
        b.gap = stated - actual;
        return b;
      });
    },

    render: function () {
      var m = Journal.metrics();
      $('#perfTiles').innerHTML =
        Render.metric('Predictions', String(m.total), m.pending + ' pending') +
        Render.metric('Direction accuracy', m.directionCount ? (m.directionAccuracy * 100).toFixed(0) + '%' : '—', m.directionCount + ' directional calls') +
        Render.metric('Win rate', m.resolved ? (m.winRate * 100).toFixed(0) + '%' : '—', m.resolved + ' resolved') +
        Render.metric('Expectancy', m.resolved ? m.expectancy.toFixed(2) + ' R' : '—', 'Avg win ' + m.avgWinR.toFixed(2) + ' R');

      var cal = Journal.calibration();
      var poor = cal.some(function (b) { return b.count >= 5 && b.gap > 15; });
      var rows = cal.map(function (b) {
        return '<tr><td>' + b.label + '</td><td class="mono">' + b.count + '</td>' +
          '<td class="mono">' + (b.count ? b.stated.toFixed(0) : '—') + '</td>' +
          '<td class="mono">' + (b.count ? b.actual.toFixed(0) + '%' : '—') + '</td>' +
          '<td class="mono">' + (b.count ? (b.gap > 0 ? '+' : '') + b.gap.toFixed(0) : '—') + '</td></tr>';
      }).join('');

      $('#calibration').innerHTML =
        (poor ? '<div class="alert warn"><strong>POOR_PROBABILITY_CALIBRATION</strong> — stated confidence exceeds measured accuracy by more than 15 points in at least one bucket (Section 33).</div>' : '') +
        '<div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>Confidence bucket</th>' +
        '<th>Resolved</th><th>Stated</th><th>Actual</th><th>Gap</th></tr></thead><tbody>' + rows + '</tbody></table></div>';

      if (!Store.journal.length) {
        $('#journalList').innerHTML = '<p class="empty">No predictions logged yet. Every analysis you run is stored here.</p>';
        return;
      }

      var body = Store.journal.map(function (e, i) {
        return '<tr>' +
          '<td class="small">' + esc(new Date(e.at).toLocaleString()) + '<div class="dim mono">' + esc(e.id) + '</div></td>' +
          '<td>' + Render.pill(e.action) + '<div class="dim small">Conf ' + e.confidence + '</div></td>' +
          '<td class="mono small">' + num(e.entry) + ' / ' + num(e.stop) + '<div class="dim">RR ' + num(e.rr) + '</div></td>' +
          '<td class="small">' + esc(e.regime) + '<div class="dim">DQ ' + e.dataQuality + '</div></td>' +
          '<td><select data-idx="' + i + '" class="outcome-select">' +
            ['pending', 'win', 'loss', 'neutral'].map(function (o) {
              return '<option value="' + o + '"' + (e.outcome === o ? ' selected' : '') + '>' + o + '</option>';
            }).join('') +
          '</select></td>' +
        '</tr>';
      }).join('');

      $('#journalList').innerHTML = '<div class="table-wrap"><table><thead><tr>' +
        '<th>When</th><th>Decision</th><th>Entry / Stop</th><th>Context</th><th>Outcome</th>' +
        '</tr></thead><tbody>' + body + '</tbody></table></div>';

      $$('.outcome-select').forEach(function (sel) {
        sel.addEventListener('change', function () {
          Store.journal[Number(sel.getAttribute('data-idx'))].outcome = sel.value;
          Store.saveJournal();
          Journal.render();
        });
      });
    }
  };

  /* ------------------------------------------------------------------- Analysis */

  function collect() {
    var snapshot = {
      spot_price: numVal('price'),
      change_percent: numVal('changePct'),
      dxy: numVal('dxy'),
      us_10y_yield: numVal('us10y'),
      us_2y_yield: numVal('us2y'),
      us_10y_real_yield: numVal('realYield'),
      daily_atr: numVal('atr'),
      vix: numVal('vix'),
      known_levels: val('levels'),
      observed_structure: val('structure')
    };
    var account = {
      account_balance: numVal('balance'),
      max_risk_percent: numVal('riskPct'),
      max_daily_loss_percent: numVal('maxDaily'),
      leverage: numVal('leverage'),
      contract_size: numVal('contractSize'),
      tick_value: numVal('tickValue'),
      current_open_positions: val('openPositions'),
      account_currency: val('currency')
    };
    return {
      market: 'XAU/USD',
      snapshot: snapshot,
      account: account,
      notes: val('notes'),
      effort: $('#effort').value,
      useWebSearch: $('#useWebSearch').checked,
      accessCode: Store.settings.accessCode
    };
  }

  function setStatus(on, text) {
    $('#status').classList.toggle('on', !!on);
    if (text) $('#statusText').textContent = text;
  }

  function showError(message, tone) {
    $('#error').innerHTML = message
      ? '<div class="alert' + (tone === 'warn' ? ' warn' : '') + '">' + esc(message) + '</div>'
      : '';
  }

  /* Direct mode drives the Anthropic API from this page; backend mode posts to
     the Supabase function. Both settle to the same payload shape. */
  function request(body) {
    if (Store.settings.mode === 'direct') {
      return GoldEngine.run({
        apiKey: Store.settings.apiKey,
        model: Store.settings.model,
        body: body,
        onStage: function (text) { setStatus(true, text); }
      });
    }

    return fetch(Store.settings.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data.ok) {
          throw new Error(data.message || data.error || 'The analysis request failed.');
        }
        return data;
      });
    });
  }

  function run() {
    var direct = Store.settings.mode === 'direct';

    if (direct && !Store.settings.apiKey) {
      showError('No Anthropic API key set. Open Settings and paste one.');
      return;
    }
    if (!direct && !Store.settings.endpoint) {
      showError('No analysis endpoint configured. Open Settings and paste the gold-analysis function URL.');
      return;
    }

    var body = collect();
    showError('');
    setStatus(true, body.useWebSearch
      ? 'Researching news and macro data, then running the 20-step decision process…'
      : 'Running the 20-step decision process…');
    $('#runBtn').disabled = true;
    $('#result').innerHTML = '';

    request(body).then(function (data) {
      var sizing = computeSize(body.account, (data.analysis || {}).trade_plan || {});
      $('#result').innerHTML = Render.all(data, sizing);
      Journal.add(data, sizing);
      Journal.render();
    }).catch(function (err) {
      showError(err.message || 'The analysis request failed.');
    }).then(function () {
      setStatus(false);
      $('#runBtn').disabled = false;
    });
  }

  /* ----------------------------------------------------------------------- Boot */

  function initTabs() {
    $$('.tabs button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        $$('.tabs button').forEach(function (b) { b.classList.toggle('active', b === btn); });
        ['analyze', 'journal', 'settings'].forEach(function (t) {
          $('#tab-' + t).hidden = t !== tab;
        });
        if (tab === 'journal') Journal.render();
      });
    });
  }

  function syncModeFields() {
    var direct = $('#mode').value === 'direct';
    $('#directFields').hidden = !direct;
    $('#backendFields').hidden = direct;
    $('#modelTag').textContent = direct ? 'XAU/USD · direct' : 'XAU/USD · backend';
  }

  function initSettings() {
    $('#mode').value = Store.settings.mode || 'direct';
    $('#apiKey').value = Store.settings.apiKey || '';
    $('#model').value = Store.settings.model || 'claude-opus-5';
    $('#endpoint').value = Store.settings.endpoint || '';
    $('#accessCode').value = Store.settings.accessCode || '';
    syncModeFields();

    $('#mode').addEventListener('change', syncModeFields);

    $('#saveSettings').addEventListener('click', function () {
      Store.settings.mode = $('#mode').value;
      Store.settings.apiKey = $('#apiKey').value.trim();
      Store.settings.model = val('model') || 'claude-opus-5';
      Store.settings.endpoint = val('endpoint');
      Store.settings.accessCode = $('#accessCode').value;
      Store.saveSettings();
      syncModeFields();
      $('#settingsSaved').textContent = 'Saved.';
      setTimeout(function () { $('#settingsSaved').textContent = ''; }, 2400);
    });
  }

  function initJournalActions() {
    $('#exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(Store.journal, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gold-intelligence-journal.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $('#clearBtn').addEventListener('click', function () {
      if (!confirm('Delete every logged prediction? This cannot be undone.')) return;
      Store.journal = [];
      Store.saveJournal();
      Journal.render();
    });
  }

  Store.load();
  initTabs();
  initSettings();
  initJournalActions();
  Journal.render();
  $('#runBtn').addEventListener('click', run);
})();
