function securityPage() {
  var s = cfg.security || {};
  return Promise.resolve(
    '<div class="panel"><h2>Google & Security</h2>' +
    '<div class="notice">' +
    "Only the owner email can access the admin panel. Google ID token is verified server-side by the Worker." +
    "</div>" +

    '<div class="notice" style="border-color:#d4af37;background:#2a2318;margin-top:12px">' +
    "<b>⚠️ First-time Setup:</b> If you can't login yet, use the Bootstrap button below to save the Google Client ID first. After saving, refresh and click Sign in." +
    "</div>" +

    '<div class="field"><label>Authorized Admin Email</label>' +
    '<input id="sec_email" value="' + esc(s.admin_email || C.ADMIN_EMAIL || "") + '"></div>' +

    '<div class="field"><label>Google Web Client ID</label>' +
    '<input id="sec_client" placeholder="1234567890-xxxx.apps.googleusercontent.com" value="' +
    esc(s.google_client_id || localStorage.getItem("aroma_google_client_id") || "") + '"></div>' +

    '<div class="row" style="margin-top:16px;gap:10px">' +
    '<button class="btn" onclick="window.adminBootstrapGoogle()" style="flex:1">🔧 Bootstrap (Login not required)</button>' +
    '<button class="btn gold" onclick="window.adminSaveSecurity()" style="flex:1">💾 Save Settings</button>' +
    "</div>" +

    '<p class="small muted" style="margin-top:12px">' +
    "Get Client ID from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs" +
    "</p>" +
    "</div>"
  );
}

window.adminBootstrapGoogle = function () {
  var client = $("#sec_client").value.trim();
  var email = $("#sec_email").value.trim();

  if (!client || client.length < 20) {
    alert("Please enter a valid Google Client ID");
    return;
  }
  if (!email) {
    alert("Please enter the owner email");
    return;
  }

  toast("Saving bootstrap settings...");

  fetch(API + "/api/admin/bootstrap-google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      google_client_id: client,
      admin_email: email
    })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.error) {
        alert("Bootstrap failed: " + d.error);
        return;
      }
      localStorage.setItem("aroma_google_client_id", client);
      toast("✅ Bootstrap successful! Refreshing...");
      setTimeout(function () { location.reload(); }, 1500);
    })
    .catch(function (e) {
      alert("Bootstrap error: " + e.message);
    });
};
