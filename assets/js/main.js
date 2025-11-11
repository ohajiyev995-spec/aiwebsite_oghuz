import { ROSTER } from "./roster.js";

const state = {
  openPopoverId: null,
  modalOpen: false,
  activeTrapElements: [],
};

document.addEventListener("DOMContentLoaded", () => {
  highlightActiveNav();
  initNavToggle();
  hydrateFeaturedFighter();
  initQuickBrowse();
  initGlobalDismiss();

  if (document.body.dataset.page === "divisions") {
    initDivisionFilters();
  }
});

function highlightActiveNav() {
  const current = document.body.dataset.page;
  const target = current === "fighter" ? "divisions" : current;
  document
    .querySelectorAll(".primary-nav [data-nav]")
    .forEach((link) => link.classList.toggle("active", link.dataset.nav === target));
}

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".primary-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.dataset.open = expanded ? "false" : "true";
    if (!expanded) {
      nav.querySelector("a")?.focus();
    } else {
      toggle.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.dataset.open === "true") {
      toggle.click();
    }
  });
}

function hydrateFeaturedFighter() {
  const featuredStrip = document.getElementById("featured-strip");
  if (!featuredStrip) return;

  const divisions = ROSTER.divisions.flatMap((division) =>
    division.fighters.map((fighter) => ({
      fighter,
      division,
    })),
  );

  const randomEntry = divisions[Math.floor(Math.random() * divisions.length)];
  if (!randomEntry) return;

  const { fighter, division } = randomEntry;
  const avatar = featuredStrip.querySelector(".featured-avatar");
  const meta = featuredStrip.querySelector(".featured-meta");
  const cta = featuredStrip.querySelector("a.button");

  if (avatar) {
    avatar.src = fighter.img;
    avatar.alt = `${fighter.name} portrait`;
    avatar.loading = "lazy";
  }

  if (meta) {
    meta.innerHTML = `
      <strong>${fighter.name}</strong>
      <span>${ordinal(fighter.rank)} in ${division.name} · Record ${fighter.record}</span>
    `;
  }

  if (cta) {
    cta.href = `fighters/${fighter.slug}.html`;
    cta.textContent = `View ${fighter.name}`;
  }
}

function initQuickBrowse() {
  const list = document.getElementById("quick-browse-list");
  if (!list) return;

  const fragment = document.createDocumentFragment();

  ROSTER.divisions.forEach((division) => {
    const item = document.createElement("div");
    item.className = "quick-browse__item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-browse__button";
    button.setAttribute("aria-haspopup", "dialog");
    button.dataset.divisionId = division.id;
    button.innerHTML = `
      <strong>${division.name}</strong><br />
      <span style="color: var(--color-muted); font-size: 0.85rem;">${division.weight}</span>
    `;

    const popover = createMiniRosterPopover(division);
    popover.id = `popover-${division.id}`;
    popover.setAttribute("aria-hidden", "true");

    button.addEventListener("click", () => {
      toggleQuickPopover(division.id, popover, button);
    });

    item.append(button, popover);
    fragment.append(item);
  });

  list.append(fragment);
}

function createMiniRosterPopover(division) {
  const popover = document.createElement("div");
  popover.className = "quick-browse__popover surface";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", `${division.name} fighters`);

  const wrapper = document.createElement("div");
  wrapper.className = "mini-roster";

  division.fighters.forEach((fighter) => {
    const row = document.createElement("div");
    row.className = "mini-roster__fighter";
    row.innerHTML = `
      <img src="${fighter.img}" alt="${fighter.name} portrait" loading="lazy" />
      <div>
        <strong>${fighter.name}</strong>
        <span class="rank">${ordinal(fighter.rank)} · ${fighter.record}</span>
      </div>
      <a class="button button-outline" href="fighters/${fighter.slug}.html">Open page</a>
    `;
    wrapper.append(row);
  });

  popover.append(wrapper);
  return popover;
}

function toggleQuickPopover(id, popover, trigger) {
  const isMobile = window.matchMedia("(max-width: 740px)").matches;

  if (isMobile) {
    openModalPopover(id, popover, trigger);
    return;
  }

  if (state.openPopoverId === id) {
    closeInlinePopover(id);
    trigger.focus();
    return;
  }

  if (state.openPopoverId) {
    closeInlinePopover(state.openPopoverId);
  }

  popover.setAttribute("aria-hidden", "false");
  state.openPopoverId = id;
}

function openModalPopover(id, popover, trigger) {
  const modal = document.getElementById("popover-modal");
  if (!modal) return;

  const title = modal.querySelector("#popover-title");
  const content = modal.querySelector("#popover-content");
  content.innerHTML = "";
  content.append(popover.cloneNode(true));

  const division = ROSTER.divisions.find((d) => d.id === id);
  if (division && title) {
    title.textContent = division.name;
  }

  modal.setAttribute("aria-hidden", "false");
  state.modalOpen = true;
  trapFocus(modal);

  const closeButtons = modal.querySelectorAll("[data-action='close-popover']");
  closeButtons.forEach((btn) => {
    btn.addEventListener(
      "click",
      () => {
        closeModalPopover(modal, trigger);
      },
      { once: true },
    );
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeModalPopover(modal, trigger);
      }
    },
    { once: true },
  );
}

