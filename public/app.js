alert("AROMA APP.JS LOADED");
(function () {
  "use strict";

  var C = window.AROMA_CONFIG || {};
  var API = (C.API_BASE || "").replace(/\/$/, "");
  var $ = function (s) { return document.querySelector(s); };

  var S = {
    site: {}, theme: {}, header: {}, hero: {}, lifestyle: {},
    footer: {}, seo: {}, delivery: {}, payments: {}, ask_aroma: {},
    popup: {}, legal: {}, features: {}, content: {}
  };
  var products = [];
  var categories = [];
  var reviews = [];
  var pages = [];
  var social = [];
  var blog = [];
  var faqs = [];
  var team = [];
  var gallery = [];
  var testimonials = [];
  var sliders = [];
  var menus = [];
  var currencies = [];
  var user = null;
  var cart = JSON.parse(localStorage.getItem("aroma_cart") || "[]");

  var ICON_CART = "&#128722;";
  var ICON_ADMIN = "&#9881;";
  var ICON_MENU = "&#9776;";
  var ICON_STAR = "&#9733;";
  var ICON_CLOSE = "&times;";
  var ICON_DOT = "&middot;";
  var ICON_DASH = "&mdash;";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(n) {
    return (S.site.currency || "LKR") + " " + Number(n || 0).toLocaleString("en-LK");
  }

  function img(p) {
    if (!p) return "";
    if (typeof p === "string") return p;
    return p.image_url || p.featured_image || p.image1 || "";
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

  function save() {
    localStorage.setItem("aroma_cart", JSON.stringify(cart));
  }

  function addToCart(p) {
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === p.id) { existing = cart[i]; break; }
    }
    if (existing) existing.qty++;
    else cart.push({
      id: p.id, name: p.name, price: Number(p.price || 0),
      image: img(p), qty: 1, sku: p.sku || ""
    });
    save();
    toast("Added to cart");
    renderCartCount();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (x) { return x.id !== id; });
    save();
    openCart();
  }

  function toast(msg) {
    var el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(window.__tt);
    window.__tt = setTimeout(function () { el.style.display = "none"; }, 2000);
  }

  function applyTheme() {
    var t = S.theme || {};
    var style = document.documentElement.style;
    style.setProperty("--bg", t.bg || "#0d0c0b");
    style.setProperty("--surface", t.surface || "#171411");
    style.setProperty("--surface2", t.surface2 || "#211d18");
    style.setProperty("--gold", t.gold || "#d4af37");
    style.setProperty("--gold2", t.gold2 || "#f2d675");
    style.setProperty("--olive", t.olive || "#556b2f");
    style.setProperty("--text", t.text || "#f6f0e6");
    style.setProperty("--muted", t.muted || "#b9ad9e");
    style.setProperty("--radius", (t.radius || 18) + "px");
    style.setProperty("--container", (t.container_max || 1240) + "px");
    style.setProperty("--gap", (t.product_gap || 20) + "px");
    style.setProperty("--desk", t.desktop_columns || 4);
    style.setProperty("--mob", t.mobile_columns || 2);
    style.setProperty("--hero", (t.hero_height || 680) + "px");
    style.setProperty("--logo", (t.logo_width || 155) + "px");
    style.setProperty("--header", (t.header_height || 78) + "px");
    style.setProperty("--section", (t.section_padding || 78) + "px");
    style.setProperty("--cardpad", (t.card_padding || 18) + "px");
    style.setProperty("--btnradius", (t.button_radius || 999) + "px");
    style.setProperty("--ratio", t.product_image_ratio || "1/1");
    style.setProperty("--heading", t.heading_font || "Georgia");
    style.setProperty("--body", t.body_font || "Inter");
  }

  function isAdmin() {
    if (!user || !user.email) return false;
    var adminEmail = (C.ADMIN_EMAIL || "").toLowerCase();
    return user.email.toLowerCase() === adminEmail;
  }

  function header() {
    var h = S.header || {};
    var menu = h.menu || [];
    var menuHtml = "";
    for (var i = 0; i < menu.length; i++) {
      var m = menu[i];
      menuHtml += '<a href="' + esc(m.url || "#/") + '">' + esc(m.label) + "</a>";
    }

    var announceHtml = "";
    if (h.show_announcement && h.announcement) {
      announceHtml = '<div class="announce">' + esc(h.announcement) + "</div>";
    }

    var logoHtml = "";
    if (S.site.logo_url) {
      logoHtml = '<img src="' + esc(S.site.logo_url) + '" alt="' + esc(S.site.site_name || "AROMA LAB") + '">';
    }

    var cartHtml = "";
    if (h.show_cart !== false) {
      cartHtml = '<button class="iconbtn" onclick="window.aromaOpenCart()">' + ICON_CART + ' <span data-cart-count>0</span></button>';
    }

    var adminHtml = "";
    if (isAdmin()) {
      adminHtml = '<a class="admin-btn" href="/admin/">' + ICON_ADMIN + ' Admin</a>';
    }

    var loginHtml = "";
    if (h.show_login !== false) {
      loginHtml = '<button class="goldbtn" onclick="window.aromaLogin()">' + (user ? "Account" : "Sign in") + "</button>";
    }

    return announceHtml + '<header><div class="container nav">' +
      '<a class="brand" href="#/">' + logoHtml +
      "<span><b>" + esc(S.site.site_name || "AROMA LAB") + "</b>" +
      "<small>" + esc(S.site.descriptor || "FINE FRAGRANCES") + "</small></span></a>" +
      "<nav>" + menuHtml + "</nav>" +
      '<div class="nav-actions">' + cartHtml + adminHtml + loginHtml +
      '<button class="menuBtn" onclick="window.aromaToggleMenu()">' + ICON_MENU + '</button>' +
      "</div></div></header>";
  }

  function footer() {
    var f = S.footer || {};
    var cols = f.columns || [];
    var colsHtml = "";
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      var linksHtml = "";
      var links = c.links || [];
      for (var j = 0; j < links.length; j++) {
        linksHtml += "<p><a href=\"" + esc(links[j][1]) + "\">" + esc(links[j][0]) + "</a></p>";
      }
      colsHtml += "<div><b>" + esc(c.title) + "</b>" + linksHtml + "</div>";
    }

    var logoHtml = "";
    if (S.site.logo_url) {
      logoHtml = '<img src="' + esc(S.site.logo_url) + '" style="width:120px" alt="Logo">';
    }

    return '<footer><div class="container footergrid">' +
      "<div>" +
      '<div class="brand">' + logoHtml +
      "<span><b>" + esc(S.site.site_name || "AROMA LAB") + "</b></span></div>" +
      '<p class="legal">' + esc(f.tagline || "") + "</p>" +
      "</div>" + colsHtml +
      "<div><b>Contact</b>" +
      '<p class="legal">' + esc(S.site.address || "") + "<br>" +
      esc(S.site.phone || "") + "<br>" +
      '<a href="https://wa.me/' + esc(S.site.whatsapp || "") + '">WhatsApp</a>' +
      (S.site.email ? '<br><a href="mailto:' + esc(S.site.email) + '">' + esc(S.site.email) + "</a>" : "") +
      "</p></div></div>" +
      '<div class="container copyright">' + esc(f.copyright || "") + "</div></footer>";
  }

  function productCard(p) {
    var imgHtml = img(p)
      ? '<img src="' + esc(img(p)) + '" alt="' + esc(p.name) + '" loading="lazy">'
      : '<div style="display:grid;place-items:center;height:100%;color:#555;font-size:12px">No Image</div>';

    var gender = p.gender || "UNISEX";
    var size = p.size ? " " + ICON_DOT + " " + esc(p.size) : "";

    return '<article class="card">' +
      '<a href="#/product/' + p.id + '" class="product-img">' + imgHtml + "</a>" +
      '<div class="card-body">' +
      '<div class="muted tiny">' + esc(gender) + size + "</div>" +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="muted desc">' + esc(p.description || "") + "</p>" +
      '<div class="price">' + money(p.price) + "</div>" +
      '<div class="card-actions">' +
      '<button class="ghostbtn" onclick=\'window.aromaAdd(' + JSON.stringify(p).replace(/'/g, "&#39;") + ')\'>Add</button>' +
      '<a class="goldbtn" href="#/product/' + p.id + '">View</a>' +
      "</div></div></article>";
  }

  function home() {
    var h = S.hero || {};
    var l = S.lifestyle || {};
    var featured = products.filter(function (p) {
      return p.featured || p.is_active;
    }).slice(0, 8);

    var heroHtml = "";
    if (h.enabled !== false) {
      var heroStyle = "min-height:" + Number(h.height || 680) + "px;";
      if (h.image_url) {
        var ov = Number(h.overlay || 0.45);
        heroStyle += "background-image:linear-gradient(rgba(0,0,0," + ov + "),rgba(0,0,0," + ov + ")),url('" + esc(h.image_url) + "');";
      }
      heroStyle += "background-position:" + (h.position || "center") + ";";

      heroHtml = '<section class="hero" style="' + heroStyle + '">' +
        '<div class="hero-copy">' +
        '<div class="kicker">' + esc(S.site.descriptor || "") + "</div>" +
        "<h1>" + (h.title || "") + "</h1>" +
        "<p>" + esc(h.subtitle || "") + "</p>" +
        '<a class="goldbtn" href="' + esc(h.button_url || "#/shop") + '">' +
        esc(h.button_text || "Shop") + "</a>" +
        "</div></section>";
    }

    var productsHtml = featured.length
      ? featured.map(productCard).join("")
      : '<div class="empty">No products yet. Add from admin panel.</div>';

    var storyHtml = "";
    if (l.enabled !== false && (l.image1 || l.title)) {
      storyHtml = '<section class="section container"><div class="story">' +
        (l.image1 ? '<img src="' + esc(l.image1) + '" alt="Lifestyle">' : "") +
        "<div>" +
        '<div class="kicker">AROMA LAB</div>' +
        "<h2>" + esc(l.title || "") + "</h2>" +
        '<p class="muted bigline">' + esc(l.text || "") + "</p>" +
        '<a class="goldbtn" href="' + esc(l.button_url || "#/about") + '">' +
        esc(l.button_text || "Our Story") + "</a>" +
        "</div></div>";
      if (l.show_second && l.image2) {
        storyHtml += '<div class="story second">' +
          '<img src="' + esc(l.image2) + '" alt="Ask Aroma">' +
          "<div>" +
          '<div class="kicker">ASK AROMA</div>' +
          "<h2>Your Scent Guide</h2>" +
          '<p class="muted bigline">Find a fragrance that matches your mood.</p>' +
          '<button class="goldbtn" onclick="window.aromaOpenAroma()">Ask Aroma</button>' +
          "</div></div>";
      }
      storyHtml += "</section>";
    }

    var testimonialsHtml = "";
    if (testimonials.length) {
      testimonialsHtml = '<section class="section container">' +
        '<div class="section-head"><div><div class="kicker">LOVE</div><h2>Testimonials</h2></div></div>' +
        '<div class="reviews">' +
        testimonials.slice(0, 6).map(function (t) {
          var stars = repeat(ICON_STAR, Math.max(0, Math.min(5, Number(t.rating || 5))));
          return '<div class="review"><div class="stars">' + stars + "</div>" +
            "<b>" + esc(t.name) + "</b>" +
            '<p class="muted">' + esc(t.content || "") + "</p></div>";
        }).join("") +
        "</div></section>";
    }

    var reviewsHtml = "";
    if (reviews.length) {
      reviewsHtml = '<section class="section container">' +
        '<div class="section-head"><div><div class="kicker">REVIEWS</div><h2>Customer Reviews</h2></div></div>' +
        '<div class="reviews">' +
        reviews.slice(0, 6).map(function (r) {
          var stars = repeat(ICON_STAR, Math.max(0, Math.min(5, Number(r.rating || 0))));
          return '<div class="review"><div class="stars">' + stars + "</div>" +
            "<b>" + esc(r.customer_name || "Customer") + "</b>" +
            '<p class="muted">' + esc(r.review || "") + "</p></div>";
        }).join("") +
        "</div></section>";
    }

    var blogHtml = "";
    if (blog.length) {
      blogHtml = '<section class="section container">' +
        '<div class="section-head"><div><div class="kicker">JOURNAL</div><h2>From the Blog</h2></div>' +
        '<a href="#/blog" class="ghostbtn">All Posts</a></div>' +
        '<div class="blog-grid">' +
        blog.slice(0, 3).map(function (b) {
          return '<a href="#/blog/' + esc(b.slug) + '" class="blog-card">' +
            (b.featured_image ? '<img src="' + esc(b.featured_image) + '" alt="' + esc(b.title) + '" loading="lazy">' : "") +
            '<div class="blog-card-body"><h3>' + esc(b.title) + "</h3>" +
            '<p class="muted">' + esc(b.excerpt || "") + "</p></div></a>";
        }).join("") +
        "</div></section>";
    }

    var newsletterHtml = "";
    if (S.features && S.features.newsletter) {
      newsletterHtml = '<section class="section container">' +
        '<div class="newsletter-box">' +
        '<div class="kicker">STAY IN TOUCH</div>' +
        "<h2>Join Our Newsletter</h2>" +
        '<p class="muted">Get updates on new fragrances and offers.</p>' +
        '<div class="chatrow" style="justify-content:center">' +
        '<input id="nlEmail" placeholder="Your email" type="email">' +
        '<button class="goldbtn" onclick="window.aromaSubscribe()">Subscribe</button>' +
        "</div></div></section>";
    }

    var popupHtml = "";
    if (S.popup && S.popup.enabled && !sessionStorage.getItem("popupShown")) {
      popupHtml = renderPopup();
    }

    var fabHtml = "";
    if (S.ask_aroma && S.ask_aroma.enabled) {
      fabHtml = '<button class="aroma-fab" onclick="window.aromaOpenAroma()">A</button>';
    }

    return header() +
      "<main>" + heroHtml +
      '<section class="section container">' +
      '<div class="section-head"><div><div class="kicker">THE COLLECTION</div><h2>Signature Fragrances</h2></div>' +
      '<a href="#/shop" class="ghostbtn">View All</a></div>' +
      '<div class="grid">' + productsHtml + "</div></section>" +
      storyHtml + testimonialsHtml + reviewsHtml + blogHtml + newsletterHtml +
      '<section class="section container features">' +
      "<div><b>Islandwide Delivery</b>" +
      '<p class="muted">' + esc((S.delivery && S.delivery.note) || "Fast delivery.") + "</p></div>" +
      "<div><b>Secure Login</b><p class=\"muted\">Google account for orders.</p></div>" +
      "<div><b>Premium Quality</b><p class=\"muted\">Curated collection.</p></div>" +
      "</section></main>" + footer() + popupHtml + fabHtml;
  }

  function repeat(s, n) {
    var out = "";
    for (var i = 0; i < n; i++) out += s;
    return out;
  }

  function shop() {
    var active = products.filter(function (p) { return p.is_active !== 0; });
    var catsHtml = categories.map(function (c) {
      return '<button class="chip">' + esc(c.name) + "</button>";
    }).join("");

    return header() +
      '<main class="section container">' +
      '<div class="section-head"><div><div class="kicker">AROMA LAB</div><h2>Shop Fragrances</h2></div></div>' +
      '<div class="filters"><button class="chip active">All</button>' + catsHtml + "</div>" +
      '<div class="grid shopgrid">' +
      (active.length ? active.map(productCard).join("") : '<div class="empty">No products yet.</div>') +
      "</div></main>" + footer();
  }

  function product(id) {
    var p = null;
    for (var i = 0; i < products.length; i++) {
      if (String(products[i].id) === String(id)) { p = products[i]; break; }
    }
    if (!p) return page("Product not found", '<p><a href="#/shop">Return to shop</a></p>');

    var imgHtml = img(p)
      ? '<img src="' + esc(img(p)) + '" alt="' + esc(p.name) + '">'
      : '<div class="empty">No image</div>';

    var notesHtml = "";
    if (p.fragrance_family) {
      notesHtml = '<div class="notice"><b>Fragrance Family:</b> ' + esc(p.fragrance_family);
      if (p.fragrance_notes) notesHtml += "<br><b>Notes:</b> " + esc(p.fragrance_notes);
      notesHtml += "</div>";
    }

    return header() +
      '<main class="section container"><div class="product-detail">' +
      imgHtml +
      "<div>" +
      '<div class="kicker">' + esc(p.gender || "UNISEX") + (p.size ? " " + ICON_DOT + " " + esc(p.size) : "") + "</div>" +
      "<h2>" + esc(p.name) + "</h2>" +
      '<div class="price large">' + money(p.price) + "</div>" +
      '<p class="muted bigline">' + esc(p.description || "") + "</p>" +
      notesHtml +
      '<br><button class="goldbtn" onclick=\'window.aromaAdd(' + JSON.stringify(p).replace(/'/g, "&#39;") + ')\'>Add to Cart</button>' +
      "</div></div></main>" + footer();
  }

  function page(title, body) {
    return header() +
      '<main class="section container">' +
      '<div class="kicker">AROMA LAB</div>' +
      "<h2>" + title + "</h2>" +
      '<div class="pagebody">' + body + "</div>" +
      "</main>" + footer();
  }

  function renderPopup() {
    var p = S.popup || {};
    sessionStorage.setItem("popupShown", "1");
    return '<div class="popup" id="sitePopup"><div>' +
      '<button class="close" onclick="document.getElementById(\'sitePopup\').remove()">' + ICON_CLOSE + '</button>' +
      '<div class="kicker">AROMA LAB</div>' +
      "<h2>" + esc(p.title) + "</h2>" +
      "<p>" + esc(p.text) + "</p>" +
      '<a class="goldbtn" href="' + esc(p.button_url || "#/shop") + '">' +
      esc(p.button_text || "Shop Now") + "</a>" +
      "</div></div>";
  }

  function blogPage() {
    var postsHtml = blog.length
      ? blog.map(function (b) {
        return '<a href="#/blog/' + esc(b.slug) + '" class="blog-card">' +
          (b.featured_image ? '<img src="' + esc(b.featured_image) + '" alt="' + esc(b.title) + '" loading="lazy">' : "") +
          '<div class="blog-card-body"><h3>' + esc(b.title) + "</h3>" +
          '<p class="muted">' + esc(b.excerpt || "") + "</p></div></a>";
      }).join("")
      : '<div class="empty">No posts yet.</div>';

    return header() +
      '<main class="section container">' +
      '<div class="kicker">JOURNAL</div><h2>Blog</h2>' +
      '<div class="blog-grid">' + postsHtml + "</div>" +
      "</main>" + footer();
  }

  function blogPost(slug) {
    var b = null;
    for (var i = 0; i < blog.length; i++) {
      if (blog[i].slug === slug) { b = blog[i]; break; }
    }
    if (!b) return page("Post not found", "");

    return header() +
      '<main class="section container">' +
      '<div class="kicker">JOURNAL</div>' +
      "<h2>" + esc(b.title) + "</h2>" +
      '<div class="pagebody">' + (b.content || b.excerpt || "") + "</div>" +
      "</main>" + footer();
  }

  function faqPage() {
    var listHtml = faqs.length
      ? faqs.map(function (f) {
        return '<div class="faq-item"><b>' + esc(f.question) + "</b>" +
          '<div class="muted">' + esc(f.answer) + "</div></div>";
      }).join("")
      : '<div class="empty">No FAQs yet.</div>';

    return header() +
      '<main class="section container">' +
      '<div class="kicker">SUPPORT</div><h2>Frequently Asked Questions</h2>' +
      "<div>" + listHtml + "</div>" +
      "</main>" + footer();
  }

  function teamPage() {
    var listHtml = team.length
      ? team.map(function (m) {
        return '<div class="team-card">' +
          (m.image_url ? '<img src="' + esc(m.image_url) + '" alt="' + esc(m.name) + '" loading="lazy">' : "") +
          "<h3>" + esc(m.name) + "</h3>" +
          '<p class="muted">' + esc(m.position || "") + "</p>" +
          (m.bio ? '<p class="muted legal">' + esc(m.bio) + "</p>" : "") +
          "</div>";
      }).join("")
      : '<div class="empty">No team members yet.</div>';

    return header() +
      '<main class="section container">' +
      '<div class="kicker">TEAM</div><h2>Meet the Team</h2>' +
      '<div class="team-grid">' + listHtml + "</div>" +
      "</main>" + footer();
  }

  function galleryPage() {
    var listHtml = gallery.length
      ? gallery.map(function (g) {
        return '<img src="' + esc(g.cover_image || "") + '" alt="' + esc(g.name || "") + '" loading="lazy">';
      }).join("")
      : '<div class="empty">No gallery albums yet.</div>';

    return header() +
      '<main class="section container">' +
      '<div class="kicker">GALLERY</div><h2>Our Gallery</h2>' +
      '<div class="gallery-grid">' + listHtml + "</div>" +
      "</main>" + footer();
  }

  function renderCartCount() {
    var els = document.querySelectorAll("[data-cart-count]");
    for (var i = 0; i < els.length; i++) {
      var total = 0;
      for (var j = 0; j < cart.length; j++) total += cart[j].qty;
      els[i].textContent = total;
    }
  }

  function openCart() {
    var total = 0;
    for (var i = 0; i < cart.length; i++) total += cart[i].price * cart[i].qty;

    var freeAbove = Number((S.delivery && S.delivery.free_above) || 0);
    var fee = Number((S.delivery && S.delivery.fee) || 0);
    var delivery = total >= freeAbove ? 0 : fee;

    var itemsHtml = cart.length
      ? cart.map(function (x) {
        return '<div class="cartline">' +
          (x.image ? '<img src="' + esc(x.image) + '" alt="' + esc(x.name) + '">' : "<div></div>") +
          "<div><b>" + esc(x.name) + "</b>" +
          '<div class="muted">Qty ' + x.qty + "</div>" +
          '<div class="price">' + money(x.price * x.qty) + "</div></div>" +
          '<button class="ghostbtn" onclick="window.aromaRemove(' + x.id + ')">' + ICON_CLOSE + '</button>' +
          "</div>";
      }).join("")
      : '<div class="empty">Your cart is empty.</div>';

    var checkoutBtn = cart.length
      ? '<button class="goldbtn full" onclick="window.aromaCheckout()">Checkout</button>'
      : "";

    var html = '<div class="drawer" id="cartDrawer">' +
      '<div class="drawer-panel">' +
      '<button class="ghostbtn" onclick="document.getElementById(\'cartDrawer\').remove()">Close</button>' +
      "<h2>Shopping Cart</h2>" +
      itemsHtml +
      "<hr>" +
      "<p>Subtotal: <b>" + money(total) + "</b></p>" +
      "<p>Delivery: <b>" + (delivery ? money(delivery) : "FREE") + "</b></p>" +
      "<h3>Total: " + money(total + delivery) + "</h3>" +
      checkoutBtn +
      "</div></div>";

    document.body.insertAdjacentHTML("beforeend", html);
  }

  function loginGoogle() {
    try {
      var clientId = "";
      if (S && S.google_client_id) clientId = S.google_client_id;
      if (!clientId && C && C.GOOGLE_CLIENT_ID) clientId = C.GOOGLE_CLIENT_ID;
      if (!clientId) clientId = localStorage.getItem("aroma_google_client_id") || "";
      clientId = String(clientId).trim();

      if (!clientId) {
        alert("Google login not configured. Client ID missing.");
        return;
      }

      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        alert("Google Sign-In library not loaded. Please refresh the page and try again.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: function (response) {
          fetch(API + "/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential: response.credential })
          })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (data.error) {
                alert("Login error: " + data.error);
                return;
              }
              user = data;
              localStorage.setItem("aroma_google_client_id", clientId);
              toast("Login successful");
              render();
            })
            .catch(function (e) {
              alert("Login failed: " + e.message);
            });
        }
      });
      window.google.accounts.id.prompt();
    } catch (err) {
      alert("Login error: " + err.message);
    }
  }

  function account() {
    if (!user) {
      return page("Account",
        '<p>Please sign in with Google to view your account.</p>' +
        '<button class="goldbtn" onclick="window.aromaLogin()">Sign in with Google</button>');
    }
    return header() +
      '<main class="section container"><div class="panel accountpanel">' +
      "<h2>My Account</h2>" +
      "<p>" + esc(user.name) + " " + ICON_DOT + " " + esc(user.email) + "</p>" +
      '<button class="ghostbtn" onclick="window.aromaLoadOrders()">Load My Orders</button>' +
      '<div id="ordersBox"></div>' +
      "</div></main>" + footer();
  }

  function loadOrders() {
    api("/api/orders/me").then(function (d) {
      var items = d.items || [];
      var html = items.length
        ? items.map(function (o) {
          return '<div class="order"><b>' + esc(o.order_number) + "</b> " + ICON_DOT + " " +
            money(o.total) + " " + ICON_DOT + " " + esc(o.order_status) +
            '<br><span class="muted">' + esc(o.created_at || "") + "</span></div>";
        }).join("")
        : '<p class="muted">No orders yet.</p>';
      var box = $("#ordersBox");
      if (box) box.innerHTML = html;
    }).catch(function (e) {
      alert(e.message);
    });
  }

  function checkout() {
    if (!user) {
      loginGoogle();
      return;
    }
    var address = prompt("Shipping address:");
    if (!address) return;
    var phone = prompt("Phone number:", S.site.phone || "");
    if (!phone) return;

    var total = 0;
    for (var i = 0; i < cart.length; i++) total += cart[i].price * cart[i].qty;

    var freeAbove = Number((S.delivery && S.delivery.free_above) || 0);
    var fee = Number((S.delivery && S.delivery.fee) || 0);
    var delivery = total >= freeAbove ? 0 : fee;

    var items = cart.map(function (x) {
      return {
        product_id: x.id,
        product_name: x.name,
        product_sku: x.sku,
        quantity: x.qty,
        unit_price: x.price,
        subtotal: x.qty * x.price
      };
    });

    api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: phone,
        shipping_address: address,
        subtotal: total,
        delivery_fee: delivery,
        total: total + delivery,
        payment_method: "cod",
        items: items
      })
    }).then(function (r) {
      cart = [];
      save();
      var drawer = $("#cartDrawer");
      if (drawer) drawer.remove();
      toast("Order placed: " + r.order_number);
    }).catch(function (e) {
      alert("Order error: " + e.message);
    });
  }

  function openAroma() {
    var ask = S.ask_aroma || {};
    var html = '<div class="drawer" id="aromaDrawer">' +
      '<div class="drawer-panel">' +
      '<button class="ghostbtn" onclick="document.getElementById(\'aromaDrawer\').remove()">Close</button>' +
      "<h2>" + esc(ask.title || "Ask Aroma") + "</h2>" +
      '<p class="muted">' + esc(ask.welcome || "") + "</p>" +
      '<div id="chat"></div>' +
      '<div class="chatrow">' +
      '<input id="aromaInput" placeholder="e.g. sweet floral for evening">' +
      '<button class="goldbtn" onclick="window.aromaAsk()">Ask</button>' +
      "</div></div></div>";
    document.body.insertAdjacentHTML("beforeend", html);
  }

  function askAroma() {
    var input = $("#aromaInput");
    if (!input) return;
    var q = input.value.trim();
    if (!q) return;
    var chat = $("#chat");
    chat.innerHTML += '<div class="bubble user">' + esc(q) + "</div>";

    var ans = (S.ask_aroma && S.ask_aroma.knowledge) || "Tell us your preference.";
    var low = q.toLowerCase();
    if (low.indexOf("sweet") !== -1 || low.indexOf("vanilla") !== -1) {
      ans = "Try Vanilla or Good Girl for a sweeter direction.";
    } else if (low.indexOf("dark") !== -1 || low.indexOf("seductive") !== -1) {
      ans = "Black Temptation is a strong choice for a dark, mysterious mood.";
    } else if (low.indexOf("gold") !== -1 || low.indexOf("luxury") !== -1) {
      ans = "Million Gold fits a rich, bold and luxurious mood.";
    } else if (low.indexOf("man") !== -1 || low.indexOf("men") !== -1) {
      ans = "Hunters Dusk or Million Gold would be great choices.";
    } else if (low.indexOf("woman") !== -1 || low.indexOf("ladies") !== -1) {
      ans = "Good Girl or Black Temptation are popular choices.";
    }

    chat.innerHTML += '<div class="bubble bot">' + esc(ans) + "</div>";
    input.value = "";
  }

  function subscribeNewsletter() {
    var emailEl = $("#nlEmail");
    if (!emailEl) return;
    var email = emailEl.value.trim();
    if (!email) return;
    api("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email: email })
    }).then(function () {
      toast("Subscribed successfully!");
      emailEl.value = "";
    }).catch(function (e) {
      alert(e.message);
    });
  }

  function toggleMenu() {
    var nav = document.querySelector("nav");
    if (nav) nav.classList.toggle("open");
  }

  function render() {
    var hash = location.hash.replace(/^#\/?/, "");
    var html;

    if (!hash) html = home();
    else if (hash === "shop") html = shop();
    else if (hash.indexOf("product/") === 0) html = product(hash.split("/")[1]);
    else if (hash === "about") html = page(
      esc((S.content && S.content.about_title) || "About AROMA LAB"),
      "<p>" + esc((S.content && S.content.about_body) || "") + "</p>"
    );
    else if (hash === "contact") html = page(
      esc((S.content && S.content.contact_title) || "Contact AROMA LAB"),
      "<p>" + esc((S.content && S.content.contact_body) || "").replace(/\n/g, "<br>") + "</p>" +
      '<p><a href="https://wa.me/' + esc(S.site.whatsapp || "") + '" class="goldbtn">WhatsApp</a></p>'
    );
    else if (hash === "privacy") html = page(
      esc((S.content && S.content.privacy_title) || "Privacy Policy"),
      "<p>" + esc((S.content && S.content.privacy_body) || (S.legal && S.legal.privacy) || "") + "</p>"
    );
    else if (hash === "terms") html = page(
      esc((S.content && S.content.terms_title) || "Terms & Conditions"),
      "<p>" + esc((S.content && S.content.terms_body) || (S.legal && S.legal.terms) || "") + "</p>"
    );
    else if (hash === "returns") html = page(
      esc((S.content && S.content.returns_title) || "Returns & Refunds"),
      "<p>" + esc((S.content && S.content.returns_body) || (S.legal && S.legal.returns) || "") + "</p>"
    );
    else if (hash === "account") html = account();
    else if (hash === "blog") html = blogPage();
    else if (hash.indexOf("blog/") === 0) html = blogPost(hash.slice(5));
    else if (hash === "faq") html = faqPage();
    else if (hash === "team") html = teamPage();
    else if (hash === "gallery") html = galleryPage();
    else {
      var customPage = null;
      for (var i = 0; i < pages.length; i++) {
        if (String(pages[i].slug).replace(/^\//, "") === hash) {
          customPage = pages[i];
          break;
        }
      }
      if (customPage) {
        html = page(esc(customPage.title || customPage.slug), String(customPage.content || ""));
      } else {
        html = page("Page not found", '<p>The requested page could not be found.</p><p><a href="#/">Go home</a></p>');
      }
    }

    var app = $("#app");
    if (app) app.innerHTML = html;
    applyTheme();
    renderCartCount();
  }

  window.aromaAdd = addToCart;
  window.aromaRemove = removeFromCart;
  window.aromaOpenCart = openCart;
  window.aromaCheckout = checkout;
  window.aromaLogin = loginGoogle;
  window.aromaOpenAroma = openAroma;
  window.aromaAsk = askAroma;
  window.aromaSubscribe = subscribeNewsletter;
  window.aromaToggleMenu = toggleMenu;
  window.aromaLoadOrders = loadOrders;

  function boot() {
    api("/api/public/bootstrap").then(function (d) {
      var settings = d.settings || {};
      for (var k in settings) {
        S[k] = settings[k];
      }
      products = d.products || [];
      categories = d.categories || [];
      reviews = d.reviews || [];
      pages = d.pages || [];
      social = d.social || [];
      blog = d.blog || [];
      faqs = d.faqs || [];
      team = d.team || [];
      gallery = d.gallery || [];
      testimonials = d.testimonials || [];
      sliders = d.sliders || [];
      menus = d.menus || [];
      currencies = d.currencies || [];

      if (S.google_client_id && !localStorage.getItem("aroma_google_client_id")) {
        localStorage.setItem("aroma_google_client_id", S.google_client_id);
      }
      if (!localStorage.getItem("aroma_google_client_id") && C.GOOGLE_CLIENT_ID) {
        localStorage.setItem("aroma_google_client_id", C.GOOGLE_CLIENT_ID);
      }

      return api("/api/customer/me").catch(function () { return null; });
    }).then(function (u) {
      user = u;
      document.title = (S.seo && S.seo.site_title) || "AROMA LAB - Fine Fragrances";
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && S.seo && S.seo.meta_description) {
        metaDesc.setAttribute("content", S.seo.meta_description);
      }
      var favicon = document.querySelector('link[rel="icon"]');
      if (favicon && S.site && S.site.favicon_url) {
        favicon.href = S.site.favicon_url;
      }
      applyTheme();
      render();
    }).catch(function (e) {
      console.error("Boot error:", e);
      var app = $("#app");
      if (app) {
        app.innerHTML = '<div style="display:grid;place-items:center;min-height:100vh;text-align:center;padding:20px">' +
          '<div><h2 style="font-family:Georgia,serif;color:#d4af37;margin-bottom:16px">AROMA LAB</h2>' +
          '<p style="color:#b9ad9e">Could not load site. Please refresh.</p>' +
          '<button onclick="location.reload()" style="margin-top:20px;padding:12px 24px;background:#d4af37;color:#17120b;border:0;border-radius:99px;font-weight:800;cursor:pointer">Retry</button></div></div>';
      }
    });
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("load", boot);
})();
