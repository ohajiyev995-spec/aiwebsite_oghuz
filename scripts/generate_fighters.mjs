import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const FIGHTERS_DIR = path.join(ROOT, "fighters");
const FIGHTERS_IMG_DIR = path.join(ROOT, "assets", "img", "fighters");

const rosterModuleUrl = pathToFileURL(path.join(ROOT, "assets/js/roster.js")).href;
const { ROSTER } = await import(rosterModuleUrl);

await fs.mkdir(FIGHTERS_DIR, { recursive: true });

for (const division of ROSTER.divisions) {
  for (const fighter of division.fighters) {
    const html = buildPage({ fighter, division });
    const filePath = path.join(FIGHTERS_DIR, `${fighter.slug}.html`);
    await fs.writeFile(filePath, html, "utf8");
    console.log(`Generated fighters/${fighter.slug}.html`);
  }
}

function buildPage({ fighter, division }) {
  const socials = buildSocialLinks(fighter.socials ?? {});
  const notable = fighter.notableFights
    .map((fight) => `<li>${escapeHtml(fight)}</li>`)
    .join("\n                ");
  const galleryImages = getGalleryImages(fighter.slug);

  const gallery = galleryImages
    .map(
      (img, index) => `
              <figure>
                <img src="${img}" alt="${escapeHtml(fighter.name)} gallery image ${index + 1}" loading="lazy" />
              </figure>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(fighter.name)} | UFC: Two Per Division</title>
    <meta
      name="description"
      content="Profile for ${escapeHtml(fighter.name)}, ranked ${ordinal(fighter.rank)} in ${escapeHtml(
        division.name,
      )}. Stats, summary, notable fights, and imagery from UFC: Two Per Division."
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../assets/css/styles.min.css" />
    <link rel="stylesheet" href="../assets/css/overrides.css?v=1" />
  </head>
  <body data-page="fighter" data-fighter="${fighter.slug}">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="site-header" role="banner">
      <div class="site-header__inner">
        <a class="brand" href="../index.html" aria-label="UFC: Two Per Division home">
          <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
            <path
              d="M8 12 20 4h16l12 8v16l-12 8H20l-12-8z"
              fill="rgba(225,29,72,0.24)"
              stroke="#E11D48"
              stroke-width="2"
            ></path>
            <path
              d="m18 16 6-4h8l6 4v8l-6 4h-8l-6-4z"
              fill="rgba(14,165,233,0.32)"
              stroke="#0EA5E9"
              stroke-width="2"
            ></path>
          </svg>
          UFC: Two Per Division
        </a>

        <button
          type="button"
          class="nav-toggle"
          aria-expanded="false"
          aria-controls="primary-navigation"
        >
          <span aria-hidden="true"></span>
          <span class="sr-only">Toggle navigation</span>
        </button>

        <nav class="primary-nav" id="primary-navigation" aria-label="Primary">
          <ul>
            <li><a href="../index.html" data-nav="home">Home</a></li>
            <li><a href="../divisions.html" data-nav="divisions">Divisions</a></li>
            <li><a href="../about.html" data-nav="about">About</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="main-content">
      <section class="section page-header">
        <div class="container">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="../index.html">Home</a>
            <a href="../divisions.html">Divisions</a>
            <span aria-current="page">${escapeHtml(fighter.name)}</span>
          </nav>
          <div class="badge">${escapeHtml(division.name)}</div>
          <h1>${escapeHtml(fighter.name)}</h1>
          <p>${escapeHtml(fighter.summary)}</p>
          <a class="button button-outline" href="../divisions.html">Back to Divisions</a>
        </div>
      </section>

      <section class="section">
        <div class="container fighter-hero">
          <div class="fighter-hero__media">
            <img src="../${fighter.img}" alt="${escapeHtml(fighter.name)} hero portrait" />
          </div>
          <div class="fighter-meta">
            <h2>Overview</h2>
            <p>${escapeHtml(fighter.summary)}</p>
            <div class="stats-grid" aria-label="Fighter statistics">
              ${statCard("Record", fighter.record)}
              ${statCard("Stance", fighter.stance)}
              ${statCard("Height", fighter.height)}
              ${statCard("Reach", fighter.reach)}
              ${statCard("Nationality", fighter.nationality)}
              ${statCard("Primary Gym", fighter.gym)}
            </div>
            ${socials}
          </div>
        </div>
      </section>

      <section class="section section--tight">
        <div class="container">
          <h2>Notable fights</h2>
          <ul class="notable-fights">
            ${notable}
          </ul>
        </div>
      </section>

      <section class="section section--tight" aria-labelledby="gallery-title">
        <div class="container">
          <div class="section-title">
            <h2 id="gallery-title">Gallery</h2>
            <span>Moments from the ${escapeHtml(division.name)} contender</span>
          </div>
          <div class="gallery-grid">
            ${gallery}
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer" role="contentinfo">
      <div class="site-footer__inner">
        <div class="footer-top">
          <a class="brand" href="../index.html">
            <svg aria-hidden="true" viewBox="0 0 48 48" fill="none">
              <path
                d="M8 12 20 4h16l12 8v16l-12 8H20l-12-8z"
                fill="rgba(225,29,72,0.24)"
                stroke="#E11D48"
                stroke-width="2"
              ></path>
              <path
                d="m18 16 6-4h8l6 4v8l-6 4h-8l-6-4z"
                fill="rgba(14,165,233,0.32)"
                stroke="#0EA5E9"
                stroke-width="2"
              ></path>
            </svg>
            UFC: Two Per Division
          </a>
          <div class="footer-social" aria-label="Social media">
            <a
              href="https://www.linkedin.com/in/&#60;MY-USERNAME&#62;/"
              target="_blank"
              rel="noopener"
              aria-label="LinkedIn"
            >
              <span aria-hidden="true">in</span>
            </a>
            <a
              href="https://github.com/&#60;MY-USERNAME&#62;"
              target="_blank"
              rel="noopener"
              aria-label="GitHub"
            >
              <span aria-hidden="true">GH</span>
            </a>
            <a
              href="https://www.instagram.com/&#60;MY-USERNAME&#62;/"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
            >
              <span aria-hidden="true">IG</span>
            </a>
          </div>
        </div>
        <div class="footer-bottom">
          <nav class="footer-nav" aria-label="Footer">
            <a href="../index.html">Home</a>
            <a href="../divisions.html">Divisions</a>
            <a href="../about.html">About</a>
          </nav>
          <p class="disclaimer">
            Unofficial fan site for educational purposes. All rights belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>

    <script type="module" src="../assets/js/main.min.js"></script>
  </body>
</html>`;
}

function buildSocialLinks(socials) {
  const entries = Object.entries(socials).filter(([, url]) => Boolean(url));
  if (entries.length === 0) {
    return "";
  }

  const items = entries
    .map(
      ([platform, url]) =>
        `<a class="button button-outline" href="${url}" target="_blank" rel="noopener">${platform.toUpperCase()}</a>`,
    )
    .join("\n              ");

  return `
            <div class="pill-list" aria-label="Fighter social links">
              ${items}
            </div>`;
}

function statCard(label, value) {
  if (!value) return "";
  return `<div class="stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function ordinal(num) {
  const suffixes = ["th", "st", "nd", "rd"];
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  const suffix = suffixes[num % 10] ?? suffixes[0];
  return `${num}${suffix}`;
}

function getGalleryImages(slug) {
  const images = [];
  for (let idx = 1; idx <= 3; idx += 1) {
    const filename = `${slug}-${idx}.webp`;
    if (existsSync(path.join(FIGHTERS_IMG_DIR, filename))) {
      images.push(`../assets/img/fighters/${filename}`);
    }
  }
  return images;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