function closeModalPopover(modal, trigger) {
  modal.setAttribute("aria-hidden", "true");
  releaseFocusTrap();
  state.modalOpen = false;
  trigger?.focus();
}

function trapFocus(container) {
  const focusableSelectors = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "[tabindex]:not([tabindex='-1'])",
  ];
  const focusable = Array.from(container.querySelectorAll(focusableSelectors.join(","))).filter(
    (el) => !el.hasAttribute("disabled"),
  );
  if (focusable.length === 0) return;

  state.activeTrapElements = [focusable[0], focusable[focusable.length - 1]];
  focusable[0].focus();

  container.addEventListener("keydown", handleTrapKey);
}

function handleTrapKey(event) {
  if (event.key !== "Tab") return;
  const [first, last] = state.activeTrapElements;
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function releaseFocusTrap() {
  const modal = document.getElementById("popover-modal");
  if (modal) {
    modal.removeEventListener("keydown", handleTrapKey);
  }
  state.activeTrapElements = [];
}

function initGlobalDismiss() {
  document.addEventListener("click", (event) => {
    if (!state.openPopoverId) return;
    const popover = document.getElementById(`popover-${state.openPopoverId}`);
    const trigger = document.querySelector(`[data-division-id='${state.openPopoverId}']`);
    if (popover && trigger && !popover.contains(event.target) && event.target !== trigger) {
      closeInlinePopover(state.openPopoverId);
      trigger?.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.openPopoverId) {
      const trigger = document.querySelector(`[data-division-id='${state.openPopoverId}']`);
      closeInlinePopover(state.openPopoverId);
      trigger?.focus();
    }
  });
}

function initDivisionFilters() {
  const filtersForm = document.getElementById("division-filters");
  const divisionGrid = document.getElementById("division-grid");
  const divisionCount = document.getElementById("division-count");
  const emptyState = document.getElementById("empty-state");
  const resetButton = document.querySelector("[data-action='reset-filters']");

  const render = () => {
    const filterValues = new FormData(filtersForm);
    const category = filterValues.get("category");
    const weight = filterValues.get("weight");
    const search = (filterValues.get("search") || "").toLowerCase().trim();

    const filtered = ROSTER.divisions.filter((division) => {
      if (category === "men" && !division.id.startsWith("mens-")) return false;
      if (category === "women" && !division.id.startsWith("womens-")) return false;

      if (weight !== "all") {
        const number = parseInt(division.weight, 10);
        if (Number.isFinite(number)) {
          if (weight === "light" && number > 145) return false;
          if (weight === "mid" && (number < 146 || number > 185)) return false;
          if (weight === "heavy" && number < 186) return false;
        }
      }

      if (search) {
        const matchDivision = division.name.toLowerCase().includes(search);
        const matchFighter = division.fighters.some((fighter) =>
          fighter.name.toLowerCase().includes(search),
        );
        if (!matchDivision && !matchFighter) return false;
      }

      return true;
    });

    divisionGrid.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.hidden = false;
      divisionCount.textContent = "No divisions displayed";
      return;
    }

    emptyState.hidden = true;

    const fragment = document.createDocumentFragment();

    filtered.forEach((division) => {
      const card = document.createElement("article");
      card.className = "division-card";
      card.setAttribute("role", "listitem");
      const bannerPath = `assets/img/divisions/${division.id}.webp`;
      card.innerHTML = `
        <figure class="division-card__banner">
          <img src="${bannerPath}" alt="${division.name} banner artwork" loading="lazy" />
        </figure>
        <header>
          <h3>${division.name}</h3>
          <span>${division.weight}</span>
        </header>
        <div class="division-fighters">
          ${division.fighters
            .map(
              (fighter) => `
                <article class="fighter-mini">
                  <img src="${fighter.img}" alt="${fighter.name} portrait" loading="lazy" />
                  <div>
                    <h4>${fighter.name}</h4>
                    <p class="meta">${ordinal(fighter.rank)} · Record ${fighter.record}</p>
                    <a class="button button-outline" href="fighters/${fighter.slug}.html">
                      Visit profile
                    </a>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      `;
      fragment.append(card);
    });

    divisionGrid.append(fragment);

    const fighterCount = filtered.reduce((acc, division) => acc + division.fighters.length, 0);
    divisionCount.textContent = `${filtered.length} divisions · ${fighterCount} fighters displayed`;
  };

  filtersForm.addEventListener("input", () => render());
  filtersForm.addEventListener("submit", (event) => event.preventDefault());
  resetButton?.addEventListener("click", () => {
    filtersForm.reset();
    render();
  });

  render();
}

function ordinal(rank) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = Math.abs(rank);
  const last = value % 100;
  if (last >= 11 && last <= 13) {
    return `${value}th`;
  }
  const suffix = suffixes[value % 10] || suffixes[0];
  return `${value}${suffix}`;
}

function closeInlinePopover(popId) {
  const popover = document.getElementById(`popover-${popId}`);
  if (popover) {
    popover.setAttribute("aria-hidden", "true");
  }
  if (state.openPopoverId === popId) {
    state.openPopoverId = null;
  }
}
