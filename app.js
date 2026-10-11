const PAGE_SIZE = 36;
const POPULAR_TAG_LIMIT = 14;

const elements = {
  search: document.querySelector("#gif-search"),
  gallery: document.querySelector("#gallery"),
  tagList: document.querySelector("#tag-list"),
  tagCount: document.querySelector("#tag-count"),
  allTagsButton: document.querySelector("#all-tags-button"),
  collectionCount: document.querySelector("#collection-count"),
  resultsTitle: document.querySelector("#results-title"),
  resultsDescription: document.querySelector("#results-description"),
  resultsCount: document.querySelector("#results-count"),
  emptyState: document.querySelector("#empty-state"),
  clearFilters: document.querySelector("#clear-filters"),
  loadMore: document.querySelector("#load-more"),
  randomButton: document.querySelector("#random-button"),
  randomDialog: document.querySelector("#random-dialog"),
  randomResult: document.querySelector("#random-result"),
  closeDialog: document.querySelector("#close-dialog"),
  toast: document.querySelector("#toast"),
  mediaNote: document.querySelector(".media-note"),
};

const state = {
  gifs: [],
  selectedTag: "All GIFs",
  query: "",
  visibleCount: PAGE_SIZE,
  allTagsVisible: false,
};

let toastTimer;

const icons = {
  markdown: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.25 3.75h6.5l4.5 4.5v11.5H7.25a1.5 1.5 0 0 1-1.5-1.5v-13a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M13.75 3.9v4.5h4.35M8.25 15.9v-3.3l1.4 1.45 1.4-1.45v3.3m2-3.3h1.15a1.65 1.65 0 0 1 0 3.3h-1.15v-3.3Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  link: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.8 14.2 14.2 9.8m-6.1 7.1-1.4 1.4a3.4 3.4 0 0 1-4.8-4.8l4-4a3.4 3.4 0 0 1 4.8 0m5.2-2 1.4-1.4a3.4 3.4 0 0 1 4.8 4.8l-4 4a3.4 3.4 0 0 1-4.8 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    </svg>`,
  external: `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13.5 5H19v5.5M19 5l-8 8m4-1v5.5A1.5 1.5 0 0 1 13.5 19h-8A1.5 1.5 0 0 1 4 17.5v-8A1.5 1.5 0 0 1 5.5 8H11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
};

function safeMarkdownLabel(value) {
  return value.replace(/[\\\[\]]/g, "\\$&");
}

function normalizeGif(entry, source) {
  const tags = Array.isArray(entry.tags)
    ? entry.tags.filter((tag) => typeof tag === "string" && tag.trim())
    : [];

  return {
    id: `${source}-${entry.id}`,
    name: entry.name || "Untitled GIF",
    tags,
    url: entry.url,
    preview: entry.smallUrl || entry.url,
    width: Number(entry.width) || 200,
    height: Number(entry.height) || 112,
    pageUrl: entry.sourceUrl || entry.url,
  };
}

function getFilteredGifs() {
  const query = state.query.toLowerCase();

  return state.gifs.filter((gif) => {
    const matchesTag =
      state.selectedTag === "All GIFs" || gif.tags.includes(state.selectedTag);
    const searchable = `${gif.name} ${gif.tags.join(" ")}`.toLowerCase();
    return matchesTag && searchable.includes(query);
  });
}

function createTagButton(tag, uses, active) {
  const button = document.createElement("button");
  button.className = `tag-button${active ? " is-active" : ""}`;
  button.type = "button";
  button.setAttribute("aria-pressed", String(active));
  button.addEventListener("click", () => selectTag(tag));

  const hash = document.createElement("span");
  hash.className = "tag-hash";
  hash.textContent = tag === "All GIFs" ? "" : "#";

  const label = document.createElement("span");
  label.className = "tag-label";
  label.textContent = tag;

  const count = document.createElement("span");
  count.className = "tag-uses";
  count.textContent = uses.toLocaleString();

  button.append(hash, label, count);
  return button;
}

