/**
 * Axis AI Receptionist — Embeddable Chat Widget
 * Usage: set window.AxisConfig then load this script.
 */
(function () {
  const cfg = window.AxisConfig || {};
  const webhookUrl = cfg.webhookUrl || "";
  const bizName = cfg.businessName || "our business";
  const color = cfg.primaryColor || "#b8965a";
  const sessionKey = "axis_session_id";

  function getSession() {
    let id = localStorage.getItem(sessionKey);
    if (!id) { id = "sess_" + Math.random().toString(36).slice(2, 12); localStorage.setItem(sessionKey, id); }
    return id;
  }

  // Inject styles
  const style = document.createElement("style");
  style.textContent = `
    #axis-bubble{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.3);z-index:99999;font-size:26px;transition:transform .2s}
    #axis-bubble:hover{transform:scale(1.1)}
    #axis-panel{position:fixed;bottom:96px;right:24px;width:340px;max-height:500px;background:#0d1e35;border:1px solid rgba(184,150,90,.2);border-radius:16px;display:none;flex-direction:column;z-index:99999;box-shadow:0 8px 40px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #axis-panel.open{display:flex}
    #axis-header{padding:16px;background:${color};border-radius:16px 16px 0 0;color:#0d1e35;font-weight:700;font-size:15px}
    #axis-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:260px;max-height:340px}
    .axis-msg{max-width:82%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;word-wrap:break-word}
    .axis-msg.bot{background:#132b4a;color:#e2e8f0;align-self:flex-start;border-bottom-left-radius:4px}
    .axis-msg.user{background:${color};color:#0d1e35;align-self:flex-end;border-bottom-right-radius:4px}
    #axis-input-row{display:flex;border-top:1px solid rgba(184,150,90,.15);padding:10px}
    #axis-input{flex:1;border:none;background:#132b4a;color:#e2e8f0;padding:10px 12px;border-radius:8px;font-size:13px;outline:none}
    #axis-input::placeholder{color:#64748b}
    #axis-send{border:none;background:${color};color:#0d1e35;padding:10px 16px;border-radius:8px;margin-left:8px;cursor:pointer;font-weight:700;font-size:13px}
    #axis-send:hover{opacity:.85}
    .axis-spinner{align-self:flex-start;display:flex;gap:4px;padding:10px 14px}
    .axis-spinner span{width:6px;height:6px;border-radius:50%;background:#64748b;animation:axisBounce .6s infinite alternate}
    .axis-spinner span:nth-child(2){animation-delay:.2s}
    .axis-spinner span:nth-child(3){animation-delay:.4s}
    @keyframes axisBounce{to{opacity:.3;transform:translateY(-4px)}}
  `;
  document.head.appendChild(style);

  // Bubble
  const bubble = document.createElement("div");
  bubble.id = "axis-bubble";
  bubble.innerHTML = "💬";
  document.body.appendChild(bubble);

  // Panel
  const panel = document.createElement("div");
  panel.id = "axis-panel";
  panel.innerHTML = `
    <div id="axis-header">Axis — ${escapeHtml(bizName)}</div>
    <div id="axis-messages"></div>
    <div id="axis-input-row">
      <input id="axis-input" placeholder="Type a message..." autocomplete="off">
      <button id="axis-send">Send</button>
    </div>`;
  document.body.appendChild(panel);

  const msgs = panel.querySelector("#axis-messages");
  const input = panel.querySelector("#axis-input");
  const sendBtn = panel.querySelector("#axis-send");

  // Welcome
  addMsg("bot", "Hi! I'm Axis, the AI receptionist for " + escapeHtml(bizName) + ". How can I help you today?");

  // Toggle
  bubble.addEventListener("click", function () { panel.classList.toggle("open"); if (panel.classList.contains("open")) input.focus(); });

  // Send
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg("user", text);

    // Spinner
    const spinner = document.createElement("div");
    spinner.className = "axis-spinner";
    spinner.innerHTML = "<span></span><span></span><span></span>";
    msgs.appendChild(spinner);
    msgs.scrollTop = msgs.scrollHeight;

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: getSession(), customer_name: "Guest" })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        spinner.remove();
        addMsg("bot", data.reply || data.message || data.response || "Thanks! I'll get back to you shortly.");
      })
      .catch(function () {
        spinner.remove();
        addMsg("bot", "Sorry, I'm having trouble connecting. Please try again in a moment.");
      });
  }

  function addMsg(role, text) {
    const div = document.createElement("div");
    div.className = "axis-msg " + role;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function escapeHtml(s) {
    var d = document.createElement("div"); d.textContent = s; return d.innerHTML;
  }
})();
