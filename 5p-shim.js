// 5P on kolbenarenji.com: stand-in for the claude.ai page runtime (window.claude.use).
//   sample    -> signed-in admin: Supabase function fivep-generate (site key, stays on the server)
//                everyone else: Claude API straight from the browser, with the visitor's own API key
//   prompts   -> loaded from Supabase (fivep_settings / fivep_pillars / fivep_sections), editable there
//   db        -> this browser's localStorage
//   user      -> a single local user
//   downloads -> a normal file download
// The key is entered by the visitor, kept only in their browser, and sent only to api.anthropic.com.
(() => {
  const PREFIX = "5p:";
  const KEY_SLOT = "5p-api-key";
  const MODEL = "claude-opus-5-5";
  const SB_URL = "https://aqxlxnczzaqbdtjpdbal.supabase.co";
  const SB_KEY = "sb_publishable_W1_fIGS4g9w_GvLi4vpkqA_-YxbFAk7";
  const sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
  let admin = null; // { email } when a signed-in admin uses the site key

  async function refreshAdmin() {
    admin = null;
    if (!sb) return;
    try {
      const { data } = await sb.auth.getSession();
      const s = data && data.session;
      if (!s) return;
      const { data: ok } = await sb.rpc("is_admin");
      if (ok === true) admin = { email: s.user.email };
    } catch {}
  }

  // Prompts, rules and professional examples from Supabase; the built-in ones stay if this fails.
  async function loadConfig() {
    const get = (path) => fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
    try {
      const [settings, pillars, sections] = await Promise.all([
        get("fivep_settings?select=key,value"),
        get("fivep_pillars?select=id,purpose,boundary"),
        get("fivep_sections?select=pillar,no,purpose,must,example&kind=neq.engine"),
      ]);
      const val = (k) => (settings.find((x) => x.key === k) || {}).value;
      window.applyConfig && window.applyConfig({ rules: val("rules"), format: val("format"), pillars, sections });
      window.FIVEP_CONFIG_SOURCE = "supabase";
    } catch { window.FIVEP_CONFIG_SOURCE = "built-in"; }
  }

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} },
  };
  const store = {
    get(k) { const v = ls.get(PREFIX + k); try { return v ? JSON.parse(v) : undefined; } catch { return undefined; } },
    set(k, v) { localStorage.setItem(PREFIX + k, JSON.stringify(v)); },
    keys(prefix) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(PREFIX + prefix)) out.push(k.slice(PREFIX.length)); } } catch {} return out; },
  };

  const db = {
    collection(col) {
      return {
        doc(id) {
          const key = col + "/" + id;
          return {
            async set(obj) { store.set(key, obj); },
            async get() { const v = store.get(key); return { id, exists: v !== undefined, data: () => v }; },
          };
        },
        async get() {
          const docs = store.keys(col + "/").map((k) => { const id = k.slice(col.length + 1); const v = store.get(k); return { id, data: () => v }; });
          return { docs };
        },
      };
    },
  };

  const user = { async id() { return "local"; }, isOwner: () => true, canEdit: () => true };

  const downloads = {
    async save({ filename, data }) {
      const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
      const a = Object.assign(document.createElement("a"), { href: url, download: filename });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },
  };

  // The page asks for JSON in the prompt; take the outermost object from the answer.
  function extractJson(text) {
    const t = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) throw { code: "invalid_json", message: "پاسخ Claude قابل خواندن نبود." };
    try { return JSON.parse(t.slice(a, b + 1)); } catch { throw { code: "invalid_json", message: "پاسخ Claude قابل خواندن نبود." }; }
  }

  async function askServer(prompt, opts) {
    const { data } = await sb.auth.getSession();
    const token = data && data.session && data.session.access_token;
    if (!token) { admin = null; markButton(); throw { code: "auth", message: "ورود مدیر منقضی شده؛ دوباره وارد شوید." }; }
    let res;
    try {
      res = await fetch(`${SB_URL}/functions/v1/fivep-generate`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SB_KEY, Authorization: "Bearer " + token },
        body: JSON.stringify({ prompt }),
        signal: opts.signal,
      });
    } catch (e) {
      if (opts.signal && opts.signal.aborted) throw { code: "cancelled", message: "متوقف شد." };
      throw { code: "network", message: "اتصال به سرور برقرار نشد." };
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw { code: body.code || "server_error", message: body.message || "خطای سرور" };
    return body.data;
  }

  async function ask(prompt, opts = {}) {
    if (admin && sb) return askServer(prompt, opts);
    const apiKey = ls.get(KEY_SLOT);
    if (!apiKey) { openKeyPanel(); throw { code: "no_key", message: "برای نوشتن متن، اول کلید API خود را از دکمه‌ی «کلید API» بالای صفحه وارد کنید." }; }
    const Anthropic = window.Anthropic;
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, ...(window.FIVEP_BASE_URL ? { baseURL: window.FIVEP_BASE_URL } : {}) });
    let msg;
    try {
      const stream = client.beta.messages.stream(
        {
          model: MODEL,
          max_tokens: 64000,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          messages: [{ role: "user", content: prompt }],
        },
        { signal: opts.signal },
      );
      msg = await stream.finalMessage();
    } catch (e) {
      if (opts.signal && opts.signal.aborted) throw { code: "cancelled", message: "متوقف شد." };
      if (e instanceof Anthropic.AuthenticationError) { openKeyPanel(); throw { code: "auth", message: "کلید API معتبر نیست. آن را دوباره وارد کنید." }; }
      if (e instanceof Anthropic.RateLimitError) throw { code: "rate_limited", message: "درخواست‌ها زیاد شد." };
      if (e instanceof Anthropic.APIError) throw { code: "api_error", message: `خطای Claude API (${e.status ?? "شبکه"})` };
      throw { code: "network", message: "اتصال به Claude برقرار نشد." };
    }
    if (msg.stop_reason === "refusal") throw { code: "refused", message: "Claude به این درخواست پاسخ نداد." };
    if (msg.stop_reason === "max_tokens") throw { code: "invalid_json", message: "پاسخ ناقص ماند. دوباره امتحان کنید." };
    return extractJson(msg.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
  }
  const sample = Object.assign((input, opts) => ask(input, opts).then((d) => ({ text: JSON.stringify(d), truncated: false })), { json: ask });

  /* ---- API key panel ---- */
  let panel = null;
  function openKeyPanel() {
    if (panel) { panel.hidden = false; panel.querySelector("input").focus(); return; }
    panel = document.createElement("div");
    panel.className = "card";
    panel.id = "keyPanel";
    panel.style.cssText = "position:fixed;z-index:30;left:16px;right:16px;top:calc(16px + env(safe-area-inset-top,0px));max-width:520px;margin:0 auto;box-shadow:0 8px 30px rgba(0,0,0,.25)";
    panel.innerHTML = `
      <h3 style="margin-top:0">کلید Claude API</h3>
      <div id="adminBox" class="note info"></div>
      <p class="small muted">برای نوشتن متن ستون‌ها، کلید API خودتان را از platform.claude.com وارد کنید. کلید فقط در همین مرورگر می‌ماند و مستقیم به Anthropic فرستاده می‌شود؛ به هیچ سرور دیگری نمی‌رود. هزینه‌ی هر تحلیل کامل (حدود ۱۵ درخواست) به حساب API شما نوشته می‌شود.</p>
      <div class="field"><label for="apiKeyInput">کلید API</label><input id="apiKeyInput" type="password" dir="ltr" autocomplete="off" placeholder="sk-ant-..."></div>
      <div class="row" style="margin-top:12px">
        <button class="btn pri" id="keySave">ذخیره</button>
        <button class="btn" id="keyClear">پاک کردن کلید</button>
        <button class="btn" id="keyClose">بستن</button>
        <span class="small muted" id="keyState"></span>
      </div>`;
    document.body.append(panel);
    const input = panel.querySelector("#apiKeyInput");
    const state = panel.querySelector("#keyState");
    const refresh = () => { state.textContent = ls.get(KEY_SLOT) ? "کلید ذخیره شده است." : "کلیدی ذخیره نشده."; };
    input.value = ls.get(KEY_SLOT) || "";
    refresh();
    panel.querySelector("#keySave").onclick = () => { ls.set(KEY_SLOT, input.value.trim()); refresh(); if (ls.get(KEY_SLOT)) panel.hidden = true; markButton(); };
    panel.querySelector("#keyClear").onclick = () => { ls.set(KEY_SLOT, ""); input.value = ""; refresh(); markButton(); };
    panel.querySelector("#keyClose").onclick = () => { panel.hidden = true; };
    renderAdmin();
    input.focus();
  }
  function renderAdmin() {
    const box = panel && panel.querySelector("#adminBox");
    if (!box) return;
    box.replaceChildren();
    if (!sb) { box.textContent = "ورود مدیر در این صفحه در دسترس نیست."; return; }
    if (admin) {
      box.append(`وارد شده‌اید (${admin.email}). متن‌ها با کلید سایت نوشته می‌شوند و کلید شخصی لازم نیست. `);
      const out = Object.assign(document.createElement("button"), { className: "btn small", type: "button", textContent: "خروج" });
      out.onclick = async () => { await sb.auth.signOut().catch(() => {}); admin = null; renderAdmin(); markButton(); };
      box.append(out);
      return;
    }
    box.innerHTML = `<strong>مدیر سایت هستید؟</strong> با حساب مدیر وارد شوید تا از کلید سایت استفاده شود.
      <div class="fgrid" style="margin-top:8px"><div class="field"><label for="admEmail">ایمیل</label><input id="admEmail" type="email" dir="ltr" autocomplete="username"></div>
      <div class="field"><label for="admPass">رمز</label><input id="admPass" type="password" dir="ltr" autocomplete="current-password"></div></div>
      <div class="row" style="margin-top:8px"><button class="btn" id="admLogin" type="button">ورود مدیر</button><span class="small" id="admMsg"></span></div>`;
    box.querySelector("#admLogin").onclick = async () => {
      const msg = box.querySelector("#admMsg");
      msg.textContent = "در حال ورود…";
      const { error } = await sb.auth.signInWithPassword({ email: box.querySelector("#admEmail").value.trim(), password: box.querySelector("#admPass").value });
      if (error) { msg.textContent = "ورود ناموفق: ایمیل یا رمز اشتباه است."; return; }
      await refreshAdmin();
      if (!admin) { await sb.auth.signOut().catch(() => {}); msg.textContent = "این حساب مدیر سایت نیست."; return; }
      renderAdmin(); markButton();
    };
  }
  function markButton() {
    const b = document.getElementById("apiKeyBtn");
    if (b) b.textContent = admin ? "کلید سایت ✓" : ls.get(KEY_SLOT) ? "کلید API ✓" : "کلید API";
  }
  document.addEventListener("DOMContentLoaded", () => {
    const box = document.querySelector(".projbox");
    if (!box) return;
    const b = document.createElement("button");
    b.className = "btn"; b.id = "apiKeyBtn"; b.type = "button";
    b.onclick = openKeyPanel;
    box.insertBefore(b, box.querySelector(".savestate"));
    markButton();
    loadConfig();
    refreshAdmin().then(markButton);
  });

  const caps = { db, user, downloads, sample };
  window.claude = { use: async (name) => caps[name] ?? null };
})();