function renderTags() {
  const frequencies = new Map();
  for (const gif of state.gifs) {
    for (const tag of gif.tags) {
      frequencies.set(tag, (frequencies.get(tag) || 0) + 1);
    }
  }

  const tags = [...frequencies.entries()].sort(
    ([nameA, usesA], [nameB, usesB]) =>
      usesB - usesA || nameA.localeCompare(nameB),
  );
  const shownTags = state.allTagsVisible
    ? tags
    : tags.slice(0, POPULAR_TAG_LIMIT);

  elements.tagList.replaceChildren(
    createTagButton("All GIFs", state.gifs.length, state.selectedTag === "All GIFs"),
    ...shownTags.map(([tag, uses]) =>
      createTagButton(tag, uses, state.selectedTag === tag),
    ),
  );

  elements.tagCount.textContent = tags.length.toLocaleString();
  elements.allTagsButton.hidden = tags.length <= POPULAR_TAG_LIMIT;
  elements.allTagsButton.textContent = state.allTagsVisible
    ? "Show popular tags"
    : `Show all ${tags.length} tags`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

async function copyText(value, successMessage) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const fallback = document.createElement("textarea");
      fallback.value = value;
      fallback.readOnly = true;
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.append(fallback);
      fallback.select();
      const copied = document.execCommand("copy");
      fallback.remove();
      if (!copied) throw new Error("Clipboard access is unavailable.");
    }
    showToast(successMessage);
  } catch (error) {
    console.error("Could not copy to clipboard:", error);
    showToast("Copy failed. Open the GIF and copy its address instead.");
  }
}

function createActionButton(label, icon, action) {
  const button = document.createElement("button");
  button.className = "gif-action";
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.innerHTML = icon;
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  });
  return button;
}

function createGifCard(gif) {
  const card = document.createElement("article");
  card.className = "gif-card";
  card.setAttribute("role", "listitem");
  card.dataset.gifId = gif.id;

  const media = document.createElement("div");
  media.className = "gif-media";

  const openLink = document.createElement("a");
  openLink.className = "gif-open-link";
  openLink.href = gif.url;
  openLink.target = "_blank";
  openLink.rel = "noreferrer";
  openLink.setAttribute("aria-label", `Open ${gif.name}`);

  const image = document.createElement("img");
  image.className = "gif-preview";
  image.src = gif.preview;
  image.alt = gif.name;
  image.loading = "lazy";
  image.decoding = "async";
  image.width = gif.width;
  image.height = gif.height;
  image.style.aspectRatio = `${gif.width} / ${gif.height}`;
  image.addEventListener("error", () => {
    const unavailable = document.createElement("span");
    unavailable.className = "preview-fallback";
    unavailable.textContent = "Preview unavailable — open the GIF to check its source.";
    openLink.replaceChildren(unavailable);
  }, { once: true });
  openLink.append(image);

  const actions = document.createElement("div");
  actions.className = "gif-actions";
  actions.setAttribute("aria-label", `Actions for ${gif.name}`);
  actions.append(
    createActionButton("Copy Markdown", icons.markdown, () =>
      copyText(
        `![${safeMarkdownLabel(gif.name)}](${gif.url})`,
        "Markdown copied",
      ),
    ),
    createActionButton("Copy GIF link", icons.link, () =>
      copyText(gif.url, "GIF link copied"),
    ),
  );

  const sourceLink = document.createElement("a");
  sourceLink.className = "gif-action";
  sourceLink.href = gif.pageUrl;
  sourceLink.target = "_blank";
  sourceLink.rel = "noreferrer";
  sourceLink.title = "Open GIF source";
  sourceLink.setAttribute("aria-label", `Open GIF source for ${gif.name}`);
  sourceLink.innerHTML = icons.external;
  actions.append(sourceLink);

  media.append(openLink, actions);

  const caption = document.createElement("div");
  caption.className = "gif-card-caption";
  const title = document.createElement("h3");
  title.className = "gif-title";
  title.textContent = gif.name;
  caption.append(title);

  if (gif.tags.length) {
    const tag = document.createElement("button");
    tag.className = "card-tag";
    tag.type = "button";
    tag.textContent = `# ${gif.tags[0]}`;
    tag.title = `Show GIFs tagged ${gif.tags[0]}`;
    tag.addEventListener("click", () => selectTag(gif.tags[0]));
    caption.append(tag);
  }

  card.append(media, caption);
  return card;
}

