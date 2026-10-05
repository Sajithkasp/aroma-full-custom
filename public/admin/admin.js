(function () {
  "use strict";

  var C = window.AROMA_CONFIG || {};
  var API = (C.API_BASE || "").replace(/\/$/, "");
  var $ = function (s) { return document.querySelector(s); };

  var me = null;
  var view = "dashboard";
  var cfg = {};
  var schema = {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      if (c === "&") return "&amp;";
      if (c === "<") return "&lt;";
      if (c === ">") return "&gt;";
      if (c === '"') return "&quot;";
      return "&#39;";
    });
  }

  function toast(msg) {
    var el = $("#adminToast");
    if (el) el.remove();
    el = document.createElement("div");
    el.id = "adminToast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (opts.headers) {
      for (var k in opts.headers) headers[k] = opts.headers[k];
    }
    var config = {
      credentials: "include",
      method: opts.method || "GET",
      headers: headers
    };
    if (opts.body) config.body = opts.body;
    return fetch(API + path, config).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || "Request failed");
        return d;
      });
    });
  }

  var resources = {
    products: "Products",
    categories: "Categories",
    product_types: "Product Types",
    product_variants: "Variants",
    product_images: "Product Images",
    orders: "Orders",
    order_items: "Order Items",
    customers: "Customers",
    reviews: "Reviews",
    coupons: "Coupons",
    delivery_settings: "Delivery",
    payment_methods: "Payments",
    pages: "Pages",
    page_sections: "Page Sections",
    navigation_menus: "Nav Menus",
    navigation_items: "Nav Items",
    media_library: "Media",
    seo_settings: "SEO",
    social_links: "Social",
    hero_sections: "Hero Sections",
    popups: "Popups",
    bot_settings: "Bot Settings",
    bot_knowledge: "Bot Knowledge",
    custom_buttons: "Custom Buttons",
    custom_sections: "Custom Sections",
    custom_fields: "Custom Fields",
    api_integrations: "API Keys",
    forms: "Forms",
    form_submissions: "Form Submissions",
    newsletter_subscribers: "Newsletter",
    blog_posts: "Blog Posts",
    blog_categories: "Blog Categories",
    testimonials: "Testimonials",
    faqs: "FAQs",
    team_members: "Team Members",
    gallery_albums: "Gallery Albums",
    gallery_images: "Gallery Images",
    sliders: "Sliders",
    slider_slides: "Slider Slides",
    services: "Services",
    pricing_plans: "Pricing",
    shipping_zones: "Shipping",
    tax_settings: "Tax",
    currencies: "Currencies",
    languages: "Languages",
    email_templates: "Email Templates",
    sms_templates: "SMS Templates",
    notification_settings: "Notifications",
    webhooks: "Webhooks",
    feature_flags: "Feature Flags",
    activity_feed: "Activity",
    error_logs: "Errors",
    cms_audit: "Audit Logs",
    user_roles: "User Roles",
    admin_users: "Admin Users"
  };

  var labels = {
    id: "ID",
    name: "Name",
    slug: "Slug",
    title: "Title",
    description: "Description",
    price: "Price",
    stock: "Stock",
    image_url: "Image URL",
    is_active: "Active",
    featured: "Featured",
    email: "Email",
    phone: "Phone",
    customer_name: "Customer",
    customer_email: "Email",
    total: "Total",
    order_status: "Status",
    payment_status: "Payment Status",
    rating: "Rating",
    is_approved: "Approved",
    url: "URL",
    alt_text: "Alt Text",
    content: "Content",
    status: "Status",
    sort_order: "Sort Order",
    question: "Question",
    answer: "Answer",
    code: "Code",
    body: "Body",
    subject: "Subject",
    label: "Label",
    provider: "Provider",
    api_key: "API Key",
    endpoint_url: "Endpoint",
    placement: "Placement",
    created_at: "Created",
    updated_at: "Updated"
  };

  function login() {
    var clientId = (localStorage.getItem("aroma_google_client_id") || cfg.google_client_id || C.GOOGLE_CLIENT_ID || "").trim();
    if (!clientId) {
      renderSetup();
      return;
    }
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      renderSetup();
      return;
    }
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: function (response) {
          api("/api/admin/auth/google", {
            method: "POST",
            body: JSON.stringify({ credential: response.credential })
          }).then(function (data) {
            me = data;
            localStorage.setItem("aroma_google_client_id", clientId);
            boot();
          }).catch(function (e) {
            alert("Access denied: " + e.message);
          });
        }
      });
      window.google.accounts.id.prompt();
    } catch (e) {
      renderSetup();
    }
  }

  function renderSetup() {
    var el = $("#admin");
    if (!el) return;
    var existingClientId = localStorage.getItem("aroma_google_client_id") || C.GOOGLE_CLIENT_ID || "";
    el.innerHTML =
      '<div class="login"><div class="loginbox">' +
      "<h1>AROMA LAB CMS</h1>" +
      '<p class="subtitle">SETUP GOOGLE AUTHENTICATION</p>' +
      '<div class="notice">' +
      "<b>First-time setup:</b> Paste your Google OAuth 2.0 Web Client ID below, then sign in with the owner Google account." +
      "</div>" +
      '<div class="field">' +
      "<label>Google Web Client ID</label>" +
      '<input id="boot_client" placeholder="1234567890-xxxx.apps.googleusercontent.com" value="' + esc(existingClientId) + '">' +
      "</div>" +
      '<div class="field">' +
      "<label>Owner Email</label>" +
      '<input id="boot_email" value="' + esc(C.ADMIN_EMAIL || "sajith.kasp@gmail.com") + '">' +
      "</div>" +
      '<button type="button" class="btn gold" id="adminSetupBtn">Save and Continue with Google</button>' +
      "</div></div>";

    var setupBtn = $("#adminSetupBtn");
    if (setupBtn) {
      setupBtn.onclick = function () {
        var client = $("#boot_client").value.trim();
        var email = $("#boot_email").value.trim();
        if (!client || !email) {
          alert("Both Client ID and owner email are required");
          return;
        }
        if (client.length < 20) {
          alert("Invalid Client ID");
          return;
        }
        localStorage.setItem("aroma_google_client_id", client);
        localStorage.setItem("aroma_admin_email", email);
        api("/api/admin/bootstrap-google", {
          method: "POST",
          body: JSON.stringify({ google_client_id: client, admin_email: email })
        }).then(function () {
          toast("Saved! Loading Google login...");
          setTimeout(boot, 300);
        }).catch(function (e) {
          alert(e.message);
        });
      };
    }
  }

  function shell() {
    var navItems = [
      { group: "MAIN", items: [
        ["dashboard", "Dashboard"],
        ["products", "Products"],
        ["categories", "Categories"],
        ["orders", "Orders"],
        ["customers", "Customers"],
        ["reviews", "Reviews"],
        ["coupons", "Coupons"]
      ]},
      { group: "CONTENT", items: [
        ["pages", "Pages"],
        ["blog_posts", "Blog Posts"],
        ["blog_categories", "Blog Categories"],
        ["faqs", "FAQs"],
        ["testimonials", "Testimonials"],
        ["team_members", "Team Members"],
        ["gallery_albums", "Gallery"],
        ["sliders", "Sliders"]
      ]},
      { group: "SITE", items: [
        ["site", "Site and Brand"],
        ["theme", "Theme and Colors"],
        ["header", "Header and Nav"],
        ["hero", "Hero Section"],
        ["lifestyle", "Lifestyle"],
        ["footer", "Footer and Legal"],
        ["seo", "SEO"],
        ["social", "Social Links"],
        ["delivery", "Delivery"],
        ["payments", "Payments"]
      ]},
      { group: "FEATURES", items: [
        ["features", "Features Toggle"],
        ["ask_aroma", "Ask Aroma"],
        ["popup", "Popup"],
        ["content", "Page Content"],
        ["custom_buttons", "Custom Buttons"],
        ["custom_sections", "Custom Sections"],
        ["forms", "Forms"],
        ["newsletter_subscribers", "Newsletter"]
      ]},
      { group: "SYSTEM", items: [
        ["media", "Media Library"],
        ["security", "Security"],
        ["activity_feed", "Activity Feed"],
        ["error_logs", "Error Logs"],
        ["cms_audit", "Audit Logs"],
        ["advanced", "All Tables"],
        ["logout", "Logout"]
      ]}
    ];

    var navHtml = "";
    for (var g = 0; g < navItems.length; g++) {
      var group = navItems[g];
      navHtml += '<div class="nav-group">' + group.group + "</div>";
      for (var i = 0; i < group.items.length; i++) {
        var item = group.items[i];
        var active = view === item[0] ? " active" : "";
        navHtml += '<button type="button" class="navbtn' + active + '" data-view="' + item[0] + '">' + item[1] + "</button>";
      }
    }

    var title = view;
    for (var g2 = 0; g2 < navItems.length; g2++) {
      for (var i2 = 0; i2 < navItems[g2].items.length; i2++) {
        if (navItems[g2].items[i2][0] === view) {
          title = navItems[g2].items[i2][1];
        }
      }
    }

    return '<div class="wrap">' +
      '<aside class="side">' +
      '<div class="logo"><b>AROMA LAB</b></div>' +
      navHtml +
      "</aside>" +
      '<main class="main">' +
      '<div class="top">' +
      '<div><div class="breadcrumb">CMS / ' + esc(view) + "</div>" +
      "<h1>" + esc(title) + "</h1></div>" +
      '<div class="muted small">' + esc(me ? me.email : "") + "</div>" +
      "</div>" +
      '<div id="content"></div>' +
      "</main></div>";
  }

  function bindNav() {
    var btns = document.querySelectorAll("[data-view]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function () {
        var v = this.getAttribute("data-view");
        adminView(v);
      };
    }
  }

  function dashboard() {
    return api("/api/admin/dashboard").then(function (d) {
      var stats = [
        ["Products", d.products],
        ["Orders", d.orders],
        ["Customers", d.customers],
        ["Reviews", d.reviews],
        ["Pages", d.pages],
        ["Blog Posts", d.blog_posts],
        ["Media", d.media],
        ["Forms", d.forms],
        ["Newsletter", d.newsletter],
        ["FAQs", d.faqs]
      ];
      var statsHtml = stats.map(function (s) {
        return '<div class="stat"><span>' + s[0] + "</span><b>" + (s[1] || 0) + "</b></div>";
      }).join("");

      return '<div class="gridstats">' + statsHtml + "</div>" +
        '<div class="panel"><h2>Welcome to AROMA LAB CMS</h2>' +
        '<p class="muted">Fully customizable control panel.</p>' +
        '<div class="notice" style="margin-top:16px">' +
        "<b>Quick start:</b> Site and Brand - Theme - Products - Hero - SEO." +
        "</div></div>";
    });
  }

  var setDefs = {
    site: [
      ["site_name", "Site Name", "text"],
      ["tagline", "Tagline", "text"],
      ["descriptor", "Descriptor", "text"],
      ["logo_url", "Logo", "image"],
      ["favicon_url", "Favicon", "image"],
      ["phone", "Phone", "text"],
      ["whatsapp", "WhatsApp", "text"],
      ["email", "Email", "email"],
      ["address", "Address", "text"],
      ["daraz_url", "Daraz URL", "url"],
      ["currency", "Currency", "text"]
    ],
    theme: [
      ["bg", "Background", "color"],
      ["surface", "Surface", "color"],
      ["surface2", "Surface 2", "color"],
      ["gold", "Gold", "color"],
      ["gold2", "Gold Highlight", "color"],
      ["olive", "Olive", "color"],
      ["text", "Text", "color"],
      ["muted", "Muted Text", "color"],
      ["radius", "Card Radius (px)", "number"],
      ["container_max", "Container Max Width", "number"],
      ["product_gap", "Product Gap (px)", "number"],
      ["desktop_columns", "Desktop Columns", "number"],
      ["mobile_columns", "Mobile Columns", "number"],
      ["product_image_ratio", "Image Ratio", "text"],
      ["hero_height", "Hero Height (px)", "number"],
      ["logo_width", "Logo Width (px)", "number"],
      ["header_height", "Header Height (px)", "number"],
      ["section_padding", "Section Padding (px)", "number"],
      ["card_padding", "Card Padding (px)", "number"],
      ["button_radius", "Button Radius (px)", "number"],
      ["body_font", "Body Font", "text"],
      ["heading_font", "Heading Font", "text"],
      ["pattern", "Gold Pattern", "checkbox"]
    ],
    header: [
      ["announcement", "Announcement", "text"],
      ["show_announcement", "Show Announcement", "checkbox"],
      ["show_login", "Show Login Button", "checkbox"],
      ["show_cart", "Show Cart Button", "checkbox"]
    ],
    hero: [
      ["enabled", "Enabled", "checkbox"],
      ["image_url", "Hero Image", "image"],
      ["title", "Title (HTML allowed)", "textarea"],
      ["subtitle", "Subtitle", "textarea"],
      ["button_text", "Button Text", "text"],
      ["button_url", "Button URL", "text"],
      ["height", "Height (px)", "number"],
      ["overlay", "Overlay (0-1)", "number"],
      ["position", "Image Position", "text"]
    ],
    lifestyle: [
      ["enabled", "Enabled", "checkbox"],
      ["image1", "Image 1", "image"],
      ["image2", "Image 2", "image"],
      ["title", "Title", "text"],
      ["text", "Text", "textarea"],
      ["button_text", "Button Text", "text"],
      ["button_url", "Button URL", "text"],
      ["show_second", "Show Second Section", "checkbox"]
    ],
    footer: [
      ["tagline", "Footer Tagline", "text"],
      ["copyright", "Copyright", "text"]
    ],
    seo: [
      ["site_title", "Site Title", "text"],
      ["meta_description", "Meta Description", "textarea"],
      ["canonical_url", "Canonical URL", "url"],
      ["og_image", "OG Image", "image"]
    ],
    delivery: [
      ["enabled", "Enabled", "checkbox"],
      ["fee", "Delivery Fee", "number"],
      ["free_above", "Free Delivery Above", "number"],
      ["note", "Delivery Note", "textarea"],
      ["districts", "Districts", "text"]
    ],
    ask_aroma: [
      ["enabled", "Enabled", "checkbox"],
      ["title", "Title", "text"],
      ["welcome", "Welcome Message", "textarea"],
      ["knowledge", "Knowledge Base", "textarea"]
    ],
    popup: [
      ["enabled", "Enabled", "checkbox"],
      ["title", "Title", "text"],
      ["text", "Text", "textarea"],
      ["button_text", "Button Text", "text"],
      ["button_url", "Button URL", "text"]
    ],
    legal: [
      ["privacy", "Privacy Policy", "textarea"],
      ["terms", "Terms and Conditions", "textarea"],
      ["returns", "Returns and Refunds", "textarea"]
    ],
    features: [
      ["google_login", "Google Login", "checkbox"],
      ["reviews", "Reviews", "checkbox"],
      ["ask_aroma", "Ask Aroma", "checkbox"],
      ["daraz", "Daraz", "checkbox"],
      ["maintenance", "Maintenance Mode", "checkbox"],
      ["blog", "Blog", "checkbox"],
      ["newsletter", "Newsletter", "checkbox"],
      ["wishlist", "Wishlist", "checkbox"],
      ["faq", "FAQs", "checkbox"],
      ["team", "Team Members", "checkbox"],
      ["gallery", "Gallery", "checkbox"],
      ["testimonials", "Testimonials", "checkbox"],
      ["forms", "Forms", "checkbox"],
      ["webhooks", "Webhooks", "checkbox"],
      ["api_integrations", "API Integrations", "checkbox"],
      ["custom_buttons", "Custom Buttons", "checkbox"],
      ["custom_sections", "Custom Sections", "checkbox"],
      ["sliders", "Sliders", "checkbox"],
      ["invoices", "Invoices", "checkbox"],
      ["returns", "Returns", "checkbox"],
      ["refunds", "Refunds", "checkbox"]
    ],
    content: [
      ["about_title", "About Title", "text"],
      ["about_body", "About Content", "textarea"],
      ["contact_title", "Contact Title", "text"],
      ["contact_body", "Contact Content", "textarea"],
      ["privacy_title", "Privacy Title", "text"],
      ["privacy_body", "Privacy Content", "textarea"],
      ["terms_title", "Terms Title", "text"],
      ["terms_body", "Terms Content", "textarea"],
      ["returns_title", "Returns Title", "text"],
      ["returns_body", "Returns Content", "textarea"]
    ]
  };

  function inputField(def, val) {
    var k = def[0];
    var l = def[1];
    var t = def[2];

    if (t === "checkbox") {
      return '<label class="check"><input id="s_' + k + '" type="checkbox" ' + (val ? "checked" : "") + "> " + esc(l) + "</label>";
    }
    if (t === "image") {
      return '<div class="field">' +
        "<label>" + esc(l) + "</label>" +
        '<div class="row">' +
        '<input id="s_' + k + '" type="text" value="' + esc(val) + '" style="flex:1">' +
        '<button type="button" class="btn" data-pick="s_' + k + '">Choose</button>' +
        "</div>" +
        (val ? '<img src="' + esc(val) + '" class="img-preview" onerror="this.style.display=\'none\'">' : "") +
        "</div>";
    }
    if (t === "textarea") {
      return '<div class="field"><label>' + esc(l) + "</label>" +
        '<textarea id="s_' + k + '">' + esc(val) + "</textarea></div>";
    }
    return '<div class="field"><label>' + esc(l) + "</label>" +
      '<input id="s_' + k + '" type="' + t + '" value="' + esc(val) + '"></div>';
  }

  function settingsPage(key) {
    var defs = setDefs[key];
    if (!defs) return Promise.resolve('<div class="panel">Unknown section</div>');
    var obj = cfg[key] || {};

    var fieldsHtml = defs.map(function (d) {
      return inputField(d, obj[d[0]]);
    }).join("");

    var html = '<div class="panel"><h2>' + esc(key) + "</h2>" +
      '<div class="sectiongrid">' + fieldsHtml + "</div>" +
      '<div class="sticky-save">' +
      '<button type="button" class="btn gold" data-save="' + key + '">Save</button>' +
      "</div></div>";

    return Promise.resolve(html);
  }

  function bindSettingsPage(key) {
    var saveBtn = document.querySelector('[data-save="' + key + '"]');
    if (saveBtn) {
      saveBtn.onclick = function () {
        var defs = setDefs[key];
        var obj = {};
        for (var k in cfg[key]) obj[k] = cfg[key][k];
        for (var i = 0; i < defs.length; i++) {
          var d = defs[i];
          var el = $("#s_" + d[0]);
          if (!el) continue;
          if (d[2] === "checkbox") obj[d[0]] = el.checked;
          else if (d[2] === "number") obj[d[0]] = Number(el.value || 0);
          else obj[d[0]] = el.value;
        }
        var payload = {};
        payload[key] = obj;
        api("/api/admin/settings", {
          method: "POST",
          body: JSON.stringify(payload)
        }).then(function () {
          cfg[key] = obj;
          toast("Saved successfully");
        }).catch(function (e) {
          alert("Save error: " + e.message);
        });
      };
    }

    var pickBtns = document.querySelectorAll("[data-pick]");
    for (var j = 0; j < pickBtns.length; j++) {
      pickBtns[j].onclick = function () {
        var targetId = this.getAttribute("data-pick");
        window.adminPickImage(targetId);
      };
    }
  }

  function securityPage() {
    var s = cfg.security || {};
    return Promise.resolve(
      '<div class="panel"><h2>Google and Security</h2>' +
      '<div class="notice">Only the owner email can access the admin panel.</div>' +
      '<div class="field"><label>Authorized Admin Email</label>' +
      '<input id="sec_email" value="' + esc(s.admin_email || C.ADMIN_EMAIL || "") + '"></div>' +
      '<div class="field"><label>Google Web Client ID</label>' +
      '<input id="sec_client" value="' + esc(s.google_client_id || localStorage.getItem("aroma_google_client_id") || C.GOOGLE_CLIENT_ID || "") + '"></div>' +
      '<div class="sticky-save">' +
      '<button type="button" class="btn gold" id="saveSecurityBtn">Save Security Settings</button>' +
      "</div></div>"
    );
  }

  function bindSecurity() {
    var btn = $("#saveSecurityBtn");
    if (btn) {
      btn.onclick = function () {
        var sec = {};
        for (var k in (cfg.security || {})) sec[k] = cfg.security[k];
        sec.admin_email = $("#sec_email").value.trim();
        sec.google_client_id = $("#sec_client").value.trim();
        sec.bootstrap_ready = true;

        var payload = {
          security: sec,
          google_client_id: sec.google_client_id,
          admin_email: sec.admin_email
        };
        api("/api/admin/settings", {
          method: "POST",
          body: JSON.stringify(payload)
        }).then(function () {
          localStorage.setItem("aroma_google_client_id", sec.google_client_id);
          cfg.security = sec;
          toast("Security settings saved");
        }).catch(function (e) {
          alert(e.message);
        });
      };
    }
  }

  function resourcePage(r) {
    if (!schema[r]) {
      return api("/api/admin/table/columns", {
        method: "POST",
        body: JSON.stringify({ resource: r })
      }).then(function (d) {
        schema[r] = d.items || [];
        return renderResource(r);
      });
    }
    return renderResource(r);
  }

  function renderResource(r) {
    return api("/api/admin/" + r).then(function (d) {
      var items = d.items || [];
      var cols = schema[r].filter(function (c) {
        return c.name !== "id";
      }).slice(0, 6);

      var headHtml = cols.map(function (c) {
        return "<th>" + esc(labels[c.name] || c.name) + "</th>";
      }).join("");

      var bodyHtml = items.length
        ? items.map(function (x) {
          var rowCells = cols.map(function (c) {
            var val = x[c.name];
            if (val === null || val === undefined) return "<td>-</td>";
            var str = String(val).slice(0, 50);
            return "<td>" + esc(str) + "</td>";
          }).join("");

          return "<tr>" + rowCells +
            '<td class="actions">' +
            '<button type="button" class="btn small" data-edit="' + r + '" data-id="' + x.id + '">Edit</button>' +
            '<button type="button" class="btn small danger" data-del="' + r + '" data-id="' + x.id + '">Del</button>' +
            "</td></tr>";
        }).join("")
        : '<tr><td colspan="' + (cols.length + 1) + '" style="text-align:center;padding:30px" class="muted">No records yet.</td></tr>';

      return '<div class="panel">' +
        '<div class="toolbar">' +
        '<div class="muted">' + items.length + " records</div>" +
        '<button type="button" class="btn gold" data-add-new="' + r + '">Add New</button>' +
        "</div>" +
        '<div class="tablewrap"><table class="table">' +
        "<thead><tr>" + headHtml + "<th>Actions</th></tr></thead>" +
        "<tbody>" + bodyHtml + "</tbody>" +
        "</table></div></div>";
    });
  }

  function bindResourcePage(r) {
    var editBtns = document.querySelectorAll('[data-edit="' + r + '"]');
    for (var i = 0; i < editBtns.length; i++) {
      editBtns[i].onclick = function () {
        var id = this.getAttribute("data-id");
        adminEdit(r, id);
      };
    }
    var delBtns = document.querySelectorAll('[data-del="' + r + '"]');
    for (var j = 0; j < delBtns.length; j++) {
      delBtns[j].onclick = function () {
        var id = this.getAttribute("data-id");
        if (confirm("Delete this record?")) {
          api("/api/admin/" + r + "/" + id, { method: "DELETE" })
            .then(function () {
              toast("Deleted");
              adminView(view);
            })
            .catch(function (e) { alert(e.message); });
        }
      };
    }
    var addBtn = document.querySelector('[data-add-new="' + r + '"]');
    if (addBtn) {
      addBtn.onclick = function () {
        adminEdit(r, null);
      };
    }
  }

  function fieldFor(c, v) {
    var n = c.name;
    var t = "text";
    if (/(description|content|address|notes|comment|body|answer|question|message|text)/i.test(n)) t = "textarea";
    else if (/(is_|enabled|active|featured|approved|published|visible|verified)/i.test(n)) t = "checkbox";
    else if (/(price|cost|stock|fee|rating|quantity|total|order|sort|display|width|height|size|count|limit)/i.test(n)) t = "number";
    else if (/(image|logo|favicon|photo|avatar|icon|url|link|cover)/i.test(n)) t = "image";

    var lbl = labels[n] || n;

    if (t === "checkbox") {
      return '<label class="check"><input id="f_' + n + '" type="checkbox" ' + (v ? "checked" : "") + "> " + esc(lbl) + "</label>";
    }
    if (t === "image") {
      return '<div class="field"><label>' + esc(lbl) + "</label>" +
        '<div class="row">' +
        '<input id="f_' + n + '" type="text" value="' + esc(v == null ? "" : v) + '" style="flex:1">' +
        '<button type="button" class="btn" data-pick="f_' + n + '">Pick</button>' +
        "</div>" +
        (v ? '<img src="' + esc(v) + '" class="img-preview" onerror="this.style.display=\'none\'">' : "") +
        "</div>";
    }
    if (t === "textarea") {
      return '<div class="field"><label>' + esc(lbl) + "</label>" +
        '<textarea id="f_' + n + '">' + esc(v == null ? "" : v) + "</textarea></div>";
    }
    return '<div class="field"><label>' + esc(lbl) + "</label>" +
      '<input id="f_' + n + '" type="' + t + '" value="' + esc(v == null ? "" : v) + '"></div>';
  }

  function adminEdit(r, id) {
    if (!schema[r]) {
      api("/api/admin/table/columns", {
        method: "POST",
        body: JSON.stringify({ resource: r })
      }).then(function (d) {
        schema[r] = d.items || [];
        adminEdit(r, id);
      });
      return;
    }

    var cols = schema[r].filter(function (c) {
      return c.name !== "id" && c.name !== "created_at" && c.name !== "updated_at";
    });

    var fieldsHtml = cols.map(function (c) {
      return fieldFor(c, null);
    }).join("");

    var html = '<div class="panel">' +
      '<div class="row" style="margin-bottom:14px">' +
      '<button type="button" class="btn" data-back="1">Back</button>' +
      "</div>" +
      "<h2>Add New " + esc(resources[r] || r) + "</h2>" +
      '<div class="sectiongrid">' + fieldsHtml + "</div>" +
      '<div class="sticky-save">' +
      '<button type="button" class="btn gold" id="saveRecordBtn">Save Record</button>' +
      "</div></div>";

    $("#content").innerHTML = html;

    document.querySelector("[data-back]").onclick = function () {
      adminView(view);
    };

    var pickBtns = document.querySelectorAll("[data-pick]");
    for (var i = 0; i < pickBtns.length; i++) {
      pickBtns[i].onclick = function () {
        var targetId = this.getAttribute("data-pick");
        window.adminPickImage(targetId);
      };
    }

    $("#saveRecordBtn").onclick = function () {
      var b = {};
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var el = $("#f_" + c.name);
        if (!el) continue;
        if (el.type === "checkbox") b[c.name] = el.checked ? 1 : 0;
        else if (el.type === "number") b[c.name] = el.value === "" ? null : Number(el.value);
        else b[c.name] = el.value;
      }
      api("/api/admin/" + r, {
        method: "POST",
        body: JSON.stringify(b)
      }).then(function () {
        toast("Saved successfully");
        adminView(view);
      }).catch(function (e) {
        alert("Save error: " + e.message);
      });
    };
  }

  function mediaPage() {
    return api("/api/admin/media_library").then(function (d) {
      var items = d.items || [];
      var gridHtml = items.length
        ? items.map(function (m) {
          return '<div class="media-item">' +
            '<img src="/api/media/' + m.id + '/thumb" onerror="this.src=\'/api/media/' + m.id + '\'" loading="lazy">' +
            '<div class="info">' + esc(m.filename) + "</div>" +
            '<button type="button" class="del" data-del-media="' + m.id + '">&times;</button>' +
            "</div>";
        }).join("")
        : '<div class="muted" style="padding:20px;text-align:center">No media yet.</div>';

      return '<div class="panel">' +
        '<div class="toolbar">' +
        "<h2>Media Library</h2>" +
        '<button type="button" class="btn gold" id="uploadMediaBtn">Upload Image</button>' +
        "</div>" +
        '<input type="file" id="adminMediaUpload" accept="image/*" multiple style="display:none">' +
        '<div class="dropzone" id="mediaDropzone">Click here to upload images (auto-resized)</div>' +
        '<div class="media-grid">' + gridHtml + "</div>" +
        "</div>";
    });
  }

  function bindMediaPage() {
    var uploadBtn = $("#uploadMediaBtn");
    var uploadInput = $("#adminMediaUpload");
    var dropzone = $("#mediaDropzone");

    if (uploadBtn && uploadInput) {
      uploadBtn.onclick = function () { uploadInput.click(); };
    }
    if (dropzone && uploadInput) {
      dropzone.onclick = function () { uploadInput.click(); };
    }
    if (uploadInput) {
      uploadInput.onchange = function (event) {
        var files = event.target.files;
        if (!files || !files.length) return;
        var uploads = [];
        for (var i = 0; i < files.length; i++) {
          uploads.push(uploadOne(files[i]));
        }
        Promise.all(uploads).then(function () {
          toast(files.length + " image(s) uploaded");
          adminView("media");
        }).catch(function (e) {
          alert("Upload error: " + e.message);
        });
      };
    }

    var delBtns = document.querySelectorAll("[data-del-media]");
    for (var j = 0; j < delBtns.length; j++) {
      delBtns[j].onclick = function () {
        var id = this.getAttribute("data-del-media");
        if (confirm("Delete this image?")) {
          api("/api/admin/media_library/" + id, { method: "DELETE" })
            .then(function () {
              toast("Deleted");
              adminView("media");
            })
            .catch(function (e) { alert(e.message); });
        }
      };
    }
  }

  function uploadOne(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        var img = new Image();
        img.onload = function () {
          try {
            var maxW = 1600;
            var maxH = 1600;
            var w = img.width;
            var h = img.height;
            if (w > maxW) { h = h * (maxW / w); w = maxW; }
            if (h > maxH) { w = w * (maxH / h); h = maxH; }

            var canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            var data = canvas.toDataURL("image/jpeg", 0.85);

            var tc = document.createElement("canvas");
            var ts = 200;
            tc.width = ts;
            tc.height = ts * (h / w);
            var tctx = tc.getContext("2d");
            tctx.drawImage(img, 0, 0, tc.width, tc.height);
            var thumb = tc.toDataURL("image/jpeg", 0.7);

            api("/api/admin/media/upload", {
              method: "POST",
              body: JSON.stringify({
                filename: file.name,
                mime_type: "image/jpeg",
                size: Math.round(data.length * 0.75),
                width: Math.round(w),
                height: Math.round(h),
                data: data,
                thumb_data: thumb,
                folder: "general"
              })
            }).then(resolve).catch(reject);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.adminPickImage = function (targetId) {
    api("/api/admin/media_library").then(function (d) {
      var items = d.items || [];
      var modalId = "adminMediaPicker";
      var existing = document.getElementById(modalId);
      if (existing) existing.remove();

      var gridHtml = items.length
        ? items.map(function (m) {
          return '<div class="media-item" data-pick-url="/api/media/' + m.id + '" data-target="' + targetId + '">' +
            '<img src="/api/media/' + m.id + '/thumb" loading="lazy">' +
            '<div class="info">' + esc(m.filename) + "</div>" +
            "</div>";
        }).join("")
        : '<div class="muted" style="padding:20px">No images in library.</div>';

      var modalHtml = '<div class="modal" id="' + modalId + '">' +
        '<div class="modal-box">' +
        '<div class="toolbar">' +
        "<h2>Choose Image</h2>" +
        '<button type="button" class="btn" id="pickerClose">Close</button>' +
        "</div>" +
        '<div class="media-grid">' + gridHtml + "</div>" +
        "</div></div>";

      document.body.insertAdjacentHTML("beforeend", modalHtml);

      $("#pickerClose").onclick = function () {
        var m = document.getElementById(modalId);
        if (m) m.remove();
      };

      var pickItems = document.querySelectorAll('[data-pick-url][data-target="' + targetId + '"]');
      for (var i = 0; i < pickItems.length; i++) {
        pickItems[i].onclick = function () {
          var url = this.getAttribute("data-pick-url");
          var target = this.getAttribute("data-target");
          var el = $("#" + target);
          if (el) el.value = url;
          var m = document.getElementById(modalId);
          if (m) m.remove();
        };
      }
    });
  };

  function advancedPage() {
    return Promise.resolve(
      '<div class="panel"><h2>All Tables</h2>' +
      '<p class="muted">Every database table is accessible here.</p>' +
      '<div class="sectiongrid">' +
      Object.keys(resources).map(function (k) {
        return '<button type="button" class="btn" data-view="' + k + '">' + esc(resources[k]) + "</button>";
      }).join("") +
      "</div></div>"
    );
  }

  function activityPage() {
    return api("/api/admin/activity").then(function (d) {
      var items = d.items || [];
      var rows = items.map(function (x) {
        return "<tr><td>" + esc(x.created_at) + "</td><td>" + esc(x.actor_email) + "</td><td>" + esc(x.summary) + "</td></tr>";
      }).join("");
      return '<div class="panel"><h2>Activity Feed</h2>' +
        '<div class="tablewrap"><table class="table">' +
        "<tr><th>Time</th><th>Actor</th><th>Summary</th></tr>" +
        rows + "</table></div></div>";
    });
  }

  function errorsPage() {
    return api("/api/admin/errors").then(function (d) {
      var items = d.items || [];
      var rows = items.map(function (x) {
        return "<tr><td>" + esc(x.created_at) + "</td><td>" + esc(x.error_type) + "</td><td>" + esc(x.error_message) + "</td></tr>";
      }).join("");
      return '<div class="panel"><h2>Error Logs</h2>' +
        '<div class="tablewrap"><table class="table">' +
        "<tr><th>Time</th><th>Type</th><th>Message</th></tr>" +
        rows + "</table></div></div>";
    });
  }

  function auditPage() {
    return api("/api/admin/audit").then(function (d) {
      var items = d.items || [];
      var rows = items.map(function (x) {
        return "<tr><td>" + esc(x.created_at) + "</td><td>" + esc(x.actor_email) + "</td><td>" + esc(x.action) + "</td><td>" + esc(x.resource) + "</td></tr>";
      }).join("");
      return '<div class="panel"><h2>Audit Logs</h2>' +
        '<div class="tablewrap"><table class="table">' +
        "<tr><th>Time</th><th>Actor</th><th>Action</th><th>Resource</th></tr>" +
        rows + "</table></div></div>";
    });
  }

  function renderContent() {
    var content = $("#content");
    if (!content) return;

    var promise;

    if (view === "dashboard") promise = dashboard();
    else if (setDefs[view]) {
      promise = settingsPage(view);
    }
    else if (view === "security") promise = securityPage();
    else if (view === "advanced") promise = advancedPage();
    else if (view === "media") promise = mediaPage();
    else if (view === "activity_feed") promise = activityPage();
    else if (view === "error_logs") promise = errorsPage();
    else if (view === "cms_audit") promise = auditPage();
    else if (view === "logout") {
      api("/api/admin/logout", { method: "POST" }).catch(function () {});
      localStorage.removeItem("aroma_google_client_id");
      setTimeout(function () { location.href = "/"; }, 300);
      return;
    }
    else if (resources[view]) promise = resourcePage(view);
    else promise = Promise.resolve('<div class="panel"><h2>Unknown section</h2></div>');

    promise.then(function (html) {
      content.innerHTML = html;

      if (setDefs[view]) bindSettingsPage(view);
      if (view === "security") bindSecurity();
      if (view === "media") bindMediaPage();
      if (resources[view]) bindResourcePage(view);

      bindNav();
    }).catch(function (e) {
      content.innerHTML = '<div class="panel"><h2>Error</h2><p class="muted">' + esc(e.message) + "</p></div>";
    });
  }

  function adminView(v) {
    view = v;
    renderContent();
  }

  window.adminView = adminView;

  function boot() {
    api("/api/admin/me")
      .then(function (data) {
        me = data;
        return api("/api/admin/settings");
      })
      .then(function (settingsData) {
        cfg = settingsData || {};
        renderShell();
      })
      .catch(function () {
        api("/api/public/config")
          .then(function (publicCfg) {
            cfg = publicCfg || {};
            if (publicCfg && publicCfg.google_client_id && !localStorage.getItem("aroma_google_client_id")) {
              localStorage.setItem("aroma_google_client_id", publicCfg.google_client_id);
            }
            if (!localStorage.getItem("aroma_google_client_id") && C.GOOGLE_CLIENT_ID) {
              localStorage.setItem("aroma_google_client_id", C.GOOGLE_CLIENT_ID);
            }
            renderShell();
          })
          .catch(function () {
            if (!localStorage.getItem("aroma_google_client_id") && C.GOOGLE_CLIENT_ID) {
              localStorage.setItem("aroma_google_client_id", C.GOOGLE_CLIENT_ID);
            }
            renderShell();
          });
      });
  }

  function renderShell() {
    var el = $("#admin");
    if (!el) return;
    el.innerHTML = shell();
    bindNav();
    renderContent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
