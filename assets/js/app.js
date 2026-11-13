/* Paradise Stay — shared page logic. Data lives in data.js. */
(function () {
  "use strict";
  var S = window.SITE || {};
  var V = window.VILLAS || [];
  var PLACEHOLDER = "assets/img/placeholder.svg";

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function titleCase(s) {
    return String(s || "").toLowerCase().replace(/(^|[\s\-\/(])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function money(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
  function params() { return new URLSearchParams(window.location.search); }

  function villaName(v) { return titleCase(String(v.title).replace(/^\s*\d+\s*BHK\s*/i, "").trim()); }
  function locLabel(v) { return titleCase(v.loc); }
  var OTHER = "Elsewhere in Goa";
  function areaOf(v) {
    var parts = String(v.loc).split(",");
    return parts.length > 1 ? titleCase(parts[0].trim()) : OTHER;
  }
  function cover(v) { return (window.COVERS && window.COVERS[v.id]) || v.img; }
  function photos(v) {
    var list = Array.isArray(v.gallery) && v.gallery.length ? v.gallery.slice() : [v.img];
    var c = cover(v), i = list.indexOf(c);
    if (i > 0) { list.splice(i, 1); list.unshift(c); } else if (i < 0) list.unshift(c);
    return list;
  }
  function sleeps(v) { return v.maxCapacity || (v.bhk * 2 + 4); }
  function deposit(v) { return Number(v.securityDeposit || 7000); }
  function extraGuest(v) { return Number(v.extraGuestFee || 1500); }
  function villaUrl(v) { return "villa.html?id=" + encodeURIComponent(v.id); }
  function waUrl(text) { return "https://wa.me/" + S.whatsapp + "?text=" + encodeURIComponent(text); }
  function bookingText(v) {
    return "Hello " + S.name + "! I'm interested in booking " + v.title + " (" + v.loc + "). Please share availability and pricing. Thank you!";
  }

  function hiRes(u) {
    u = String(u || "");
    return /\/wp-content\/uploads\//.test(u) ? u.replace(/-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)$)/i, "") : u;
  }
  window.__psImgErr = function (el) {
    var o = el.getAttribute("data-orig");
    if (o && !el.getAttribute("data-tried")) { el.setAttribute("data-tried", "1"); el.src = o; return; }
    el.onerror = null;
    el.src = PLACEHOLDER;
  };
  function img(src, alt, eager, extra) {
    var hi = hiRes(src);
    return '<img src="' + esc(hi) + '"' + (hi !== src ? ' data-orig="' + esc(src) + '"' : "") + ' alt="' + esc(alt) + '" loading="' + (eager ? "eager" : "lazy") +
      '" decoding="async" referrerpolicy="no-referrer"' + (extra || "") + ' onerror="__psImgErr(this)">';
  }

  function areas() {
    var map = {};
    V.forEach(function (v) { var a = areaOf(v); map[a] = (map[a] || 0) + 1; });
    return Object.keys(map).map(function (k) { return { name: k, count: map[k] }; })
      .sort(function (a, b) {
        if (a.name === OTHER) return 1;
        if (b.name === OTHER) return -1;
        return b.count - a.count || a.name.localeCompare(b.name);
      });
  }
  function bhkList() {
    return V.map(function (v) { return v.bhk; })
      .filter(function (b, i, a) { return a.indexOf(b) === i; })
      .sort(function (a, b) { return a - b; });
  }
  function minNightly() {
    return Math.min.apply(null, V.filter(function (v) { return !v.isPerPersonOffer; }).map(function (v) { return Number(v.priceWd); }));
  }

  var ICON = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 9.5c.3 1.9 1.9 3.9 4 4.8l1.2-1.1 2 .9-.4 1.6c-3.6.2-7.6-3.3-8-7l1.6-.5 1 1.9z" fill="currentColor" stroke="none"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3h-7v6M3 15h18"/><circle cx="7" cy="11.5" r="1.8"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M18 19a5 5 0 0 0-2.5-4.3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
    mark: '<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#1D3F94"/><path d="M18 50V30a14 14 0 0 1 28 0v20z" fill="#fff"/><circle cx="32" cy="32" r="5" fill="#F4B41A"/></svg>'
  };
  var AMENITY_ICONS = {
    "Private Swimming Pool": '<path d="M2 17c2 0 2-1.5 4-1.5S8 17 10 17s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5S8 21 10 21s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 14V5a2 2 0 0 1 4 0M16 14V5a2 2 0 0 0-4 0M8 8h8M8 11h8"/>',
    "Air Conditioning": '<path d="M12 2v20M4.9 6.5l14.2 11M4.9 17.5l14.2-11M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/>',
    "High-Speed WiFi": '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.4a10 10 0 0 1 14 0M8.5 15.9a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
    "Smart TV with Streaming": '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4M10 8.5v5l4-2.5z"/>',
    "Indoor Games": '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="16" cy="8" r="1.2"/><circle cx="8" cy="16" r="1.2"/>',
    "Private Chef Available": '<path d="M6 13.9A4 4 0 0 1 7 6.1a5 5 0 0 1 10 0 4 4 0 0 1 1 7.8V20H6z"/><path d="M6 17h12"/>',
    "Secure Parking": '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    "24/7 Power Backup": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    "BBQ & Bonfire Setup": '<path d="M12 22c4 0 7-2.7 7-6.5 0-3-2-5.2-3.5-6.8-.4 1.6-1.3 2.6-2.5 3C13.5 8.5 12 5 9 2c0 4-4 6.5-4 13.5C5 19.3 8 22 12 22z"/>'
  };
  var AMENITIES = Object.keys(AMENITY_ICONS);

  /* ---------- header & footer ---------- */
  function renderChrome() {
    var page = document.body.getAttribute("data-page");
    var links = [["index.html", "Home", "home"], ["villas.html", "Villas", "villas"], ["gallery.html", "Gallery", "gallery"], ["about.html", "About", "about"], ["contact.html", "Contact", "contact"]];
    var h = $("#site-header");
    if (h) {
      h.className = "site-header";
      h.innerHTML = '<div class="wrap">' +
        '<a class="brand" href="index.html">' + ICON.mark + '<span class="brand-name">' + esc(S.name) + '</span></a>' +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu"><span></span></button>' +
        '<nav class="nav" id="main-nav" aria-label="Main">' +
        links.map(function (l) {
          return '<a href="' + l[0] + '"' + (page === l[2] || (page === "villa" && l[2] === "villas") ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
        }).join("") + "</nav>" +
        '<a class="btn btn-wa header-cta" target="_blank" rel="noopener" href="' + esc(waUrl("Hello " + S.name + "! I'd like to know more about your villas in Goa.")) + '">' + ICON.chat + "WhatsApp us</a>" +
        "</div>";
      var btn = $(".menu-btn", h), nav = $("#main-nav", h);
      if (page === "home") {
        h.classList.add("over-hero");
        var onScroll = function () { h.classList.toggle("scrolled", window.scrollY > 40); };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      }
      btn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        h.classList.toggle("menu-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
    }
    var f = $("#site-footer");
    if (f) {
      f.className = "site-footer";
      var topAreas = areas().filter(function (a) { return a.name !== OTHER; }).slice(0, 5);
      f.innerHTML = '<div class="tiles tile-band" aria-hidden="true"></div><div class="wrap">' +
        '<div class="footer-grid">' +
        '<div class="footer-brand"><a class="brand" href="index.html">' + ICON.mark + '<span class="brand-name">' + esc(S.name) + "</span></a>" +
        "<p>" + V.length + " private villas across Goa, from a 1 BHK for two to a 7 BHK for the whole group. Booked over WhatsApp.</p></div>" +
        '<div><h3>Explore</h3><ul><li><a href="villas.html">All villas</a></li><li><a href="gallery.html">Gallery</a></li><li><a href="about.html">About us</a></li><li><a href="contact.html">Contact</a></li></ul></div>' +
        "<div><h3>Areas</h3><ul>" + topAreas.map(function (a) {
          return '<li><a href="villas.html?area=' + encodeURIComponent(a.name) + '">' + esc(a.name) + "</a></li>";
        }).join("") + "</ul></div>" +
        "<div><h3>Contact</h3><ul>" +
        '<li><a target="_blank" rel="noopener" href="' + esc(waUrl("Hello " + S.name + "!")) + '">WhatsApp ' + esc(S.whatsappDisplay) + "</a></li>" +
        '<li><a href="mailto:' + esc(S.email) + '">Email us</a></li>' +
        "<li>" + esc(S.address) + "</li></ul></div>" +
        "</div>" +
        '<div class="footer-legal">© ' + new Date().getFullYear() + " " + esc(S.name) + ". All rights reserved.</div>" +
        "</div>";
    }
  }

  /* ---------- cards ---------- */
  function card(v, eager) {
    var prices = v.isPerPersonOffer
      ? "<div><small>Group stay</small><strong>" + money(v.ppPrice) + " per person</strong></div>" +
        "<div><small>Minimum</small><strong>" + (v.minGuests || "—") + " guests</strong></div>"
      : "<div><small>Weekdays</small><strong>" + money(v.priceWd) + "</strong></div>" +
        "<div><small>Weekends</small><strong>" + money(v.priceWe) + "</strong></div>";
    return '<a class="card" href="' + villaUrl(v) + '">' +
      '<div class="card-photo">' + img(cover(v), villaName(v) + ", " + locLabel(v), eager) +
      '<span class="card-bhk">' + v.bhk + " BHK</span>" +
      (v.isPerPersonOffer ? '<span class="card-offer">Group offer</span>' : "") + "</div>" +
      '<div class="card-body"><h3 class="card-name">' + esc(villaName(v)) + "</h3>" +
      '<p class="card-loc">' + esc(locLabel(v)) + "</p>" +
      '<p class="card-meta"><span>' + ICON.bed + v.bhk + (v.bhk === 1 ? " bedroom" : " bedrooms") + "</span><span>" + ICON.people +
      (v.minGuests ? "Min " + v.minGuests + " guests" : "Sleeps " + sleeps(v)) + "</span></p>" +
      '<div class="card-prices">' + prices + "</div></div></a>";
  }

  function fillSelect(sel, items, placeholder) {
    if (!sel) return;
    sel.innerHTML = '<option value="">' + esc(placeholder) + "</option>" + items.map(function (it) {
      return '<option value="' + esc(it.value) + '"' + (it.count ? ' data-count="' + esc(it.count) + '"' : "") + ">" + esc(it.label) + "</option>";
    }).join("");
  }
  function areaOptions() { return areas().map(function (a) { return { value: a.name, label: a.name, count: a.count }; }); }
  function bhkOptions() { return bhkList().map(function (b) { return { value: b, label: b + " BHK" }; }); }

  /* ---------- lightbox ---------- */
  var LB = null;
  function lightbox(list, start, title) {
    if (!LB) {
      var el = document.createElement("div");
      el.className = "lightbox";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-modal", "true");
      el.setAttribute("aria-label", "Photo viewer");
      el.innerHTML =
        '<div class="lb-bg" aria-hidden="true"><img alt="" referrerpolicy="no-referrer"></div>' +
        '<div class="lb-top"><div class="lb-head"><div class="lb-title"></div><div class="lb-count"></div></div>' +
        '<button type="button" class="lb-close" aria-label="Close photos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
        '<div class="lb-stage"><button type="button" class="lb-nav lb-prev" aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>' +
        '<figure class="lb-figure"><img class="lb-img" alt="" referrerpolicy="no-referrer"><img class="lb-img" alt="" referrerpolicy="no-referrer"><span class="lb-spin" aria-hidden="true"></span><figcaption class="lb-cap"></figcaption></figure>' +
        '<button type="button" class="lb-nav lb-next" aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></div>' +
        '<div class="lb-thumbs"></div>';
      document.body.appendChild(el);
      var layers = $all(".lb-img", el);
      LB = { el: el, layers: layers, front: 0, bg: $(".lb-bg img", el), count: $(".lb-count", el), title: $(".lb-title", el), cap: $(".lb-cap", el), thumbs: $(".lb-thumbs", el), list: [], i: 0, back: null, token: 0, dir: 1 };
      $(".lb-close", el).addEventListener("click", closeLB);
      $(".lb-prev", el).addEventListener("click", function () { showLB(LB.i - 1, -1); });
      $(".lb-next", el).addEventListener("click", function () { showLB(LB.i + 1, 1); });
      $(".lb-stage", el).addEventListener("click", function (e) { if (e.target === e.currentTarget) closeLB(); });
      LB.thumbs.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-i]");
        if (b) { var k = Number(b.getAttribute("data-i")); showLB(k, k >= LB.i ? 1 : -1); }
      });
      document.addEventListener("keydown", function (e) {
        if (!LB.el.classList.contains("open")) return;
        if (e.key === "Escape") closeLB();
        if (e.key === "ArrowLeft") showLB(LB.i - 1, -1);
        if (e.key === "ArrowRight") showLB(LB.i + 1, 1);
        if (e.key === "Tab") {
          var f = $all("button", LB.el).filter(function (x) { return x.offsetParent !== null; });
          if (!f.length) return;
          if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        }
      });
      var x0 = null, y0 = null;
      el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      el.addEventListener("touchend", function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) showLB(LB.i + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) closeLB();
        x0 = y0 = null;
      });
    }
    LB.list = list;
    LB.back = document.activeElement;
    LB.title.textContent = title || "";
    LB.thumbs.innerHTML = list.map(function (p, i) {
      return '<button type="button" data-i="' + i + '" aria-label="Photo ' + (i + 1) + (p.label ? ", " + esc(p.label) : "") + '">' + img(p.src, "", false) + "</button>";
    }).join("");
    LB.thumbs.hidden = list.length < 2;
    $all(".lb-nav", LB.el).forEach(function (n) { n.hidden = list.length < 2; });
    LB.layers.forEach(function (l) { l.classList.remove("on"); l.removeAttribute("src"); });
    LB.el.classList.add("open");
    requestAnimationFrame(function () { LB.el.classList.add("in"); });
    document.documentElement.style.overflow = "hidden";
    showLB(start || 0, 0);
    $(".lb-close", LB.el).focus();
  }
  function loadInto(im, src, done) {
    var hi = hiRes(src), tried = false;
    im.onload = function () { im.onload = im.onerror = null; done(true); };
    im.onerror = function () {
      if (!tried && hi !== src) { tried = true; im.src = src; return; }
      im.onload = im.onerror = null; im.src = PLACEHOLDER; done(false);
    };
    im.src = hi;
  }
  function showLB(i, dir) {
    var n = LB.list.length;
    LB.i = (i + n) % n;
    var p = LB.list[LB.i], token = ++LB.token;
    var back = LB.layers[1 - LB.front], front = LB.layers[LB.front];
    LB.el.classList.add("loading");
    back.classList.remove("on");
    back.style.setProperty("--from", (dir || 0) * 28 + "px");
    back.alt = p.label || (LB.title.textContent + " photo " + (LB.i + 1));
    loadInto(back, p.src, function () {
      if (token !== LB.token) return;
      LB.el.classList.remove("loading");
      void back.offsetWidth;
      back.classList.add("on");
      front.classList.remove("on");
      LB.front = 1 - LB.front;
      LB.bg.src = back.src;
    });
    LB.count.textContent = (LB.i + 1) + " / " + n;
    LB.cap.textContent = p.label || "";
    LB.cap.hidden = !p.label;
    $all("button", LB.thumbs).forEach(function (b, k) {
      var on = k === LB.i;
      b.setAttribute("aria-current", on ? "true" : "false");
      if (on && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
    [1, -1].forEach(function (d) { var q = LB.list[(LB.i + d + n) % n]; if (q) { var pre = new Image(); pre.referrerPolicy = "no-referrer"; pre.src = hiRes(q.src); } });
  }
  function closeLB() {
    LB.el.classList.remove("in");
    LB.token++;
    setTimeout(function () {
      LB.el.classList.remove("open", "loading");
      LB.layers.forEach(function (l) { l.classList.remove("on"); l.removeAttribute("src"); });
    }, 260);
    document.documentElement.style.overflow = "";
    if (LB.back && LB.back.focus) LB.back.focus();
  }

  /* ---------- custom dropdown ---------- */
  var CHEV = '<svg class="sel-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var CHECK = '<svg class="sel-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var openSel = null;
  function enhanceSelect(sel) {
    if (!sel) return;
    if (sel._sync) { sel._sync(); return; }
    var id = sel.id || ("sel" + Math.random().toString(36).slice(2, 8));
    sel.id = id;
    var wrap = document.createElement("div");
    wrap.className = "sel";
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add("sel-native");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sel-btn";
    btn.id = id + "-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", id + "-list");
    var lab = document.querySelector('label[for="' + id + '"]');
    if (lab) {
      lab.id = lab.id || id + "-label";
      lab.setAttribute("for", btn.id);
      btn.setAttribute("aria-labelledby", lab.id + " " + btn.id);
    }
    btn.innerHTML = '<span class="sel-value"></span>' + CHEV;
    var list = document.createElement("div");
    list.className = "sel-list";
    list.id = id + "-list";
    list.setAttribute("role", "listbox");
    if (lab) list.setAttribute("aria-labelledby", lab.id);
    wrap.appendChild(btn);
    wrap.appendChild(list);
    var active = -1;

    function render() {
      list.innerHTML = Array.prototype.map.call(sel.options, function (o, i) {
        return '<div class="sel-opt" role="option" id="' + id + "-o" + i + '" data-i="' + i + '" aria-selected="' + (o.selected ? "true" : "false") + '">' +
          "<span>" + esc(o.text) + "</span>" + (o.getAttribute("data-count") ? "<small>" + esc(o.getAttribute("data-count")) + "</small>" : "") + CHECK + "</div>";
      }).join("");
    }
    function sync() {
      var o = sel.options[sel.selectedIndex];
      $(".sel-value", btn).textContent = o ? o.text : "";
      wrap.classList.toggle("has-value", !!sel.value);
    }
    function setActive(i) {
      var els = $all(".sel-opt", list);
      if (!els.length) return;
      active = Math.max(0, Math.min(els.length - 1, i));
      els.forEach(function (el, k) { el.classList.toggle("active", k === active); });
      btn.setAttribute("aria-activedescendant", els[active].id);
      var el = els[active], top = el.offsetTop, bottom = top + el.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top - 6;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
    }
    function open() {
      if (openSel && openSel !== api) openSel.close(false);
      render();
      wrap.classList.remove("up", "right");
      var r = btn.getBoundingClientRect();
      if (r.left + Math.max(r.width, 240) > window.innerWidth - 12) wrap.classList.add("right");
      var below = window.innerHeight - r.bottom - 24, above = r.top - 90;
      var need = Math.min(330, sel.options.length * 46 + 12);
      var up = below < need && above > below;
      if (up) wrap.classList.add("up");
      list.style.maxHeight = Math.max(180, Math.min(need, up ? above : below)) + "px";
      wrap.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      setActive(Math.max(0, sel.selectedIndex));
      openSel = api;
      document.addEventListener("pointerdown", outside, true);
    }
    function close(focus) {
      wrap.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.removeAttribute("aria-activedescendant");
      document.removeEventListener("pointerdown", outside, true);
      if (openSel === api) openSel = null;
      if (focus) btn.focus();
    }
    function outside(e) { if (!wrap.contains(e.target)) close(false); }
    function choose(i) {
      var changed = sel.selectedIndex !== i;
      sel.selectedIndex = i;
      sync();
      close(true);
      if (changed) sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    btn.addEventListener("click", function () { if (wrap.classList.contains("open")) close(false); else open(); });
    btn.addEventListener("keydown", function (e) {
      var isOpen = wrap.classList.contains("open");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) open(); else setActive(active + (e.key === "ArrowDown" ? 1 : -1));
      } else if ((e.key === "Enter" || e.key === " ") && isOpen) {
        e.preventDefault();
        choose(active);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close(true);
      } else if (e.key === "Tab" && isOpen) {
        close(false);
      } else if (isOpen && (e.key === "Home" || e.key === "End")) {
        e.preventDefault();
        setActive(e.key === "Home" ? 0 : sel.options.length - 1);
      } else if (isOpen && e.key.length === 1 && /\S/.test(e.key)) {
        var k = e.key.toLowerCase();
        for (var j = 1; j <= sel.options.length; j++) {
          var n = (active + j) % sel.options.length;
          if (sel.options[n].text.toLowerCase().charAt(0) === k) { setActive(n); break; }
        }
      }
    });
    list.addEventListener("pointerdown", function (e) { e.preventDefault(); });
    list.addEventListener("click", function (e) {
      var o = e.target.closest(".sel-opt");
      if (o) choose(Number(o.getAttribute("data-i")));
    });
    list.addEventListener("pointermove", function (e) {
      var o = e.target.closest(".sel-opt");
      if (o && Number(o.getAttribute("data-i")) !== active) setActive(Number(o.getAttribute("data-i")));
    });
    sel.addEventListener("change", sync);
    var api = { close: close };
    sel._sync = sync;
    sync();
  }
  function enhanceAll(root) { $all("select", root).forEach(enhanceSelect); }
  window.addEventListener("resize", function () { if (openSel) openSel.close(false); });

  /* ---------- slider ---------- */
  /* slides: [{ candidates: [src...], alt, href, title, sub }] */
  function slider(el, slides, opts) {
    opts = opts || {};
    if (!el || !slides.length) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = opts.delay || 5000;
    el.classList.add("slider");
    el.innerHTML = '<div class="slides">' + slides.map(function (s, i) {
      var tag = s.href ? "a" : "div";
      return "<" + tag + ' class="slide' + (i === 0 ? " is-on" : "") + '"' + (s.href ? ' href="' + esc(s.href) + '"' : "") +
        (i === 0 ? "" : ' aria-hidden="true" tabindex="-1"') + ">" +
        '<img alt="' + esc(s.alt || "") + '" decoding="async" referrerpolicy="no-referrer"' + (i === 0 ? ' fetchpriority="high"' : "") + "></" + tag + ">";
    }).join("") + "</div>" +
      (slides.length > 1 ? '<div class="slide-dots" role="group" aria-label="' + esc(opts.label || "Photos") + '">' + slides.map(function (s, i) {
        return '<button type="button" aria-label="Show ' + esc(s.title || "photo " + (i + 1)) + '"' + (i === 0 ? ' aria-current="true"' : "") + '><span style="animation-duration:' + delay + 'ms"></span></button>';
      }).join("") + "</div>" : "") +
      (opts.counter && slides.length > 1 ? '<div class="slide-count"><span>1</span> / ' + slides.length + "</div>" : "");
    var els = $all(".slide", el), dots = $all(".slide-dots button", el), count = $(".slide-count span", el);
    var imgs = els.map(function (s) { return $("img", s); });

    function load(i) {
      var im = imgs[i];
      if (!im || im.getAttribute("data-loaded")) return;
      im.setAttribute("data-loaded", "1");
      var cands = slides[i].candidates.slice(), k = 0;
      function next() {
        if (k >= cands.length) { im.onerror = null; im.src = PLACEHOLDER; return; }
        var hi = hiRes(cands[k]);
        var tries = hi !== cands[k] ? [hi, cands[k]] : [hi];
        var t = 0;
        im.onerror = function () { t++; if (t < tries.length) im.src = tries[t]; else { k++; next(); } };
        im.onload = function () {
          if (im.naturalWidth && im.naturalWidth < (opts.minWidth || 1000) && k < cands.length - 1) { k++; next(); }
        };
        im.src = tries[0];
      }
      next();
    }
    var cur = 0, timer = null, paused = false;
    function show(i) {
      i = (i + els.length) % els.length;
      els[cur].classList.remove("is-on");
      els[cur].setAttribute("aria-hidden", "true");
      els[cur].setAttribute("tabindex", "-1");
      if (dots[cur]) dots[cur].removeAttribute("aria-current");
      cur = i;
      load(cur); load((cur + 1) % els.length);
      els[cur].classList.add("is-on");
      els[cur].removeAttribute("aria-hidden");
      els[cur].removeAttribute("tabindex");
      if (dots[cur]) {
        var sp = $("span", dots[cur]);
        dots[cur].setAttribute("aria-current", "true");
        if (sp) { sp.style.animation = "none"; void sp.offsetWidth; sp.style.animation = ""; sp.style.animationDuration = delay + "ms"; }
      }
      if (count) count.textContent = cur + 1;
      if (opts.onChange) opts.onChange(slides[cur], cur);
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (els.length < 2 || paused) return;
      timer = setTimeout(function () { show(cur + 1); }, delay);
    }
    function pause(p) { paused = p; el.classList.toggle("is-paused", p); if (p) clearTimeout(timer); else schedule(); }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i); }); });
    el.addEventListener("mouseenter", function () { pause(true); });
    el.addEventListener("mouseleave", function () { pause(false); });
    el.addEventListener("focusin", function () { pause(true); });
    el.addEventListener("focusout", function () { pause(false); });
    document.addEventListener("visibilitychange", function () { pause(document.hidden); });
    var x0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    if (reduce) el.classList.add("no-motion");
    load(0); load(1);
    if (opts.onChange) opts.onChange(slides[0], 0);
    schedule();
  }

  /* ---------- date range picker ---------- */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseIso(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function niceDate(s) { return parseIso(s).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
  function nightsBetween(a, b) { return Math.round((parseIso(b) - parseIso(a)) / 86400000); }

  function datePicker(root, inInput, outInput) {
    var today = isoOf(new Date());
    var maxD = new Date(); maxD.setMonth(maxD.getMonth() + 12);
    var maxIso = isoOf(maxD);
    var state = { start: "", end: "", picking: "in", hover: "", y: new Date().getFullYear(), m: new Date().getMonth() };
    root.innerHTML =
      '<button type="button" class="date-btn" data-which="in" aria-haspopup="dialog" aria-expanded="false"><small>Check-in</small><span data-v="in">Add date</span></button>' +
      '<button type="button" class="date-btn" data-which="out" aria-haspopup="dialog" aria-expanded="false"><small>Check-out</small><span data-v="out">Add date</span></button>' +
      '<div class="cal" role="dialog" aria-label="Choose your dates">' +
      '<div class="cal-head"><button type="button" class="cal-nav" data-nav="-1" aria-label="Previous month">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button>' +
      '<strong class="cal-title" aria-live="polite"></strong>' +
      '<button type="button" class="cal-nav" data-nav="1" aria-label="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div>' +
      '<div class="cal-week" aria-hidden="true"><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span></div>' +
      '<div class="cal-grid"></div>' +
      '<div class="cal-foot"><span class="cal-status"></span><div><button type="button" class="cal-clear">Clear</button><button type="button" class="cal-done">Done</button></div></div>' +
      "</div>";
    var cal = $(".cal", root), grid = $(".cal-grid", root), title = $(".cal-title", root), status = $(".cal-status", root);
    var btns = $all(".date-btn", root);

    function render() {
      title.textContent = MONTHS[state.m] + " " + state.y;
      var first = new Date(state.y, state.m, 1);
      var lead = (first.getDay() + 6) % 7;
      var days = new Date(state.y, state.m + 1, 0).getDate();
      var html = "";
      for (var i = 0; i < lead; i++) html += '<span class="cal-pad"></span>';
      var endPreview = state.end || (state.start && state.hover > state.start ? state.hover : "");
      for (var d = 1; d <= days; d++) {
        var iso = state.y + "-" + pad(state.m + 1) + "-" + pad(d);
        var dis = iso < today || iso > maxIso;
        var cls = ["cal-day"];
        var dow = new Date(state.y, state.m, d).getDay();
        if (dow === 0 || dow === 6) cls.push("wknd");
        if (iso === today) cls.push("today");
        if (iso === state.start) cls.push("start");
        if (iso === state.end) cls.push("end");
        if (state.start && endPreview && iso > state.start && iso < endPreview) cls.push("in-range");
        if (state.start && endPreview && (iso === state.start)) cls.push("has-range");
        if (!state.end && iso === endPreview) cls.push("preview-end");
        var label = new Date(state.y, state.m, d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        html += '<button type="button" class="' + cls.join(" ") + '" data-d="' + iso + '"' + (dis ? " disabled" : "") +
          ' aria-label="' + label + '"' + (iso === state.start || iso === state.end ? ' aria-pressed="true"' : "") + ">" + d + "</button>";
      }
      grid.innerHTML = html;
      var nowM = new Date().getFullYear() * 12 + new Date().getMonth(), viewM = state.y * 12 + state.m;
      $('[data-nav="-1"]', root).disabled = viewM <= nowM;
      $('[data-nav="1"]', root).disabled = viewM >= nowM + 12;
      if (state.start && state.end) {
        var n = nightsBetween(state.start, state.end);
        status.textContent = n + (n === 1 ? " night" : " nights");
      } else status.textContent = state.start ? "Now pick your check-out date" : "Pick your check-in date";
      $("[data-v=in]", root).textContent = state.start ? niceDate(state.start) : "Add date";
      $("[data-v=out]", root).textContent = state.end ? niceDate(state.end) : "Add date";
      root.classList.toggle("has-in", !!state.start);
      root.classList.toggle("has-out", !!state.end);
      btns.forEach(function (b) { b.classList.toggle("is-active", root.classList.contains("open") && b.getAttribute("data-which") === state.picking); });
      inInput.value = state.start;
      outInput.value = state.end;
    }
    function open(which) {
      if (openSel) openSel.close(false);
      state.picking = which === "out" && state.start ? "out" : "in";
      var base = state.picking === "out" ? (state.end || state.start) : state.start;
      if (base) { var b = parseIso(base); state.y = b.getFullYear(); state.m = b.getMonth(); }
      root.classList.add("open");
      btns.forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
      render();
      document.addEventListener("pointerdown", outside, true);
      var target = $(".cal-day.start:not([disabled])", grid) || $(".cal-day.today", grid) || $(".cal-day:not([disabled])", grid);
      if (target) target.focus({ preventScroll: true });
    }
    function close(focusBtn) {
      root.classList.remove("open");
      btns.forEach(function (b) { b.setAttribute("aria-expanded", "false"); b.classList.remove("is-active"); });
      document.removeEventListener("pointerdown", outside, true);
      if (focusBtn) btns[state.picking === "out" ? 1 : 0].focus();
    }
    function outside(e) { if (!root.contains(e.target)) close(false); }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var w = b.getAttribute("data-which");
        if (root.classList.contains("open") && state.picking === w) close(false); else open(w);
      });
    });
    $all(".cal-nav", root).forEach(function (n) {
      n.addEventListener("click", function () {
        state.m += Number(n.getAttribute("data-nav"));
        if (state.m < 0) { state.m = 11; state.y--; }
        if (state.m > 11) { state.m = 0; state.y++; }
        render();
      });
    });
    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".cal-day");
      if (!b || b.disabled) return;
      var iso = b.getAttribute("data-d");
      if (state.picking === "in" || !state.start || (state.start && state.end && state.picking !== "out")) {
        state.start = iso; state.end = ""; state.picking = "out";
      } else if (iso <= state.start) {
        state.start = iso; state.end = "";
      } else {
        state.end = iso;
        render();
        setTimeout(function () { close(true); }, 260);
        return;
      }
      render();
      var again = $('.cal-day[data-d="' + iso + '"]', grid);
      if (again) again.focus({ preventScroll: true });
    });
    grid.addEventListener("pointerover", function (e) {
      var b = e.target.closest(".cal-day");
      if (!b || !state.start || state.end) return;
      var iso = b.getAttribute("data-d");
      if (iso !== state.hover) { state.hover = iso; render(); }
    });
    grid.addEventListener("keydown", function (e) {
      var b = e.target.closest(".cal-day");
      if (!b) return;
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return;
      e.preventDefault();
      var d = parseIso(b.getAttribute("data-d"));
      d.setDate(d.getDate() + step);
      var iso = isoOf(d);
      if (iso < today || iso > maxIso) return;
      if (d.getMonth() !== state.m || d.getFullYear() !== state.y) { state.y = d.getFullYear(); state.m = d.getMonth(); render(); }
      var nb = $('.cal-day[data-d="' + iso + '"]', grid);
      if (nb) nb.focus();
    });
    root.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("open")) { e.preventDefault(); close(true); } });
    $(".cal-clear", root).addEventListener("click", function () { state.start = ""; state.end = ""; state.hover = ""; state.picking = "in"; render(); });
    $(".cal-done", root).addEventListener("click", function () { close(true); });
    render();
  }

  /* ---------- guest stepper ---------- */
  function stepper(input, min) {
    var wrap = document.createElement("div");
    wrap.className = "stepper";
    input.parentNode.insertBefore(wrap, input);
    wrap.innerHTML = '<button type="button" data-s="-1" aria-label="Fewer guests">−</button>';
    wrap.appendChild(input);
    wrap.insertAdjacentHTML("beforeend", '<button type="button" data-s="1" aria-label="More guests">+</button>');
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-s]");
      if (!b) return;
      var v = parseInt(input.value, 10);
      if (isNaN(v)) v = b.getAttribute("data-s") === "1" ? (min || 1) - 1 : 0;
      v = v + Number(b.getAttribute("data-s"));
      if (v < 1) { input.value = ""; return; }
      input.value = Math.min(99, v);
    });
  }

  /* ---------- small toast ---------- */
  function toast(msg) {
    var t = $(".toast") || document.body.appendChild(Object.assign(document.createElement("div"), { className: "toast", role: "status" }));
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- pages ---------- */
  var pages = {};

  pages.home = function () {
    var heroIds = ["113", "110", "103", "105", "108", "101", "104", "111"];
    var heroVillas = heroIds.map(function (id) { return V.filter(function (v) { return v.id === id; })[0]; }).filter(Boolean);
    var hs = $("#hero-slider"), cap = $("#hero-caption");
    if (hs && heroVillas.length) {
      slider(hs, heroVillas.map(function (v) {
        var c = [cover(v), v.img].filter(function (u, i, a) { return a.indexOf(u) === i; });
        return { candidates: c, alt: villaName(v) + ", " + locLabel(v), href: villaUrl(v), title: villaName(v), sub: v.bhk + " BHK, " + locLabel(v) };
      }), {
        delay: 6000, minWidth: 0, label: "Featured villas",
        onChange: function (sl) {
          if (!cap) return;
          cap.classList.remove("in");
          void cap.offsetWidth;
          cap.href = sl.href;
          $("strong", cap).textContent = sl.title;
          $("span", cap).textContent = sl.sub;
          cap.classList.add("in");
        }
      });
    }
    var mq = $("#marquee");
    if (mq) {
      var mqCard = function (v, hidden) {
        var price = v.isPerPersonOffer ? money(v.ppPrice) + " per person" : "From " + money(v.priceWd) + " a night";
        return '<a class="mq-card" href="' + villaUrl(v) + '"' + (hidden ? ' tabindex="-1"' : "") + ">" +
          '<span class="mq-photo">' + img(cover(v), hidden ? "" : villaName(v) + ", " + locLabel(v), true) + '<span class="card-bhk">' + v.bhk + " BHK</span></span>" +
          '<span class="mq-name">' + esc(villaName(v)) + '</span><span class="mq-loc">' + esc(locLabel(v)) + '</span><span class="mq-price">' + price + "</span></a>";
      };
      var order = V.slice().sort(function (x, y) { return y.bhk - x.bhk; });
      mq.innerHTML = '<div class="marquee-track"><div class="marquee-group">' + order.map(function (v) { return mqCard(v); }).join("") +
        '</div><div class="marquee-group" aria-hidden="true">' + order.map(function (v) { return mqCard(v, true); }).join("") + "</div></div>";
    }
    var named = areas().filter(function (a) { return a.name !== OTHER; }).map(function (a) { return a.name; });
    $all("[data-count]").forEach(function (el) { el.textContent = V.length; });
    $all("[data-area-names]").forEach(function (el) {
      el.textContent = named.slice(0, 5).join(", ") + (named.length > 5 ? " and more" : "");
    });
    $all("[data-min-price]").forEach(function (el) { el.textContent = money(minNightly()); });
    $all("[data-bhk-range]").forEach(function (el) { var b = bhkList(); el.textContent = b[0] + " to " + b[b.length - 1]; });

    fillSelect($("#s-area"), areaOptions(), "Anywhere in Goa");
    fillSelect($("#s-bhk"), bhkOptions(), "Any size");
    enhanceAll($(".search"));

    var idx = $("#area-index");
    if (idx) idx.innerHTML = areas().map(function (a) {
      return '<li><a href="villas.html?area=' + encodeURIComponent(a.name) + '">' + esc(a.name) + "<sup>" + a.count + "</sup></a></li>";
    }).join("");

    var recent = $("#recent");
    if (recent) recent.innerHTML = V.filter(function (v) { return !v.isPerPersonOffer; }).slice(0, 6).map(function (v) { return card(v); }).join("");

    var o = V.filter(function (v) { return v.isPerPersonOffer; })[0];
    var offer = $("#offer");
    if (offer) {
      if (!o) { offer.remove(); }
      else {
        var op = photos(o);
        slider($("#offer-photo"), op.slice(0, 12).map(function (u, i) {
          return { candidates: [u], alt: villaName(o) + " photo " + (i + 1), href: villaUrl(o), title: "photo " + (i + 1) };
        }), { delay: 3800, minWidth: 0, label: villaName(o) + " photos" });
        $("#offer-title").textContent = "Coming with " + (o.minGuests || 10) + " or more? Stay at " + villaName(o) + " in " + areaOf(o) + ".";
        $("#offer-price").innerHTML = money(o.ppPrice) + "<small>per person</small>";
        var items = [o.bhk + " BHK private villa in " + locLabel(o)];
        if (o.foodPrice) items.push("Food package " + money(o.foodPrice) + " per person");
        if (o.minGuests) items.push("Minimum " + o.minGuests + " guests");
        if (o.extraGuestFee) items.push("Additional guest " + money(o.extraGuestFee) + " per person");
        $("#offer-list").innerHTML = items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
        $("#offer-link").href = villaUrl(o);
        $("#offer-link").textContent = "See " + villaName(o);
      }
    }
  };

  pages.villas = function () {
    var p = params();
    var form = $("#filters");
    var q = $("#f-q"), area = $("#f-area"), bhk = $("#f-bhk"), sort = $("#f-sort");
    fillSelect(area, areaOptions(), "All areas");
    fillSelect(bhk, bhkOptions(), "Any size");
    q.value = p.get("q") || p.get("search") || "";
    area.value = p.get("area") || "";
    bhk.value = p.get("bhk") || "";
    sort.value = p.get("sort") || "";
    enhanceAll(form);

    function run() {
      var term = q.value.trim().toLowerCase();
      var list = V.filter(function (v) {
        if (area.value && areaOf(v) !== area.value) return false;
        if (bhk.value && String(v.bhk) !== String(bhk.value)) return false;
        if (term && (v.title + " " + v.loc).toLowerCase().indexOf(term) === -1) return false;
        return true;
      });
      var s = sort.value;
      var price = function (v) { return v.isPerPersonOffer ? Infinity : Number(v.priceWd); };
      if (s === "price-asc") list.sort(function (a, b) { return price(a) - price(b); });
      if (s === "price-desc") list.sort(function (a, b) { return (b.isPerPersonOffer ? -1 : Number(b.priceWd)) - (a.isPerPersonOffer ? -1 : Number(a.priceWd)); });
      if (s === "bhk-desc") list.sort(function (a, b) { return b.bhk - a.bhk; });
      if (s === "bhk-asc") list.sort(function (a, b) { return a.bhk - b.bhk; });

      $("#result-count").textContent = list.length === V.length
        ? "Showing all " + V.length + " villas"
        : "Showing " + list.length + " of " + V.length + " villas";
      var grid = $("#villa-grid"), empty = $("#empty");
      grid.innerHTML = list.map(function (v, i) { return card(v, i < 3); }).join("");
      grid.hidden = list.length === 0;
      empty.hidden = list.length !== 0;

      var np = new URLSearchParams();
      if (q.value.trim()) np.set("q", q.value.trim());
      if (area.value) np.set("area", area.value);
      if (bhk.value) np.set("bhk", bhk.value);
      if (sort.value) np.set("sort", sort.value);
      var qs = np.toString();
      history.replaceState(null, "", "villas.html" + (qs ? "?" + qs : ""));
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    [area, bhk, sort].forEach(function (el) { el.addEventListener("change", run); });
    q.addEventListener("input", run);
    $all("[data-clear]").forEach(function (b) {
      b.addEventListener("click", function () { q.value = ""; area.value = ""; bhk.value = ""; sort.value = ""; [area, bhk, sort].forEach(function (x) { if (x._sync) x._sync(); }); run(); q.focus(); });
    });
    run();
  };

  pages.villa = function () {
    var id = params().get("id");
    var v = V.filter(function (x) { return x.id === id; })[0];
    var root = $("#villa");
    if (!v) {
      root.innerHTML = '<div class="wrap section"><div class="empty"><h1 class="display" style="font-size:2.2rem">This villa isn\'t listed</h1>' +
        '<p>The link may be old or the villa may have been removed.</p><a class="btn btn-primary" href="villas.html">See all villas in Goa</a></div></div>';
      return;
    }
    var name = villaName(v), loc = locLabel(v), list = photos(v);
    var labels = Array.isArray(v.photoAreas) ? v.photoAreas : [];
    var items = list.map(function (src, i) { return { src: src, label: labels[i] || "" }; });
    document.title = name + ", " + loc + " | " + S.name;
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", v.bhk + " BHK private villa in " + loc + ". Weekdays " + money(v.priceWd) + ", weekends " + money(v.priceWe) + ". Book on WhatsApp with " + S.name + ".");

    /* gallery mosaic */
    var shown = list.slice(0, 5);
    var mosaic = shown.map(function (src, i) {
      var more = (i === shown.length - 1 && list.length > shown.length) ? '<span class="more">+' + (list.length - shown.length) + " more photos</span>" : "";
      return '<button type="button" data-photo="' + i + '" aria-label="Open photo ' + (i + 1) + ' of ' + list.length + '">' + img(src, name + " photo " + (i + 1), i === 0) + more + "</button>";
    }).join("");

    var areaSection = "";
    if (labels.length) {
      var counts = {};
      labels.forEach(function (l) { counts[l] = (counts[l] || 0) + 1; });
      var names = Object.keys(counts);
      areaSection = '<section class="area-photos" aria-labelledby="area-h"><h2 id="area-h" class="display" style="font-size:1.6rem">Photos by room</h2>' +
        '<div class="chips" role="group" aria-label="Filter photos by room">' +
        '<button type="button" class="chip" data-area="" aria-pressed="true">All rooms<small>' + labels.length + "</small></button>" +
        names.map(function (n) { return '<button type="button" class="chip" data-area="' + esc(n) + '" aria-pressed="false">' + esc(n) + "<small>" + counts[n] + "</small></button>"; }).join("") +
        '</div><div class="area-grid">' +
        items.map(function (it, i) { return '<button type="button" data-photo="' + i + '" data-room="' + esc(it.label) + '">' + img(it.src, name + ", " + (it.label || "photo")) + "<span>" + esc(it.label || "Villa photo") + "</span></button>"; }).join("") +
        "</div></section>";
    }

    var offerNote = v.isPerPersonOffer
      ? '<p class="short-desc"><strong>Group package.</strong> ' + esc(v.desc || "") + (v.minGuests ? " Minimum " + v.minGuests + " guests required." : "") + "</p>"
      : (v.desc ? '<p class="short-desc">' + esc(v.desc) + "</p>" : "");

    var rates = v.isPerPersonOffer
      ? '<div class="rates one"><div><span>Group stay</span><strong>' + money(v.ppPrice) + "</strong><small>per person</small></div></div>"
      : '<div class="rates"><div><span>Weekday</span><strong>' + money(v.priceWd) + "</strong><small>Mon–Thu, per night</small></div>" +
        '<div class="we"><span>Weekend &amp; holiday</span><strong>' + money(v.priceWe) + "</strong><small>per night</small></div></div>" +
        '<p class="per-night">Prices are for the entire villa.</p>';
    var food = v.foodPrice ? '<div class="food"><strong>Food package ' + money(v.foodPrice) + " per person.</strong> " + esc(v.foodIncludes || "Meals") + " included.</div>" : "";
    var capLabel = v.minGuests ? "Minimum guests" : "Max capacity";
    var capValue = v.minGuests ? v.minGuests + " guests required" : sleeps(v) + " guests";

    var cancel = Array.isArray(v.cancellationPolicy) ? v.cancellationPolicy : [
      "Free cancellation 15 days or more before check-in.",
      "50% refund for cancellations made 7–14 days before check-in.",
      "No refund for cancellations made less than 7 days before check-in."
    ];

    var similar = V.filter(function (x) { return x.id !== v.id && areaOf(x) === areaOf(v); });
    V.slice().sort(function (a, b) { return Math.abs(a.bhk - v.bhk) - Math.abs(b.bhk - v.bhk); }).forEach(function (x) {
      if (x.id !== v.id && similar.indexOf(x) === -1) similar.push(x);
    });
    similar = similar.slice(0, 3);


    root.innerHTML =
      '<div class="wrap">' +
      '<div class="villa-head"><p class="crumbs"><a href="index.html">Home</a> / <a href="villas.html">Villas</a> / <a href="villas.html?area=' + encodeURIComponent(areaOf(v)) + '">' + esc(areaOf(v)) + "</a></p>" +
      "<h1>" + esc(name) + "</h1>" +
      '<ul class="facts"><li class="hl">' + v.bhk + " BHK</li><li>" + esc(loc) + "</li><li>" +
      (v.minGuests ? "Minimum " + v.minGuests + " guests" : "Sleeps " + sleeps(v) + " guests") + "</li><li>Entire villa</li>" +
      (v.isPerPersonOffer ? '<li class="hl">Group offer</li>' : "") + "</ul>" +
      '<button type="button" class="btn btn-ghost share-btn" id="share-btn">' + ICON.share + "Share</button></div>" +
      '<section aria-label="Photos" class="mosaic-wrap"><div class="mosaic' + (shown.length === 1 ? " n1" : "") + '">' + mosaic + "</div>" +
      '<button type="button" class="mosaic-all" data-photo="0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>Show all ' + list.length + " photos</button></section>" +
      areaSection +
      '<nav class="subnav" aria-label="On this page"><a href="#about">About</a><a href="#amenities">Amenities</a><a href="#rules">House rules</a><a href="#cancellation">Cancellation</a><a href="#book" class="subnav-book">Prices</a></nav>' +
      '<div class="villa-layout"><div>' +
      '<section class="block" id="about"><h2>About this villa</h2>' + offerNote + '<div class="prose">' +
      "<p>" + esc(name) + " is a " + v.bhk + "-bedroom private villa in " + esc(loc) + ". You get the whole place to yourselves, which makes it a good fit for families, friends and work trips.</p>" +
      "<p>Inside you'll find living areas with plenty of natural light, bedrooms with attached bathrooms and fresh linen, and a fully equipped kitchen and dining area. Outside there's a private swimming pool with a sun deck, lawn and outdoor seating for evenings together.</p>" +
      "<p>Our hospitality team takes care of the details, from in-villa dining to BBQ and bonfire setups, so you can enjoy a quiet weekend or a celebration without the planning.</p>" +
      "</div></section>" +
      '<section class="block" id="amenities"><h2>Amenities</h2><ul class="amenities">' +
      AMENITIES.map(function (a) { return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + AMENITY_ICONS[a] + "</svg>" + esc(a) + "</li>"; }).join("") +
      "</ul></section>" +
      '<section class="block" id="rules"><h2>House rules and policies</h2><div class="rules">' +
      "<div><h3>Check-in and check-out</h3><p>Check-in: " + esc(v.checkin || "1:00 PM") + "<br>Check-out: " + esc(v.checkout || "11:00 AM") + "</p><p style=\"margin-top:.4rem;color:var(--muted);font-size:.9rem\">Early check-in and late check-out subject to availability.</p></div>" +
      "<div><h3>Guest registration</h3><p>Valid government-issued photo ID is required for all guests at check-in." + (v.onlyIndianGuests ? " Only Indian guests are allowed." : "") + "</p></div>" +
      "<div><h3>Security deposit</h3><p>A security deposit of " + money(deposit(v)) + " is required. 100% refundable at check-out if there are no damages.</p></div>" +
      "<div><h3>Dining</h3><p>" + (v.foodPrice ? "Food package: " + money(v.foodPrice) + " per person. Includes " + esc(v.foodIncludes || "Meals") + "." : "In-house chef services available at additional cost. Please tell us about dietary needs in advance. Outside catering is also allowed.") + "</p></div>" +
      '<div class="wide"><h3>Guest policies</h3><ul>' +
      "<li>Outside food and beverages are allowed</li><li>Smoking only in designated outdoor areas</li><li>Pets are not allowed</li><li>No loud music or parties after 10:00 PM</li><li>Unregistered guests cannot stay overnight</li>" +
      (v.dateChangeNoPenalty ? "<li>Villa or date changes carry no penalty, subject to availability and full booking payment</li>" : "") +
      "</ul></div></div></section>" +
      '<section class="block" id="cancellation"><h2>Cancellation policy</h2><ul class="policy">' + cancel.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></section>" +
      "</div>" +
      '<aside class="book" id="book" aria-label="Prices and booking"><div class="tiles" aria-hidden="true"></div>' +
      '<div class="book-top">' + rates + "</div>" +
      '<form id="book-form" novalidate>' +
      '<div class="dates" id="dates"></div><input type="hidden" id="b-in"><input type="hidden" id="b-out">' +
      '<div class="field guests"><label for="b-guests">Guests</label><input id="b-guests" type="number" inputmode="numeric" min="1" max="99" placeholder="Add guests"></div>' +
      '<button class="btn btn-wa btn-block" type="submit">' + ICON.chat + "Ask on WhatsApp</button>" +
      '<p class="note">Opens WhatsApp with your dates filled in. Prefer to call? <a href="tel:+' + esc(S.whatsapp) + '">' + esc(S.whatsappDisplay) + "</a></p>" +
      "</form>" + food +
      "<dl><div><dt>Security deposit</dt><dd>" + money(deposit(v)) + " (refundable)</dd></div>" +
      "<div><dt>" + capLabel + "</dt><dd>" + capValue + "</dd></div>" +
      "<div><dt>Extra guest</dt><dd>" + money(extraGuest(v)) + " per person</dd></div></dl>" +
      "</aside></div>" +
      '<section class="section" aria-labelledby="sim-h"><div class="section-head"><h2 id="sim-h">More villas to compare</h2><a class="btn btn-ghost" href="villas.html">See all ' + V.length + " villas</a></div>" +
      '<div class="grid">' + similar.map(function (x) { return card(x); }).join("") + "</div></section>" +
      "</div>" +
      '<div class="mobile-book"><div><strong>' + (v.isPerPersonOffer ? money(v.ppPrice) : money(v.priceWd)) + "</strong><small>" +
      (v.isPerPersonOffer ? "per person" : "weekday, per night") + '</small></div><a class="btn btn-wa" target="_blank" rel="noopener" href="' + esc(waUrl(bookingText(v))) + '">' + ICON.chat + "Ask on WhatsApp</a></div>";
    document.body.classList.add("has-mobile-book");

    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-photo]");
      if (b) { lightbox(currentItems(), Number(b.getAttribute("data-photo")), name); return; }
      var c = e.target.closest("[data-area]");
      if (c) {
        var a = c.getAttribute("data-area");
        $all("[data-area]", root).forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
        $all(".area-grid [data-room]", root).forEach(function (x) { x.hidden = !!a && x.getAttribute("data-room") !== a; });
      }
    });
    function currentItems() { return items; }

    datePicker($("#dates"), $("#b-in"), $("#b-out"));
    stepper($("#b-guests"), v.minGuests || 1);
    $("#share-btn").addEventListener("click", function () {
      var url = window.location.href, t = name + ", " + loc + " | " + S.name;
      if (navigator.share) { navigator.share({ title: t, url: url }).catch(function () {}); return; }
      var done = function () { toast("Link copied"); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link", url); });
      else window.prompt("Copy this link", url);
    });
    var links = $all(".subnav a");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle("on", l.getAttribute("href") === "#" + en.target.id); });
        });
      }, { rootMargin: "-30% 0px -60% 0px" });
      ["about", "amenities", "rules", "cancellation"].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
    }

    $("#book-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var din = $("#b-in").value, dout = $("#b-out").value, g = $("#b-guests").value;
      var fmt = function (d) { return d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""; };
      var msg = "Hello " + S.name + "! I'm interested in booking " + v.title + " (" + v.loc + ").";
      if (din) msg += "\nCheck-in: " + fmt(din);
      if (dout) msg += "\nCheck-out: " + fmt(dout);
      if (g) msg += "\nGuests: " + g;
      msg += "\nPlease share availability and pricing. Thank you!";
      window.open(waUrl(msg), "_blank", "noopener");
    });
  };

  pages.gallery = function () {
    var chips = $("#gal-chips"), wrap = $("#gal-list");
    var as = areas();
    chips.innerHTML = '<button type="button" class="chip" data-gal="" aria-pressed="true">All areas<small>' + V.length + "</small></button>" +
      as.map(function (a) { return '<button type="button" class="chip" data-gal="' + esc(a.name) + '" aria-pressed="false">' + esc(a.name) + "<small>" + a.count + "</small></button>"; }).join("");
    wrap.innerHTML = V.map(function (v) {
      var list = photos(v);
      return '<section class="gal-villa" data-area="' + esc(areaOf(v)) + '"><header><div><h2>' + esc(villaName(v)) + "</h2><p>" + v.bhk + " BHK in " + esc(locLabel(v)) + ", " + list.length + " photos</p></div>" +
        '<a class="btn btn-ghost" href="' + villaUrl(v) + '">View villa</a></header>' +
        '<div class="strip">' + list.slice(0, 8).map(function (src, i) {
          return '<button type="button" data-v="' + esc(v.id) + '" data-i="' + i + '" aria-label="Open ' + esc(villaName(v)) + " photo " + (i + 1) + '">' + img(src, villaName(v) + " photo " + (i + 1)) + "</button>";
        }).join("") + "</div></section>";
    }).join("");
    chips.addEventListener("click", function (e) {
      var c = e.target.closest("[data-gal]");
      if (!c) return;
      var a = c.getAttribute("data-gal");
      $all("[data-gal]", chips).forEach(function (x) { x.setAttribute("aria-pressed", x === c ? "true" : "false"); });
      $all(".gal-villa", wrap).forEach(function (s) { s.hidden = !!a && s.getAttribute("data-area") !== a; });
    });
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-v]");
      if (!b) return;
      var v = V.filter(function (x) { return x.id === b.getAttribute("data-v"); })[0];
      var labels = v.photoAreas || [];
      lightbox(photos(v).map(function (src, i) { return { src: src, label: labels[i] || "" }; }), Number(b.getAttribute("data-i")), villaName(v));
    });
  };

  pages.about = function () {
    $all("[data-count]").forEach(function (el) { el.textContent = V.length; });
    $all("[data-area-total]").forEach(function (el) { el.textContent = areas().filter(function (a) { return a.name !== OTHER; }).length; });
    $all("[data-bhk-range]").forEach(function (el) { var b = bhkList(); el.textContent = b[0] + " to " + b[b.length - 1]; });
    var ap = $("#about-photos");
    if (ap) ap.innerHTML = ["108", "104", "93"].map(function (id) { return V.filter(function (v) { return v.id === id; })[0]; })
      .filter(Boolean).map(function (v) {
        return '<a href="' + villaUrl(v) + '" aria-label="' + esc(villaName(v)) + ", " + esc(locLabel(v)) + '">' + img(v.img, villaName(v)) + "</a>";
      }).join("");
  };

  pages.contact = function () {
    $("#c-wa").href = waUrl("Hello " + S.name + "!");
    $("#c-wa").textContent = S.whatsappDisplay;
    $("#c-mail").href = "mailto:" + S.email;
    $("#c-addr").textContent = S.address;
    $("#c-hours").innerHTML = S.hours.map(function (h) { return esc(h[0]) + ": <strong>" + esc(h[1]) + "</strong>"; }).join("<br>") +
      '<br><span style="color:var(--muted)">' + esc(S.hoursNote) + "</span>";
    var sel = $("#c-villa");
    fillSelect(sel, V.map(function (v) { return { value: v.title + " (" + v.loc + ")", label: villaName(v) + ", " + areaOf(v) + " (" + v.bhk + " BHK)" }; }), "Not sure yet");
    enhanceAll($("#contact-form"));
    $("#contact-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#c-name").value.trim(), msg = $("#c-msg").value.trim(), err = $("#c-error");
      if (!name || !msg) {
        err.hidden = false;
        err.textContent = !name ? "Add your name so we know who we're talking to." : "Write a short message, for example your dates and number of guests.";
        (!name ? $("#c-name") : $("#c-msg")).focus();
        return;
      }
      err.hidden = true;
      var text = "Hello " + S.name + "! My name is " + name + ".";
      var phone = $("#c-phone").value.trim(), email = $("#c-email").value.trim(), villa = sel.value;
      if (phone) text += "\nPhone: " + phone;
      if (email) text += "\nEmail: " + email;
      if (villa) text += "\nVilla: " + villa;
      text += "\n\n" + msg;
      window.open(waUrl(text), "_blank", "noopener");
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderChrome();
    var page = document.body.getAttribute("data-page");
    if (pages[page]) pages[page]();
  });
})();