function render() {
  const filtered = getFilteredGifs();
  const visible = filtered.slice(0, state.visibleCount);
  elements.gallery.replaceChildren(...visible.map(createGifCard));

  elements.resultsTitle.textContent = state.selectedTag;
  elements.resultsDescription.textContent =
    state.selectedTag === "All GIFs"
      ? "Pick a tag or search by title to find the right reaction."
      : `GIFs tagged #${state.selectedTag}.`;
  elements.resultsCount.textContent =
    `${filtered.length.toLocaleString()} GIF${filtered.length === 1 ? "" : "s"}`;

  elements.emptyState.hidden = filtered.length > 0;
  elements.gallery.hidden = filtered.length === 0;
  elements.loadMore.hidden = visible.length >= filtered.length;
  if (!elements.loadMore.hidden) {
    const remaining = filtered.length - visible.length;
    elements.loadMore.textContent =
      `Load ${Math.min(PAGE_SIZE, remaining)} more GIF${remaining === 1 ? "" : "s"}`;
  }

  renderTags();
}

function selectTag(tag) {
  state.selectedTag = tag;
  state.visibleCount = PAGE_SIZE;
  render();
}

function clearFilters() {
  state.selectedTag = "All GIFs";
  state.query = "";
  state.visibleCount = PAGE_SIZE;
  elements.search.value = "";
  render();
  elements.search.focus();
}

async function loadCollection() {
  try {
    const [catalogResponse, extrasResponse] = await Promise.all([
      fetch("/data/lgtm-gifs.json"),
      fetch("/data/extra-gifs.json"),
    ]);
    if (!catalogResponse.ok || !extrasResponse.ok) {
      throw new Error(
        `Could not load the GIF data (${catalogResponse.status}/${extrasResponse.status}).`,
      );
    }

    const [catalog, extras] = await Promise.all([
      catalogResponse.json(),
      extrasResponse.json(),
    ]);
    const usableCatalog = catalog.filter((gif) => gif.url && gif.smallUrl);
    const missingMedia = catalog.length - usableCatalog.length;
    if (missingMedia > 0) {
      console.warn(`${missingMedia} source catalog entry has no GIF media and was skipped.`);
    }

    state.gifs = [
      ...usableCatalog.map((gif) => normalizeGif(gif, "lgtm")),
      ...extras.filter((gif) => gif.url && gif.smallUrl).map((gif) => normalizeGif(gif, "extra")),
    ];

    const tagCount = new Set(state.gifs.flatMap((gif) => gif.tags)).size;
    elements.collectionCount.textContent =
      `${state.gifs.length.toLocaleString()} GIFs · ${tagCount} tags`;
    elements.mediaNote.textContent =
      `${usableCatalog.length} catalog GIFs + ${state.gifs.length - usableCatalog.length} extra picks. One entry without a media URL is omitted. GIFs are hosted by GIPHY and belong to their respective owners.`;
    render();
  } catch (error) {
    console.error("The GIF collection could not be loaded:", error);
    elements.collectionCount.textContent = "The GIF collection could not be loaded.";
    elements.resultsDescription.textContent =
      "The catalog data did not load. Check the local data files and refresh the page.";
    elements.resultsCount.textContent = "";
    elements.gallery.textContent = "The collection is unavailable right now.";
    elements.tagList.replaceChildren();
    elements.emptyState.hidden = true;
    elements.loadMore.hidden = true;
    elements.mediaNote.textContent = "Refresh the page to try loading the collection again.";
  }
}

elements.search.addEventListener("input", () => {
  state.query = elements.search.value.trim();
  state.visibleCount = PAGE_SIZE;
  render();
});

elements.allTagsButton.addEventListener("click", () => {
  state.allTagsVisible = !state.allTagsVisible;
  renderTags();
});

elements.loadMore.addEventListener("click", () => {
  state.visibleCount += PAGE_SIZE;
  render();
});

elements.clearFilters.addEventListener("click", clearFilters);

elements.randomButton.addEventListener("click", () => {
  if (!state.gifs.length) return;
  const randomGif = state.gifs[Math.floor(Math.random() * state.gifs.length)];
  elements.randomResult.replaceChildren(createGifCard(randomGif));
  if (!elements.randomDialog.open) elements.randomDialog.showModal();
});

elements.closeDialog.addEventListener("click", () => {
  elements.randomDialog.close();
});

elements.randomDialog.addEventListener("click", (event) => {
  if (event.target === elements.randomDialog) elements.randomDialog.close();
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping =
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    elements.search.focus();
  }
});

loadCollection();
