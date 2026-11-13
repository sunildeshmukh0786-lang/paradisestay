# Paradise Stay — Goa villa website

Simple static website (HTML + CSS + JS). No server, no database, no build step.

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `villas.html` | All villas with search, area, bedroom filters and sort |
| `villa.html?id=113` | One villa: photos, prices, rules, WhatsApp booking |
| `gallery.html` | Photos of every villa |
| `about.html` | About us |
| `contact.html` | Contact details + form that opens WhatsApp |

## Data kahan hai

Sab kuch ek file mein hai: `assets/js/data.js`

- `window.SITE` — brand name, WhatsApp number, email, address, office hours. Yahan badlo to poori site mein badal jayega.
- `window.VILLAS` — 22 Goa villas, purani site ke data se bina badlaav copy kiye hue.

Naya villa add karna ho to `VILLAS` list mein ek aur `{ ... }` block copy karke naya `id` do.

Photos abhi doosri websites ke links se aa rahi hain. Apni photos use karni ho to unhe `assets/img/villas/` folder mein daalo aur `img` / `gallery` mein path likho, jaise `"assets/img/villas/113-1.jpg"`.

Page titles (browser tab wala naam) har HTML file ke `<title>` mein likha hai — brand naam badlo to wahan bhi badal dena.

## Purane links

`villa-view.html`, `villa-list.html`, `about-us.html`, `contact-us.html`, `our-gallery.html` sirf purane links ko naye pages pe bhejte hain. Inhe delete mat karna, warna WhatsApp pe share kiye purane links tootenge.

`CNAME` mein domain `paradisestay.online` hai. Ise bhi delete mat karna.

## Live kaise karein

**Sabse fast (2 minute): Netlify Drop**
1. https://app.netlify.com/drop kholo
2. Ye poora `paradise-stay` folder drag karke drop karo
3. Link mil jayega. Baad mein apna domain Netlify settings mein jod sakte ho.

**GitHub Pages**
1. GitHub pe naya repo banao, jaise `paradise-stay`
2. "Add file → Upload files" se is folder ke andar ki saari files upload karo (`index.html` repo ke root mein hona chahiye)
3. Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)` → Save
4. 1–2 minute mein site `https://<username>.github.io/paradise-stay/` pe live
5. Custom domain ho to Settings → Pages → Custom domain mein daalo

## Local preview

```bash
python3 -m http.server 8080
```
Phir browser mein `http://localhost:8080` kholo.
