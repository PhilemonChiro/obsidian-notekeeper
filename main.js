var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);
var obsidian = __toESM(require("obsidian"));
var VIEW_TYPE_CARDS = "keep-cards-view";
var COLORS = [
  { name: "Default", value: null },
  { name: "Coral", value: "#5c2b29" },
  { name: "Peach", value: "#614a19" },
  { name: "Sand", value: "#635d19" },
  { name: "Mint", value: "#345920" },
  { name: "Sage", value: "#16504b" },
  { name: "Fog", value: "#2d555e" },
  { name: "Storm", value: "#1e3a5f" },
  { name: "Dusk", value: "#42275e" },
  { name: "Blossom", value: "#5b2245" },
  { name: "Clay", value: "#442f19" },
  { name: "Chalk", value: "#3c3f43" }
];
var DEFAULT_SETTINGS = {
  notesFolder: "",
  previewLines: 10,
  density: "wall",
  colorAsBorder: false,
  tagColors: {},
  cardColors: {},
  pinnedFiles: {},
  archivedFiles: {},
  pinnedHeader: true,
  showImages: true,
  autoCollapseSidebars: true,
  sortMode: "mtime-desc",
  walls: {},
  currentWallId: null,
  wallBackground: "slate"
};
var SORT_LABELS = {
  "mtime-desc": "Modified \xB7 newest",
  "mtime-asc": "Modified \xB7 oldest",
  "ctime-desc": "Created \xB7 newest",
  "ctime-asc": "Created \xB7 oldest",
  "name-asc": "Title \xB7 A \u2192 Z",
  "name-desc": "Title \xB7 Z \u2192 A"
};
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}
function makeWallId() {
  return "w" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}
function isWallDensity(d) {
  return d === "wall" || d === "wall-compact";
}
function parseQuery(raw) {
  const parts = raw.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const out = { text: [], tag: [], color: null, path: null, pinned: null, archived: null };
  for (const p of parts) {
    const m = /^(\w+):(.+)$/.exec(p);
    if (!m) {
      out.text.push(p.replace(/^"|"$/g, "").toLowerCase());
      continue;
    }
    const k = m[1].toLowerCase();
    const v = m[2].replace(/^"|"$/g, "");
    if (k === "tag") out.tag.push(v.replace(/^#/, ""));
    else if (k === "color") out.color = v;
    else if (k === "path") out.path = v.toLowerCase();
    else if (k === "pinned") out.pinned = v === "true" || v === "yes";
    else if (k === "archived") out.archived = v === "true" || v === "yes";
    else if (k === "is") {
      if (v === "archived") out.archived = true;
      if (v === "pinned") out.pinned = true;
    } else out.text.push(p.toLowerCase());
  }
  return out;
}
function backlinksCount(app, file) {
  const links = app.metadataCache.resolvedLinks || {};
  let count = 0;
  for (const from in links) {
    if (links[from][file.path]) count++;
  }
  return count;
}
function findFirstImage(app, file, content) {
  let m = content.match(/!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]/);
  if (m) {
    const dest = app.metadataCache.getFirstLinkpathDest(m[1].trim(), file.path);
    if (dest && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(dest.path)) return dest;
  }
  m = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(/\s+/)[0].replace(/^<|>$/g, "");
    let dest = app.metadataCache.getFirstLinkpathDest(p, file.path);
    if (!dest) dest = app.vault.getAbstractFileByPath(p);
    if (dest && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(dest.path)) return dest;
  }
  return null;
}
function estimateHeight(file, fm, settings) {
  let h = 60;
  const sizeChars = file.stat.size;
  const lines = Math.min(settings.previewLines, Math.max(1, Math.ceil(sizeChars / 80)));
  h += lines * 19;
  if (fm && (fm.tags || fm.color)) h += 28;
  if (settings.showImages && /!\[/.test("")) h += 120;
  if (settings.density === "compact") h *= 0.75;
  return h;
}
async function renderMarkdownInto(app, content, el, sourcePath, component) {
  await obsidian.MarkdownRenderer.render(app, content, el, sourcePath, component);
}
function stripFrontmatter(raw) {
  const m = raw.match(/^---\n[\s\S]*?\n---\n?/);
  if (!m) return { front: "", body: raw };
  return { front: m[0], body: raw.slice(m[0].length) };
}
function tagsMatchTarget(tags, target) {
  if (!tags) return false;
  for (const t of tags) {
    const clean = t.replace(/^#/, "");
    if (clean === target) return true;
    if (clean.startsWith(target + "/")) return true;
  }
  return false;
}
var ColumnLayout = class {
  constructor(host) {
    this.host = host;
    this.columns = [];
    this.heights = [];
  }
  setColumnCount(n) {
    this.host.empty();
    this.columns = [];
    this.heights = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      this.columns.push(this.host.createDiv({ cls: "keep-col" }));
    }
  }
  add(card, estHeight) {
    let min = 0;
    for (let i = 1; i < this.heights.length; i++) {
      if (this.heights[i] < this.heights[min]) min = i;
    }
    this.columns[min].appendChild(card);
    this.heights[min] += (estHeight || 200) + 16;
  }
};
var KeepCardsPlugin = class extends obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.savedSidebarState = null;
  }
  async onload() {
    await this.loadSettings();
    this.savedSidebarState = null;
    this.registerView(VIEW_TYPE_CARDS, (leaf) => new CardsView(leaf, this));
    this.addRibbonIcon("layout-grid", "Open card view", () => this.activateView());
    this.addCommand({
      id: "open-cards-view",
      name: "Open card view",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "clear-wall",
      name: "Clear wall",
      callback: () => {
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARDS)[0]?.view;
        if (view instanceof CardsView) view.clearCurrentWall();
        else new obsidian.Notice("Open the card view first.");
      }
    });
    this.addCommand({
      id: "manage-labels",
      name: "Manage labels",
      callback: () => {
        const set = /* @__PURE__ */ new Set();
        const folder = (this.settings.notesFolder || "").trim();
        for (const f of this.app.vault.getMarkdownFiles()) {
          if (folder && !f.path.startsWith(folder + "/") && f.path !== folder) continue;
          const cache = this.app.metadataCache.getFileCache(f);
          if (!cache) continue;
          const tags = obsidian.getAllTags(cache);
          if (tags) tags.forEach((t) => set.add(t.replace(/^#/, "")));
        }
        new TagListModal(this.app, this, Array.from(set).sort()).open();
      }
    });
    this.addSettingTab(new KeepCardsSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => this.handleActiveLeafChange(leaf))
    );
    this.app.workspace.onLayoutReady(() => {
      this.handleActiveLeafChange(this.app.workspace.getActiveViewOfType(CardsView)?.leaf ?? null);
    });
  }
  onunload() {
    this.restoreSidebars();
  }
  handleActiveLeafChange(leaf) {
    if (!this.settings.autoCollapseSidebars) return;
    const isCards = this.leafIsCardsView(leaf);
    if (isCards && !this.savedSidebarState) {
      this.captureAndCollapse();
    } else if (!isCards && this.savedSidebarState) {
      this.restoreSidebars();
    }
  }
  leafIsCardsView(leaf) {
    if (!leaf || !leaf.view) return false;
    const view = leaf.view;
    if (typeof view.getViewType !== "function") return false;
    try {
      return view.getViewType() === VIEW_TYPE_CARDS;
    } catch {
      return false;
    }
  }
  captureAndCollapse() {
    const ws = this.app.workspace;
    this.savedSidebarState = {
      left: ws.leftSplit ? !!ws.leftSplit.collapsed : false,
      right: ws.rightSplit ? !!ws.rightSplit.collapsed : false
    };
    this.collapseSidebars();
  }
  collapseSidebars() {
    const apply = () => {
      const ws = this.app.workspace;
      try {
        if (ws.leftSplit && !ws.leftSplit.collapsed) ws.leftSplit.collapse();
      } catch {
      }
      try {
        if (ws.rightSplit && !ws.rightSplit.collapsed) ws.rightSplit.collapse();
      } catch {
      }
    };
    apply();
    window.setTimeout(apply, 60);
    window.setTimeout(apply, 240);
  }
  restoreSidebars() {
    if (!this.savedSidebarState) return;
    const { left, right } = this.savedSidebarState;
    this.savedSidebarState = null;
    const apply = () => {
      const ws = this.app.workspace;
      try {
        if (!left && ws.leftSplit && ws.leftSplit.collapsed) ws.leftSplit.expand();
      } catch {
      }
      try {
        if (!right && ws.rightSplit && ws.rightSplit.collapsed) ws.rightSplit.expand();
      } catch {
      }
    };
    apply();
    window.setTimeout(apply, 60);
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_CARDS)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE_CARDS, active: true });
    }
    await workspace.revealLeaf(leaf);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings(opts) {
    await this.saveData(this.settings);
    if (!opts || opts.refresh !== false) this.refreshViews();
  }
  refreshViews() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_CARDS).forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof CardsView) view.scheduleRender();
    });
  }
  // -------------------- walls --------------------
  createWall(name) {
    if (!this.settings.walls) this.settings.walls = {};
    const id = makeWallId();
    this.settings.walls[id] = { id, name, positions: {} };
    void this.saveData(this.settings);
    return id;
  }
};
var CardsView = class extends obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.query = "";
    this.parsedQuery = parseQuery("");
    this.filter = { type: "notes" };
    this.selection = /* @__PURE__ */ new Set();
    this.editing = null;
    this.focusedPath = null;
    this.lastClickedPath = null;
    this.debounceTimer = null;
    this.searchDebounce = null;
    this.layouts = /* @__PURE__ */ new Map();
    this.observer = null;
    this.resizeObs = null;
    this.cardComponents = /* @__PURE__ */ new Map();
    this.suppressEvents = 0;
    this.batches = [];
    this.batchObserver = null;
    this.batchSize = 60;
    this.activeModal = null;
    this.keydownHandler = null;
  }
  getViewType() {
    return VIEW_TYPE_CARDS;
  }
  getDisplayText() {
    return "Card view";
  }
  getIcon() {
    return "layout-grid";
  }
  onOpen() {
    this.render();
    const refresh = () => {
      if (this.suppressEvents > 0) {
        this.suppressEvents--;
        return;
      }
      this.scheduleRender();
    };
    this.registerEvent(this.app.vault.on("modify", refresh));
    this.registerEvent(this.app.vault.on("create", refresh));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      let dirty = false;
      for (const key of ["cardColors", "pinnedFiles", "archivedFiles"]) {
        const data = this.plugin.settings[key];
        if (data && data[file.path] !== void 0) {
          delete data[file.path];
          dirty = true;
        }
      }
      if (dirty) void this.plugin.saveData(this.plugin.settings);
      refresh();
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      let dirty = false;
      for (const key of ["cardColors", "pinnedFiles", "archivedFiles"]) {
        const data = this.plugin.settings[key];
        if (data && data[oldPath] !== void 0) {
          data[file.path] = data[oldPath];
          delete data[oldPath];
          dirty = true;
        }
      }
      if (dirty) void this.plugin.saveData(this.plugin.settings);
      refresh();
    }));
    this.registerEvent(this.app.metadataCache.on("changed", refresh));
    this.containerEl.tabIndex = -1;
    this.keydownHandler = (e) => this.handleKeydown(e);
    this.containerEl.addEventListener("keydown", this.keydownHandler);
    if (this.plugin && this.plugin.handleActiveLeafChange) {
      this.plugin.handleActiveLeafChange(this.leaf);
    }
    return Promise.resolve();
  }
  onClose() {
    if (this.observer) this.observer.disconnect();
    if (this.resizeObs) this.resizeObs.disconnect();
    if (this.batchObserver) this.batchObserver.disconnect();
    for (const c of this.cardComponents.values()) c.unload();
    this.cardComponents.clear();
    if (this.keydownHandler) this.containerEl.removeEventListener("keydown", this.keydownHandler);
    this.contentEl.empty();
    return Promise.resolve();
  }
  scheduleRender() {
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      void this.render();
    }, 200);
  }
  render() {
    if (this.observer) this.observer.disconnect();
    if (this.resizeObs) this.resizeObs.disconnect();
    if (this.batchObserver) this.batchObserver.disconnect();
    this.batches = [];
    for (const c of this.cardComponents.values()) c.unload();
    this.cardComponents.clear();
    this.layouts.clear();
    const container = this.contentEl;
    container.empty();
    container.addClass("keep-cards-root");
    const density = this.plugin.settings.density;
    container.toggleClass("density-compact", density === "compact" || density === "wall-compact");
    container.toggleClass("density-list", density === "list");
    container.toggleClass("density-wall", isWallDensity(density));
    const header = container.createDiv({ cls: "keep-cards-header" });
    const topRow = header.createDiv({ cls: "keep-cards-header-top" });
    this.renderSearch(topRow);
    this.renderActiveFilter(topRow);
    this.renderSortButton(topRow);
    this.renderArchiveToggle(topRow);
    this.renderToolbar(topRow);
    const captureRow = header.createDiv({ cls: "keep-cards-header-capture" });
    this.renderCapture(captureRow);
    const body = container.createDiv({ cls: "keep-cards-body" });
    const grid = body.createDiv({ cls: "keep-cards-grid" });
    const files = this.collectFiles();
    if (files.length === 0) {
      this.renderEmpty(grid);
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const card = entry.target;
            this.observer.unobserve(card);
            const path = card.dataset.path;
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file instanceof obsidian.TFile) {
              this.populateCard(card, file).catch((e) => console.error("populate failed", e));
            }
          }
        }
      },
      { root: grid, rootMargin: "300px" }
    );
    this.batchObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const batch = entry.target._batch;
            if (batch) this.renderNextBatch(batch);
          }
        }
      },
      { root: grid, rootMargin: "600px" }
    );
    if (isWallDensity(density)) {
      this.renderWallView(grid, files);
      this.attachResizeObserver(grid);
      this.renderBulkActions(container);
      return;
    }
    const colCount = this.computeColumnCount(grid.clientWidth || container.clientWidth || 1200);
    const pinned = files.filter((f) => this.isPinned(f));
    const others = files.filter((f) => !this.isPinned(f));
    const showSections = pinned.length > 0 && this.plugin.settings.pinnedHeader && this.plugin.settings.density !== "list" && this.filter.type !== "archive";
    if (showSections) {
      const pinSec = this.makeSection(grid, "PINNED");
      const pinLayout = new ColumnLayout(pinSec.cols);
      pinLayout.setColumnCount(colCount);
      this.layouts.set("pinned", pinLayout);
      pinned.sort((a, b) => this.pinOrderOf(a) - this.pinOrderOf(b));
      this.addBatch(pinSec.sec, pinLayout, pinned);
      if (others.length > 0) {
        const otherSec = this.makeSection(grid, "OTHERS");
        const otherLayout = new ColumnLayout(otherSec.cols);
        otherLayout.setColumnCount(colCount);
        this.layouts.set("others", otherLayout);
        this.addBatch(otherSec.sec, otherLayout, others);
      }
    } else {
      const sec = grid.createDiv({ cls: "keep-section" });
      const cols = sec.createDiv({ cls: "keep-section-cols" });
      const layout = new ColumnLayout(cols);
      layout.setColumnCount(colCount);
      this.layouts.set("all", layout);
      const ordered = files.slice();
      if (this.filter.type !== "archive") {
        const sortFn = this.getSortFn();
        ordered.sort((a, b) => {
          const pa = this.isPinned(a) ? 0 : 1;
          const pb = this.isPinned(b) ? 0 : 1;
          if (pa !== pb) return pa - pb;
          if (pa === 0) return this.pinOrderOf(a) - this.pinOrderOf(b);
          return sortFn(a, b);
        });
      }
      this.addBatch(sec, layout, ordered);
    }
    this.attachResizeObserver(grid);
    this.renderBulkActions(container);
  }
  renderCapture(header) {
    const wrap = header.createDiv({ cls: "keep-cards-capture-wrap" });
    const titleInput = wrap.createEl("input", {
      cls: "keep-cards-capture-title",
      attr: { type: "text", placeholder: "Title" }
    });
    const ta = wrap.createEl("textarea", {
      cls: "keep-cards-capture",
      attr: { placeholder: "Take a note\u2026", rows: "1" }
    });
    const actions = wrap.createDiv({ cls: "keep-cards-capture-actions" });
    const state = { willPin: false, color: null };
    const pinBtn = actions.createEl("button", {
      cls: "keep-cards-capture-action",
      attr: { type: "button", "aria-label": "Pin", title: "Pin" }
    });
    obsidian.setIcon(pinBtn, "pin");
    pinBtn.addEventListener("mousedown", (e) => e.preventDefault());
    pinBtn.addEventListener("click", () => {
      state.willPin = !state.willPin;
      pinBtn.toggleClass("is-active", state.willPin);
    });
    const colorBtn = actions.createEl("button", {
      cls: "keep-cards-capture-action",
      attr: { type: "button", "aria-label": "Color", title: "Color" }
    });
    obsidian.setIcon(colorBtn, "palette");
    colorBtn.addEventListener("mousedown", (e) => e.preventDefault());
    colorBtn.addEventListener("click", (e) => {
      const menu = new obsidian.Menu();
      for (const c of COLORS) {
        menu.addItem(
          (mi) => mi.setTitle(c.name).onClick(() => {
            state.color = c.value;
            if (c.value) {
              colorBtn.setCssStyles({ background: c.value, color: "var(--text-on-accent)" });
              wrap.setCssStyles({ background: c.value });
            } else {
              colorBtn.setCssStyles({ background: "", color: "" });
              wrap.setCssStyles({ background: "" });
            }
          })
        );
      }
      menu.showAtMouseEvent(e);
    });
    actions.createDiv({ cls: "keep-cards-capture-actions-spacer" });
    const discardBtn = actions.createEl("button", {
      cls: "keep-cards-capture-discard",
      text: "Discard",
      attr: { type: "button", title: "Discard (Esc)" }
    });
    discardBtn.addEventListener("mousedown", (e) => e.preventDefault());
    discardBtn.addEventListener("click", () => {
      reset();
      ta.blur();
    });
    const closeBtn = actions.createEl("button", {
      cls: "keep-cards-capture-close mod-cta",
      text: "Save",
      attr: { type: "button", title: "Save note (\u2318+Enter)" }
    });
    closeBtn.addEventListener("mousedown", (e) => e.preventDefault());
    const grow = () => {
      ta.setCssStyles({ height: "auto" });
      ta.setCssStyles({ height: `${Math.min(ta.scrollHeight, 240)}px` });
    };
    const reset = () => {
      titleInput.value = "";
      ta.value = "";
      state.willPin = false;
      state.color = null;
      pinBtn.removeClass("is-active");
      colorBtn.setCssStyles({ background: "", color: "" });
      wrap.setCssStyles({ background: "" });
      grow();
    };
    const submit = () => {
      const title = titleInput.value.trim();
      const body = ta.value;
      if (!body.trim() && !title) {
        ta.blur();
        return;
      }
      const opts = { title, pin: state.willPin, color: state.color };
      void this.captureNote(body, opts).then(() => {
        reset();
        ta.blur();
      });
    };
    closeBtn.addEventListener("click", () => submit());
    let blurTimer = null;
    wrap.addEventListener("focusout", () => {
      if (blurTimer) window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(() => {
        blurTimer = null;
        if (document.activeElement && wrap.contains(document.activeElement)) return;
        submit();
      }, 200);
    });
    wrap.addEventListener("focusin", () => {
      if (blurTimer) {
        window.clearTimeout(blurTimer);
        blurTimer = null;
      }
    });
    ta.addEventListener("input", grow);
    ta.addEventListener("focus", grow);
    ta.addEventListener("blur", () => {
      ta.setCssStyles({ height: "" });
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") {
        reset();
        ta.blur();
      }
    });
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        ta.focus();
      } else if (e.key === "Escape") {
        reset();
        titleInput.blur();
      }
    });
    ta.addEventListener("paste", (e) => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          void (async () => {
            try {
              const buf = await file.arrayBuffer();
              const ext = (item.type.split("/")[1] || "png").replace("jpeg", "jpg");
              const vaultAny = this.app.vault;
              const folder = vaultAny.getConfig && vaultAny.getConfig("attachmentFolderPath") || "";
              const safe = (folder || "").replace(/^\/+|\/+$/g, "");
              const name = `Pasted ${Date.now()}.${ext}`;
              const path = (safe ? safe + "/" : "") + name;
              await this.app.vault.createBinary(path, buf);
              ta.value = ta.value + `
![[${path}]]`;
              grow();
            } catch (err) {
              new obsidian.Notice("Paste failed: " + err.message);
            }
          })();
        }
      }
    });
  }
  renderSearch(header) {
    const wrap = header.createDiv({ cls: "keep-cards-search-wrap" });
    const icon = wrap.createSpan({ cls: "keep-cards-search-icon" });
    obsidian.setIcon(icon, "search");
    const search = wrap.createEl("input", {
      attr: { type: "text", placeholder: "Search notes", title: "Try: tag:foo  pinned:true  color:#5c2b29  path:inbox  is:archived" },
      cls: "keep-cards-search"
    });
    search.value = this.query;
    search.addEventListener("input", () => {
      this.query = search.value;
      this.parsedQuery = parseQuery(this.query);
      if (this.searchDebounce) window.clearTimeout(this.searchDebounce);
      this.searchDebounce = window.setTimeout(() => this.scheduleRender(), 150);
    });
  }
  // -------------------- wall switcher / view --------------------
  getOrCreateCurrentWall() {
    const settings = this.plugin.settings;
    if (!settings.walls) settings.walls = {};
    let id = settings.currentWallId;
    if (!id || !settings.walls[id]) {
      id = this.firstWallId() ?? this.plugin.createWall("Wall");
      settings.currentWallId = id;
    }
    return settings.walls[id];
  }
  firstWallId() {
    const keys = Object.keys(this.plugin.settings.walls || {});
    return keys.length ? keys[0] : null;
  }
  clearCurrentWall() {
    const wall = this.getOrCreateCurrentWall();
    new ConfirmModal(
      this.app,
      "Clear wall?",
      "Removes every note from the wall. The notes themselves are not deleted.",
      "Clear",
      () => {
        wall.positions = {};
        void this.plugin.saveData(this.plugin.settings);
        this.scheduleRender();
      }
    ).open();
  }
  renderWallView(grid, files) {
    const wall = this.getOrCreateCurrentWall();
    grid.addClass("is-wall");
    grid.addClass(`wall-${this.plugin.settings.wallBackground}`);
    const onWall = files.filter((f) => wall.positions[f.path]);
    if (onWall.length === 0) {
      this.renderWallEmptyState(grid, wall);
      return;
    }
    const sortFn = this.getSortFn();
    onWall.sort((a, b) => {
      const pa = this.isPinned(a) ? 0 : 1;
      const pb = this.isPinned(b) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      if (pa === 0) return this.pinOrderOf(a) - this.pinOrderOf(b);
      return sortFn(a, b);
    });
    const colCount = this.computeColumnCount(grid.clientWidth || 1200);
    const sec = grid.createDiv({ cls: "keep-section" });
    const cols = sec.createDiv({ cls: "keep-section-cols" });
    const layout = new ColumnLayout(cols);
    layout.setColumnCount(colCount);
    this.layouts.set("wall", layout);
    this.addBatch(sec, layout, onWall);
  }
  renderWallEmptyState(grid, wall) {
    const empty = grid.createDiv({ cls: "keep-wall-empty" });
    empty.createDiv({ cls: "keep-wall-empty-title", text: `"${wall.name}" is empty` });
    empty.createDiv({
      cls: "keep-wall-empty-sub",
      text: "Walls are curated. Add the notes you want pinned to this wall."
    });
    const row = empty.createDiv({ cls: "keep-wall-empty-actions" });
    const addBtn = row.createEl("button", {
      cls: "mod-cta",
      text: "Add notes\u2026",
      attr: { type: "button" }
    });
    addBtn.addEventListener("click", () => this.openAddToWallPicker(wall));
    const filterCount = this.collectFiles().length;
    if (filterCount > 0 && filterCount <= 200) {
      const fillBtn = row.createEl("button", {
        text: `Fill from current view (${filterCount})`,
        attr: { type: "button" }
      });
      fillBtn.addEventListener("click", () => this.fillWallFromCurrentFilter(wall));
    }
  }
  openAddToWallPicker(wall) {
    new WallAddNotesModal(this.app, this.plugin, wall, (file) => {
      wall.positions[file.path] = { x: 0, y: 0, rotation: 0, z: 0 };
      void this.plugin.saveData(this.plugin.settings);
      this.scheduleRender();
    }).open();
  }
  fillWallFromCurrentFilter(wall) {
    const files = this.collectFiles();
    for (const f of files) {
      if (!wall.positions[f.path]) {
        wall.positions[f.path] = { x: 0, y: 0, rotation: 0, z: 0 };
      }
    }
    void this.plugin.saveData(this.plugin.settings);
    this.scheduleRender();
  }
  removeFromCurrentWall(file) {
    const wall = this.getOrCreateCurrentWall();
    if (!wall.positions[file.path]) return;
    delete wall.positions[file.path];
    void this.plugin.saveData(this.plugin.settings);
    this.scheduleRender();
  }
  renderArchiveToggle(parent) {
    const isArchive = this.filter.type === "archive";
    const btn = parent.createEl("button", {
      cls: "keep-cards-sort-btn" + (isArchive ? " is-active" : ""),
      attr: {
        type: "button",
        "aria-label": isArchive ? "Showing archived notes" : "Show archived notes",
        title: isArchive ? "Showing archived notes \u2014 click to return" : "Show archived notes"
      }
    });
    obsidian.setIcon(btn, isArchive ? "archive-restore" : "archive");
    btn.addEventListener("click", () => {
      this.filter = isArchive ? { type: "notes" } : { type: "archive" };
      this.selection.clear();
      this.scheduleRender();
    });
  }
  renderActiveFilter(parent) {
    if (this.filter.type !== "tag") return;
    const chip = parent.createDiv({ cls: "keep-cards-active-filter" });
    chip.createSpan({ cls: "keep-cards-active-filter-label", text: "#" + this.filter.tag });
    const x = chip.createEl("button", {
      cls: "keep-cards-active-filter-x",
      attr: { type: "button", "aria-label": "Clear filter" }
    });
    obsidian.setIcon(x, "x");
    x.addEventListener("click", () => {
      this.filter = { type: "notes" };
      this.scheduleRender();
    });
  }
  renderSortButton(parent) {
    const current = this.plugin.settings.sortMode;
    const btn = parent.createEl("button", {
      cls: "keep-cards-sort-btn",
      attr: { type: "button", "aria-label": "Sort", title: "Sort: " + (SORT_LABELS[current] || "Modified \xB7 newest") }
    });
    obsidian.setIcon(btn, "arrow-up-down");
    btn.addEventListener("click", (e) => {
      const menu = new obsidian.Menu();
      for (const key of Object.keys(SORT_LABELS)) {
        menu.addItem(
          (mi) => mi.setTitle(SORT_LABELS[key]).setChecked(this.plugin.settings.sortMode === key).onClick(() => {
            this.plugin.settings.sortMode = key;
            void this.plugin.saveSettings();
          })
        );
      }
      menu.showAtMouseEvent(e);
    });
  }
  getSortFn() {
    switch (this.plugin.settings.sortMode) {
      case "mtime-asc":
        return (a, b) => a.stat.mtime - b.stat.mtime;
      case "ctime-desc":
        return (a, b) => b.stat.ctime - a.stat.ctime;
      case "ctime-asc":
        return (a, b) => a.stat.ctime - b.stat.ctime;
      case "name-asc":
        return (a, b) => a.basename.localeCompare(b.basename);
      case "name-desc":
        return (a, b) => b.basename.localeCompare(a.basename);
      case "mtime-desc":
      default:
        return (a, b) => b.stat.mtime - a.stat.mtime;
    }
  }
  renderToolbar(header) {
    const tb = header.createDiv({ cls: "keep-cards-toolbar" });
    const modes = [
      { v: "comfortable", icon: "layout-grid", label: "Comfortable" },
      { v: "compact", icon: "grid", label: "Compact" },
      { v: "list", icon: "list", label: "List" },
      { v: "wall", icon: "sticky-note", label: "Wall" },
      { v: "wall-compact", icon: "columns-3", label: "Wall (compact)" }
    ];
    for (const m of modes) {
      const btn = tb.createEl("button", {
        cls: "keep-cards-tb-btn",
        attr: { type: "button", "aria-label": m.label, title: m.label }
      });
      obsidian.setIcon(btn, m.icon);
      if (this.plugin.settings.density === m.v) btn.addClass("is-active");
      btn.addEventListener("click", () => {
        this.plugin.settings.density = m.v;
        void this.plugin.saveSettings();
      });
    }
  }
  renderSidebar(sidebar) {
    const items = [
      { label: "Notes", icon: "lightbulb", filter: { type: "notes" } },
      { label: "Archive", icon: "archive", filter: { type: "archive" } }
    ];
    for (const it of items) this.makeSidebarItem(sidebar, it.icon, it.label, it.filter);
    const tags = this.collectTags();
    if (tags.length > 0) {
      sidebar.createDiv({ cls: "keep-sidebar-divider" });
      const heading = sidebar.createDiv({ cls: "keep-sidebar-heading" });
      heading.createSpan({ text: "LABELS" });
      const editBtn = heading.createEl("button", {
        cls: "keep-sidebar-edit",
        attr: { type: "button", "aria-label": "Edit labels", title: "Edit labels" }
      });
      obsidian.setIcon(editBtn, "pencil");
      editBtn.addEventListener("click", () => {
        new TagListModal(this.app, this.plugin, tags).open();
      });
      for (const tag of tags) this.makeSidebarItem(sidebar, "tag", tag, { type: "tag", tag });
    }
  }
  makeSidebarItem(parent, icon, label, filter) {
    const row = parent.createDiv({ cls: "keep-sidebar-item" });
    if (this.isActive(filter)) row.addClass("is-active");
    const iconEl = row.createSpan({ cls: "keep-sidebar-icon" });
    obsidian.setIcon(iconEl, icon);
    if (filter.type === "tag") {
      const color = this.plugin.settings.tagColors[filter.tag];
      if (color) {
        const dot = row.createSpan({ cls: "keep-sidebar-color-dot" });
        dot.setCssStyles({ background: color });
      }
    }
    row.createSpan({ cls: "keep-sidebar-label", text: label });
    if (filter.type === "tag") {
      const more = row.createEl("button", {
        cls: "keep-sidebar-more",
        attr: { type: "button", "aria-label": "More" }
      });
      obsidian.setIcon(more, "more-horizontal");
      more.addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = new obsidian.Menu();
        menu.addItem(
          (mi) => mi.setTitle("Rename label").setIcon("pencil").onClick(() => {
            new TagRenameModal(this.app, this.plugin, filter.tag).open();
          })
        );
        menu.addItem(
          (mi) => mi.setTitle("Set label color").setIcon("palette").onClick(() => {
            new TagColorModal(this.app, this.plugin, filter.tag).open();
          })
        );
        menu.showAtMouseEvent(e);
      });
    }
    row.addEventListener("click", () => {
      this.filter = filter;
      this.selection.clear();
      this.scheduleRender();
    });
    row.addEventListener("dragover", (e) => {
      if (filter.type === "tag") {
        e.preventDefault();
        row.addClass("is-drop-target");
      }
    });
    row.addEventListener("dragleave", () => row.removeClass("is-drop-target"));
    row.addEventListener("drop", async (e) => {
      row.removeClass("is-drop-target");
      if (filter.type !== "tag") return;
      e.preventDefault();
      const path = e.dataTransfer.getData("application/x-obsidian-path");
      if (!path) return;
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof obsidian.TFile)) return;
      await this.addTagToFile(file, filter.tag);
    });
  }
  isActive(f) {
    if (f.type !== this.filter.type) return false;
    if (f.type === "tag" && this.filter.type === "tag") return f.tag === this.filter.tag;
    return true;
  }
  collectTags() {
    const set = /* @__PURE__ */ new Set();
    const folder = this.plugin.settings.notesFolder.trim();
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (folder && !f.path.startsWith(folder + "/") && f.path !== folder) continue;
      const cache = this.app.metadataCache.getFileCache(f);
      if (!cache) continue;
      const tags = obsidian.getAllTags(cache);
      if (tags) tags.forEach((t) => set.add(t.replace(/^#/, "")));
    }
    return Array.from(set).sort();
  }
  collectFiles() {
    const folder = this.plugin.settings.notesFolder.trim();
    const cache = this.app.metadataCache;
    const q = this.parsedQuery;
    const files = this.app.vault.getMarkdownFiles().filter((f) => {
      if (folder && !f.path.startsWith(folder + "/") && f.path !== folder) return false;
      const fc = cache.getFileCache(f);
      const fm = fc && fc.frontmatter;
      const archived = this.isArchived(f);
      if (this.filter.type === "archive") {
        if (!archived) return false;
      } else {
        if (archived) return false;
      }
      if (this.filter.type === "tag") {
        const tags = fc ? obsidian.getAllTags(fc) : null;
        if (!tagsMatchTarget(tags, this.filter.tag)) return false;
      }
      if (q.tag.length > 0) {
        const tags = fc ? obsidian.getAllTags(fc) : null;
        for (const t of q.tag) {
          if (!tagsMatchTarget(tags, t)) return false;
        }
      }
      if (q.color !== null) {
        const dataColor = (this.plugin.settings.cardColors || {})[f.path];
        const effective = (dataColor !== void 0 ? dataColor : fm && fm.color) || "";
        if (String(effective).toLowerCase() !== q.color.toLowerCase()) return false;
      }
      if (q.path !== null) {
        if (!f.path.toLowerCase().includes(q.path)) return false;
      }
      if (q.pinned !== null) {
        if (q.pinned !== this.isPinned(f)) return false;
      }
      if (q.archived !== null) {
        if (q.archived !== archived) return false;
      }
      if (q.text.length > 0) {
        const hay = (f.basename + " " + f.path).toLowerCase();
        for (const t of q.text) {
          if (!hay.includes(t)) return false;
        }
      }
      return true;
    });
    files.sort(this.getSortFn());
    return files;
  }
  isPinned(file) {
    const data = this.plugin.settings.pinnedFiles || {};
    if (data[file.path] !== void 0) return data[file.path] !== false;
    const fc = this.app.metadataCache.getFileCache(file);
    return !!(fc && fc.frontmatter && fc.frontmatter.pinned);
  }
  isArchived(file) {
    const data = this.plugin.settings.archivedFiles || {};
    if (data[file.path] !== void 0) return data[file.path] !== false;
    const fc = this.app.metadataCache.getFileCache(file);
    return !!(fc && fc.frontmatter && fc.frontmatter.archived);
  }
  pinOrderOf(file) {
    const data = this.plugin.settings.pinnedFiles || {};
    const v = data[file.path];
    if (typeof v === "number") return v;
    const fc = this.app.metadataCache.getFileCache(file);
    const fmv = fc && fc.frontmatter && fc.frontmatter.pinOrder;
    if (typeof fmv === "number") return fmv;
    return Number.MAX_SAFE_INTEGER;
  }
  makeSection(grid, label) {
    const sec = grid.createDiv({ cls: "keep-section" });
    sec.createDiv({ cls: "keep-section-header", text: label });
    const cols = sec.createDiv({ cls: "keep-section-cols" });
    return { sec, cols };
  }
  addBatch(host, layout, files) {
    if (files.length === 0) return;
    const batch = { host, layout, files, renderedIndex: 0, sentinel: null };
    this.batches.push(batch);
    this.renderNextBatch(batch);
  }
  renderNextBatch(batch) {
    const { host, layout, files } = batch;
    const start = batch.renderedIndex;
    const end = Math.min(start + this.batchSize, files.length);
    for (let i = start; i < end; i++) {
      this.addSkeleton(layout, files[i]);
    }
    batch.renderedIndex = end;
    if (batch.sentinel) {
      this.batchObserver.unobserve(batch.sentinel);
      batch.sentinel.remove();
      batch.sentinel = null;
    }
    if (end < files.length) {
      const sentinel = host.createDiv({ cls: "keep-batch-sentinel" });
      sentinel._batch = batch;
      this.batchObserver.observe(sentinel);
      batch.sentinel = sentinel;
    }
  }
  computeColumnCount(width) {
    const d = this.plugin.settings.density;
    if (d === "list") return 1;
    if (d === "compact" || d === "wall-compact") {
      if (width < 600) return 1;
      if (width < 900) return 3;
      if (width < 1200) return 4;
      if (width < 1600) return 5;
      return 6;
    }
    if (width < 700) return 1;
    if (width < 1e3) return 2;
    if (width < 1400) return 3;
    return 4;
  }
  attachResizeObserver(grid) {
    let lastCols = this.computeColumnCount(grid.clientWidth);
    this.resizeObs = new ResizeObserver(() => {
      const c = this.computeColumnCount(grid.clientWidth);
      if (c !== lastCols) {
        lastCols = c;
        this.scheduleRender();
      }
    });
    this.resizeObs.observe(grid);
  }
  renderEmpty(grid) {
    const empty = grid.createDiv({ cls: "keep-cards-empty" });
    const ic = empty.createDiv({ cls: "keep-empty-icon" });
    obsidian.setIcon(ic, "sticky-note");
    empty.createDiv({ cls: "keep-empty-title", text: "No notes here" });
    empty.createDiv({
      cls: "keep-empty-sub",
      text: this.query ? "Try a different search." : this.filter.type === "archive" ? "Archived notes will appear here." : this.filter.type === "tag" ? "No notes with this label yet." : "Type a note above to get started."
    });
  }
  // -------------------- skeleton + populate --------------------
  addSkeleton(layout, file) {
    const fc = this.app.metadataCache.getFileCache(file);
    const fm = fc && fc.frontmatter;
    const card = createDiv({ cls: "keep-card is-skeleton" });
    card.dataset.path = file.path;
    if (this.selection.has(file.path)) card.addClass("is-selected");
    if (this.editing === file.path) card.addClass("is-editing-card");
    const dataColor = (this.plugin.settings.cardColors || {})[file.path];
    const fmColor = fm && fm.color;
    const cardColor = dataColor !== void 0 ? dataColor : fmColor;
    if (cardColor) {
      if (this.plugin.settings.colorAsBorder) {
        card.setCssStyles({ borderLeft: `4px solid ${String(cardColor)}` });
      } else {
        card.setCssStyles({ background: String(cardColor) });
      }
    } else {
      const tags = fc ? obsidian.getAllTags(fc) : null;
      if (tags) {
        for (const t of tags) {
          const c = this.plugin.settings.tagColors[t.replace(/^#/, "")];
          if (c) {
            if (this.plugin.settings.colorAsBorder) card.setCssStyles({ borderLeft: `4px solid ${c}` });
            else card.setCssStyles({ background: c });
            break;
          }
        }
      }
    }
    if (this.isPinned(file)) card.addClass("keep-card--pinned");
    const cb = card.createEl("input", {
      cls: "keep-card-checkbox",
      attr: { type: "checkbox", "aria-label": "Select note" }
    });
    if (this.selection.has(file.path)) cb.checked = true;
    cb.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSelection(file.path, e.shiftKey);
    });
    card.createDiv({ cls: "keep-card-title", text: file.basename });
    const body = card.createDiv({ cls: "keep-card-body" });
    for (let i = 0; i < 3; i++) body.createDiv({ cls: "keep-shimmer" });
    card.draggable = true;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/x-obsidian-path", file.path);
      e.dataTransfer.setData("text/plain", file.basename);
      card.addClass("is-dragging");
    });
    card.addEventListener("dragend", () => card.removeClass("is-dragging"));
    if (this.isPinned(file)) {
      card.addEventListener("dragover", (e) => {
        const path = e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes("application/x-obsidian-path");
        if (!path) return;
        e.preventDefault();
        card.addClass("is-drop-target");
      });
      card.addEventListener("dragleave", () => card.removeClass("is-drop-target"));
      card.addEventListener("drop", (e) => {
        card.removeClass("is-drop-target");
        const fromPath = e.dataTransfer?.getData("application/x-obsidian-path");
        if (!fromPath || fromPath === file.path) return;
        const fromFile = this.app.vault.getAbstractFileByPath(fromPath);
        if (!(fromFile instanceof obsidian.TFile)) return;
        if (!this.isPinned(fromFile)) return;
        e.preventDefault();
        void this.swapPinOrder(fromFile, file);
      });
    }
    card.addEventListener("click", (e) => {
      const target = e.target;
      if (target.closest("input, button, a, .keep-card-editor, .keep-color-picker")) return;
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        this.toggleSelection(file.path, e.shiftKey);
        return;
      }
      this.openNotePreview(file);
    });
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.openContextMenu(e, file);
    });
    if (isWallDensity(this.plugin.settings.density)) {
      const seed = hashString(file.path);
      const rot = seed % 7 - 3;
      card.setCssStyles({ transform: `rotate(${rot}deg)` });
      card.addClass("is-wall-card");
    }
    layout.add(card, estimateHeight(file, fm, this.plugin.settings));
    this.observer.observe(card);
  }
  async populateCard(card, file) {
    const fc = this.app.metadataCache.getFileCache(file);
    const settings = this.plugin.settings;
    card.removeClass("is-skeleton");
    const oldBody = card.querySelector(".keep-card-body");
    if (oldBody) oldBody.empty();
    let raw = "";
    try {
      raw = await this.app.vault.cachedRead(file);
    } catch {
      raw = "";
    }
    const { body: stripped } = stripFrontmatter(raw);
    if (settings.showImages) {
      const img = findFirstImage(this.app, file, stripped);
      if (img) {
        const url = this.app.vault.getResourcePath(img);
        const imgEl = createEl("img", { cls: "keep-card-image" });
        imgEl.src = url;
        imgEl.loading = "lazy";
        const titleEl = card.querySelector(".keep-card-title");
        card.insertBefore(imgEl, titleEl);
      }
    }
    const bodyEl = card.querySelector(".keep-card-body");
    if (!bodyEl) return;
    if (this.editing === file.path) {
      this.mountEditor(bodyEl, file, raw);
    } else {
      const previewLines = settings.previewLines;
      const lines = stripped.split("\n");
      const cap = lines.slice(0, previewLines * 4).join("\n");
      const comp = new obsidian.Component();
      comp.load();
      this.cardComponents.set(file.path, comp);
      try {
        await renderMarkdownInto(this.app, cap, bodyEl, file.path, comp);
      } catch {
        bodyEl.setText(stripped.split("\n").slice(0, previewLines).join("\n"));
      }
      this.wireCheckboxes(bodyEl, file);
      this.clampBody(bodyEl, previewLines);
    }
    const tags = fc ? obsidian.getAllTags(fc) : null;
    if (tags && tags.length > 0) {
      const tagsEl = card.createDiv({ cls: "keep-card-tags" });
      for (const t of tags) {
        const chip = tagsEl.createSpan({ cls: "keep-card-tag", text: t });
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          this.filter = { type: "tag", tag: t.replace(/^#/, "") };
          this.scheduleRender();
        });
      }
    }
    const meta = card.createDiv({ cls: "keep-card-meta" });
    const bl = backlinksCount(this.app, file);
    if (bl > 0) {
      const badge = meta.createSpan({ cls: "keep-card-backlinks", attr: { title: bl + " backlink" + (bl === 1 ? "" : "s") } });
      const bicon = badge.createSpan({ cls: "keep-card-backlinks-icon" });
      obsidian.setIcon(bicon, "links-coming-in");
      badge.createSpan({ text: String(bl) });
    }
    const isPinnedNow = this.isPinned(file);
    const isArchivedNow = this.isArchived(file);
    const actions = card.createDiv({ cls: "keep-card-actions" });
    this.makeAction(
      actions,
      isPinnedNow ? "pin-off" : "pin",
      isPinnedNow ? "Unpin" : "Pin",
      async () => {
        await this.togglePinned(file);
      }
    );
    this.makeAction(actions, "pencil", "Edit", () => {
      this.beginEdit(file);
    });
    this.makeAction(actions, "palette", "Color", () => {
      this.toggleColorPicker(card, file);
    });
    this.makeAction(
      actions,
      isArchivedNow ? "archive-restore" : "archive",
      isArchivedNow ? "Unarchive" : "Archive",
      async () => {
        await this.toggleArchived(file);
      }
    );
  }
  clampBody(bodyEl, lines) {
    bodyEl.setCssStyles({ maxHeight: `${lines * 1.5}em`, overflow: "hidden" });
  }
  wireCheckboxes(bodyEl, file) {
    const boxes = bodyEl.querySelectorAll("input[type=checkbox]");
    boxes.forEach((cb, i) => {
      cb.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          const raw = await this.app.vault.read(file);
          let n = 0;
          const updated = raw.replace(/^(\s*[-*+] \[)( |x|X)(\])/gm, (m, open, mark, close) => {
            if (n++ === i) return open + (mark === " " ? "x" : " ") + close;
            return m;
          });
          this.suppressEvents++;
          await this.app.vault.modify(file, updated);
        } catch (err) {
          new obsidian.Notice("Could not toggle checkbox: " + err.message);
        }
      });
    });
  }
  makeAction(parent, icon, label, handler) {
    const btn = parent.createEl("button", {
      cls: "keep-card-action",
      attr: { "aria-label": label, type: "button", title: label }
    });
    obsidian.setIcon(btn, icon);
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await handler();
    });
  }
  // -------------------- note preview --------------------
  openNotePreview(file) {
    const modal = new NotePreviewModal(this.app, this.plugin, this, file);
    this.activeModal = modal;
    const origOnClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      if (this.activeModal === modal) this.activeModal = null;
      origOnClose();
    };
    modal.open();
  }
  refreshActiveModal(file) {
    if (this.activeModal && this.activeModal.file && this.activeModal.file.path === file.path) {
      this.activeModal.rerender();
    }
  }
  // -------------------- inline edit --------------------
  beginEdit(file) {
    this.editing = file.path;
    const cards = Array.from(this.containerEl.querySelectorAll(".keep-card[data-path]"));
    let card = null;
    for (const c of cards) {
      if (c.dataset.path === file.path) {
        card = c;
        break;
      }
    }
    if (!card) return;
    card.addClass("is-editing-card");
    const body = card.querySelector(".keep-card-body");
    if (!body) return;
    body.empty();
    this.app.vault.read(file).then((raw) => this.mountEditor(body, file, raw)).catch((err) => new obsidian.Notice("Read failed: " + err.message));
  }
  mountEditor(body, file, raw) {
    const { front, body: stripped } = stripFrontmatter(raw);
    const ta = body.createEl("textarea", { cls: "keep-card-editor" });
    ta.value = stripped;
    ta.setCssStyles({ height: "auto" });
    activeWindow.setTimeout(() => {
      ta.focus();
      ta.setCssStyles({ height: `${ta.scrollHeight}px` });
    }, 0);
    ta.addEventListener("input", () => {
      ta.setCssStyles({ height: "auto" });
      ta.setCssStyles({ height: `${ta.scrollHeight}px` });
    });
    ta.addEventListener("click", (e) => e.stopPropagation());
    const save = async () => {
      try {
        this.suppressEvents++;
        await this.app.vault.modify(file, front + ta.value);
      } catch (err) {
        new obsidian.Notice("Save failed: " + err.message);
      }
    };
    ta.addEventListener("blur", () => {
      void save().then(() => {
        this.editing = null;
        this.scheduleRender();
      });
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        ta.blur();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        ta.blur();
      }
    });
  }
  // -------------------- color picker --------------------
  toggleColorPicker(card, file) {
    const existing = card.querySelector(".keep-color-picker");
    if (existing) {
      existing.remove();
      return;
    }
    const picker = card.createDiv({ cls: "keep-color-picker" });
    picker.addEventListener("click", (e) => e.stopPropagation());
    for (const c of COLORS) {
      const swatch = picker.createDiv({
        cls: "keep-color-swatch",
        attr: { "aria-label": c.name, title: c.name }
      });
      if (c.value) swatch.setCssStyles({ background: c.value });
      else swatch.addClass("keep-color-swatch--default");
      swatch.addEventListener("click", async (e) => {
        e.stopPropagation();
        await this.setColor(file, c.value);
        picker.remove();
      });
    }
  }
  // -------------------- frontmatter mutations --------------------
  async togglePinned(file) {
    try {
      if (!this.plugin.settings.pinnedFiles) this.plugin.settings.pinnedFiles = {};
      const data = this.plugin.settings.pinnedFiles;
      if (this.isPinned(file)) {
        data[file.path] = false;
      } else {
        data[file.path] = this.maxPinOrder() + 1;
      }
      await this.plugin.saveData(this.plugin.settings);
      this.scheduleRender();
      this.refreshActiveModal(file);
    } catch (err) {
      new obsidian.Notice("Could not pin: " + err.message);
    }
  }
  maxPinOrder() {
    const data = this.plugin.settings.pinnedFiles || {};
    let m = 0;
    for (const k in data) {
      const v = data[k];
      if (typeof v === "number" && v > m) m = v;
    }
    for (const f of this.app.vault.getMarkdownFiles()) {
      if (data[f.path] !== void 0) continue;
      const fc = this.app.metadataCache.getFileCache(f);
      const v = fc && fc.frontmatter && fc.frontmatter.pinOrder;
      if (typeof v === "number" && v > m) m = v;
    }
    return m;
  }
  async swapPinOrder(a, b) {
    try {
      if (!this.plugin.settings.pinnedFiles) this.plugin.settings.pinnedFiles = {};
      const data = this.plugin.settings.pinnedFiles;
      let aOrder = this.pinOrderOf(a);
      let bOrder = this.pinOrderOf(b);
      const max = this.maxPinOrder();
      if (aOrder === Number.MAX_SAFE_INTEGER) aOrder = max + 1;
      if (bOrder === Number.MAX_SAFE_INTEGER) bOrder = max + 2;
      data[a.path] = bOrder;
      data[b.path] = aOrder;
      await this.plugin.saveData(this.plugin.settings);
      this.scheduleRender();
    } catch (err) {
      new obsidian.Notice("Reorder failed: " + err.message);
    }
  }
  async toggleArchived(file) {
    try {
      if (!this.plugin.settings.archivedFiles) this.plugin.settings.archivedFiles = {};
      const data = this.plugin.settings.archivedFiles;
      const wasArchived = this.isArchived(file);
      data[file.path] = !wasArchived;
      await this.plugin.saveData(this.plugin.settings);
      this.scheduleRender();
      this.refreshActiveModal(file);
      this.showUndoToast(wasArchived ? "Unarchived" : "Archived", async () => {
        const d = this.plugin.settings.archivedFiles;
        d[file.path] = wasArchived;
        await this.plugin.saveData(this.plugin.settings);
        this.scheduleRender();
        this.refreshActiveModal(file);
      });
    } catch (err) {
      new obsidian.Notice("Could not archive: " + err.message);
    }
  }
  async setColor(file, color) {
    try {
      if (!this.plugin.settings.cardColors) this.plugin.settings.cardColors = {};
      this.plugin.settings.cardColors[file.path] = color;
      await this.plugin.saveData(this.plugin.settings);
      this.applyCardColor(file.path, color);
      this.refreshActiveModal(file);
    } catch (err) {
      new obsidian.Notice("Could not set color: " + err.message);
    }
  }
  applyCardColor(path, color) {
    const cards = Array.from(this.containerEl.querySelectorAll(".keep-card[data-path]"));
    for (const card of cards) {
      if (card.dataset.path !== path) continue;
      card.setCssStyles({ background: "", borderLeft: "" });
      if (color) {
        if (this.plugin.settings.colorAsBorder) {
          card.setCssStyles({ borderLeft: `4px solid ${color}` });
        } else {
          card.setCssStyles({ background: color });
        }
      }
      break;
    }
  }
  async addTagToFile(file, tag) {
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        const cur = fm.tags;
        const target = tag.replace(/^#/, "");
        if (Array.isArray(cur)) {
          if (!cur.includes(target)) cur.push(target);
        } else if (typeof cur === "string") {
          if (cur !== target) fm.tags = [cur, target];
        } else {
          fm.tags = [target];
        }
      });
      new obsidian.Notice("Added #" + tag);
    } catch (err) {
      new obsidian.Notice("Could not add tag: " + err.message);
    }
  }
  // -------------------- context menu --------------------
  openContextMenu(evt, file) {
    const menu = new obsidian.Menu();
    const isPinnedNow = this.isPinned(file);
    const isArchivedNow = this.isArchived(file);
    menu.addItem(
      (mi) => mi.setTitle("Open in new tab").setIcon("external-link").onClick(() => {
        void this.app.workspace.getLeaf("tab").openFile(file);
      })
    );
    menu.addItem(
      (mi) => mi.setTitle("Open in new pane").setIcon("separator-vertical").onClick(() => {
        void this.app.workspace.getLeaf("split").openFile(file);
      })
    );
    menu.addSeparator();
    menu.addItem(
      (mi) => mi.setTitle("Edit in card").setIcon("pencil").onClick(() => this.beginEdit(file))
    );
    menu.addItem(
      (mi) => mi.setTitle(isPinnedNow ? "Unpin" : "Pin").setIcon(isPinnedNow ? "pin-off" : "pin").onClick(() => void this.togglePinned(file))
    );
    menu.addItem(
      (mi) => mi.setTitle(isArchivedNow ? "Unarchive" : "Archive").setIcon(isArchivedNow ? "archive-restore" : "archive").onClick(() => void this.toggleArchived(file))
    );
    menu.addSeparator();
    menu.addItem(
      (mi) => mi.setTitle("Rename").setIcon("input").onClick(() => {
        const old = file.basename;
        const m = new RenameModal(this.app, old, async (next) => {
          if (!next || next === old) return;
          const newPath = (file.parent && file.parent.path && file.parent.path !== "/" ? file.parent.path + "/" : "") + next + ".md";
          try {
            await this.app.fileManager.renameFile(file, newPath);
          } catch (err) {
            new obsidian.Notice("Rename failed: " + err.message);
          }
        });
        m.open();
      })
    );
    menu.addItem(
      (mi) => mi.setTitle("Reveal in file explorer").setIcon("folder").onClick(() => {
        const fe = this.app.workspace.getLeavesOfType("file-explorer")[0];
        const feView = fe && fe.view;
        if (feView && feView.revealInFolder) {
          feView.revealInFolder(file);
        } else {
          void this.app.workspace.revealLeaf(this.app.workspace.getLeaf());
        }
      })
    );
    menu.addItem(
      (mi) => mi.setTitle("Copy Obsidian link").setIcon("link").onClick(async () => {
        await navigator.clipboard.writeText("[[" + file.basename + "]]");
        new obsidian.Notice("Link copied");
      })
    );
    menu.addItem(
      (mi) => mi.setTitle("Copy embed").setIcon("layers").onClick(async () => {
        await navigator.clipboard.writeText("![[" + file.basename + "]]");
        new obsidian.Notice("Embed copied");
      })
    );
    if (isWallDensity(this.plugin.settings.density)) {
      const wall = this.getOrCreateCurrentWall();
      if (wall.positions[file.path]) {
        menu.addSeparator();
        menu.addItem(
          (mi) => mi.setTitle("Remove from wall").setIcon("x").onClick(() => this.removeFromCurrentWall(file))
        );
      }
    }
    menu.addSeparator();
    menu.addItem(
      (mi) => mi.setTitle("Delete note").setIcon("trash").onClick(async () => {
        try {
          await this.app.fileManager.trashFile(file);
          this.showUndoToast("Deleted", null);
        } catch (err) {
          new obsidian.Notice("Delete failed: " + err.message);
        }
      })
    );
    menu.showAtMouseEvent(evt);
  }
  // -------------------- selection + bulk --------------------
  toggleSelection(path, range) {
    if (range && this.lastClickedPath) {
      const cards = Array.from(this.containerEl.querySelectorAll(".keep-card[data-path]"));
      const paths = cards.map((c) => c.dataset.path);
      const i1 = paths.indexOf(this.lastClickedPath);
      const i2 = paths.indexOf(path);
      if (i1 !== -1 && i2 !== -1) {
        const lo = Math.min(i1, i2);
        const hi = Math.max(i1, i2);
        for (let i = lo; i <= hi; i++) this.selection.add(paths[i]);
        this.lastClickedPath = path;
        this.refreshSelectionUI();
        return;
      }
    }
    if (this.selection.has(path)) this.selection.delete(path);
    else this.selection.add(path);
    this.lastClickedPath = path;
    this.refreshSelectionUI();
  }
  refreshSelectionUI() {
    const cards = this.containerEl.querySelectorAll(".keep-card[data-path]");
    cards.forEach((c) => {
      const sel = this.selection.has(c.dataset.path);
      c.toggleClass("is-selected", sel);
      const cb = c.querySelector(".keep-card-checkbox");
      if (cb) cb.checked = sel;
    });
    this.renderBulkActions(this.contentEl);
  }
  renderBulkActions(parent) {
    const existing = parent.querySelector(".keep-cards-bulk");
    if (existing) existing.remove();
    if (this.selection.size === 0) return;
    const bar = parent.createDiv({ cls: "keep-cards-bulk" });
    bar.createSpan({ cls: "keep-cards-bulk-count", text: this.selection.size + " selected" });
    const make = (icon, label, fn) => {
      const b = bar.createEl("button", { cls: "keep-cards-bulk-btn", attr: { type: "button", title: label, "aria-label": label } });
      obsidian.setIcon(b, icon);
      b.addEventListener("click", async () => {
        await fn();
      });
    };
    make("pin", "Pin selected", async () => {
      for (const path of Array.from(this.selection)) {
        const f = this.app.vault.getAbstractFileByPath(path);
        if (f instanceof obsidian.TFile) await this.togglePinned(f);
      }
    });
    make("archive", "Archive selected", async () => {
      for (const path of Array.from(this.selection)) {
        const f = this.app.vault.getAbstractFileByPath(path);
        if (f instanceof obsidian.TFile) await this.toggleArchived(f);
      }
      this.selection.clear();
    });
    const colorBtn = bar.createEl("button", { cls: "keep-cards-bulk-btn", attr: { type: "button", title: "Color", "aria-label": "Color" } });
    obsidian.setIcon(colorBtn, "palette");
    colorBtn.addEventListener("click", (e) => {
      const menu = new obsidian.Menu();
      for (const c of COLORS) {
        menu.addItem(
          (mi) => mi.setTitle(c.name).onClick(async () => {
            for (const path of Array.from(this.selection)) {
              const f = this.app.vault.getAbstractFileByPath(path);
              if (f instanceof obsidian.TFile) await this.setColor(f, c.value);
            }
          })
        );
      }
      menu.showAtMouseEvent(e);
    });
    make("trash", "Delete selected", () => {
      const paths = Array.from(this.selection);
      const message = `Delete ${paths.length} note${paths.length === 1 ? "" : "s"}?`;
      new ConfirmModal(this.app, "Delete selected", message, "Delete", async () => {
        for (const path of paths) {
          const f = this.app.vault.getAbstractFileByPath(path);
          if (f instanceof obsidian.TFile) {
            try {
              await this.app.fileManager.trashFile(f);
            } catch {
            }
          }
        }
        this.selection.clear();
        this.refreshSelectionUI();
      }).open();
    });
    make("x", "Clear selection", () => {
      this.selection.clear();
      this.refreshSelectionUI();
    });
  }
  // -------------------- capture --------------------
  async captureNote(content, opts) {
    const folder = this.plugin.settings.notesFolder.trim();
    const explicitTitle = opts?.title?.trim();
    const fallbackTitle = content.trim().split("\n")[0].slice(0, 60);
    const safe = (explicitTitle || fallbackTitle || "").replace(/[\\/:*?"<>|#]/g, "").trim() || "Untitled";
    const base = (folder ? folder + "/" : "") + safe;
    let path = base + ".md";
    let i = 1;
    while (this.app.vault.getAbstractFileByPath(path)) {
      path = base + " " + i++ + ".md";
    }
    try {
      if (folder) {
        try {
          await this.app.vault.createFolder(folder);
        } catch {
        }
      }
      const created = await this.app.vault.create(path, content);
      let dirty = false;
      if (opts?.pin) {
        if (!this.plugin.settings.pinnedFiles) this.plugin.settings.pinnedFiles = {};
        const max = this.maxPinOrder();
        this.plugin.settings.pinnedFiles[created.path] = max + 1;
        dirty = true;
      }
      if (opts && opts.color !== void 0 && opts.color !== null) {
        if (!this.plugin.settings.cardColors) this.plugin.settings.cardColors = {};
        this.plugin.settings.cardColors[created.path] = opts.color;
        dirty = true;
      }
      if (isWallDensity(this.plugin.settings.density)) {
        const wall = this.getOrCreateCurrentWall();
        wall.positions[created.path] = { x: 0, y: 0, rotation: 0, z: 0 };
        dirty = true;
      }
      if (dirty) await this.plugin.saveData(this.plugin.settings);
    } catch (err) {
      new obsidian.Notice("Could not create note: " + err.message);
    }
  }
  // -------------------- undo toast --------------------
  showUndoToast(label, undo) {
    const root = this.containerEl;
    const old = root.querySelector(".keep-undo-toast");
    if (old) old.remove();
    const toast = root.createDiv({ cls: "keep-undo-toast" });
    toast.createSpan({ text: label });
    if (undo) {
      const btn = toast.createEl("button", { text: "Undo", cls: "keep-undo-btn", attr: { type: "button" } });
      btn.addEventListener("click", () => {
        void Promise.resolve(undo()).catch((err) => new obsidian.Notice("Undo failed: " + err.message)).finally(() => toast.remove());
      });
    }
    activeWindow.setTimeout(() => toast.remove(), 5e3);
  }
  // -------------------- keyboard --------------------
  handleKeydown(e) {
    const target = e.target;
    const tag = target ? target.tagName : "";
    const inField = tag === "INPUT" || tag === "TEXTAREA" || target.instanceOf(HTMLElement) && target.isContentEditable;
    if (e.key === "/" && !inField) {
      e.preventDefault();
      const search = this.containerEl.querySelector(".keep-cards-search");
      if (search) search.focus();
      return;
    }
    if (e.key === "Escape") {
      if (this.selection.size > 0) {
        this.selection.clear();
        this.refreshSelectionUI();
        e.preventDefault();
        return;
      }
    }
    if (inField) return;
    const cards = Array.from(this.containerEl.querySelectorAll(".keep-card[data-path]"));
    if (cards.length === 0) return;
    let idx = cards.findIndex((c) => c.dataset.path === this.focusedPath);
    if (idx === -1) idx = 0;
    const moveTo = (n) => {
      n = Math.max(0, Math.min(cards.length - 1, n));
      const c = cards[n];
      this.focusedPath = c.dataset.path;
      cards.forEach((x) => x.removeClass("is-focused"));
      c.addClass("is-focused");
      c.scrollIntoView({ block: "nearest" });
    };
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveTo(idx + 1);
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveTo(idx - 1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveTo(idx + 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveTo(idx - 1);
      return;
    }
    if (e.key === "Enter") {
      const c = cards[idx];
      if (!c) return;
      const f = this.app.vault.getAbstractFileByPath(c.dataset.path);
      if (f instanceof obsidian.TFile) this.openNotePreview(f);
      e.preventDefault();
      return;
    }
    if (e.key === "e") {
      const c = cards[idx];
      if (!c) return;
      const f = this.app.vault.getAbstractFileByPath(c.dataset.path);
      if (f instanceof obsidian.TFile) this.beginEdit(f);
      e.preventDefault();
      return;
    }
    if (e.key === "p") {
      const c = cards[idx];
      if (!c) return;
      const f = this.app.vault.getAbstractFileByPath(c.dataset.path);
      if (f instanceof obsidian.TFile) void this.togglePinned(f);
      e.preventDefault();
      return;
    }
    if (e.key === "a") {
      const c = cards[idx];
      if (!c) return;
      const f = this.app.vault.getAbstractFileByPath(c.dataset.path);
      if (f instanceof obsidian.TFile) void this.toggleArchived(f);
      e.preventDefault();
      return;
    }
    if (e.key === "x") {
      const c = cards[idx];
      if (!c) return;
      this.toggleSelection(c.dataset.path, false);
      e.preventDefault();
      return;
    }
  }
};
var NotePreviewModal = class extends obsidian.Modal {
  constructor(app, plugin, view, file) {
    super(app);
    this.plugin = plugin;
    this.view = view;
    this.file = file;
    this.editing = false;
    this.component = null;
    this.eventRef = null;
    this._currentFront = "";
    this._currentTextarea = null;
    this._dirty = false;
  }
  onOpen() {
    this.modalEl.addClass("keep-note-modal");
    this.component = new obsidian.Component();
    this.component.load();
    this.eventRef = this.app.metadataCache.on("changed", (changedFile) => {
      if (this.editing) return;
      if (changedFile && changedFile.path === this.file.path) {
        this.rerender();
      }
    });
    this.rerender();
  }
  applyNoteColor() {
    const dataColor = (this.plugin.settings.cardColors || {})[this.file.path];
    const fc = this.app.metadataCache.getFileCache(this.file);
    const fmColor = fc && fc.frontmatter && fc.frontmatter.color;
    const noteColor = dataColor !== void 0 ? dataColor : fmColor;
    if (noteColor) {
      this.modalEl.addClass("has-note-color");
      this.modalEl.setCssStyles({ background: String(noteColor) });
    } else {
      this.modalEl.removeClass("has-note-color");
      this.modalEl.setCssStyles({ background: "" });
    }
  }
  rerender() {
    this.titleEl.empty();
    this.contentEl.empty();
    this.renderHeader();
    void this.renderBody();
  }
  renderHeader() {
    const isPinnedNow = this.view.isPinned(this.file);
    const isArchivedNow = this.view.isArchived(this.file);
    this.applyNoteColor();
    const row = this.titleEl.createDiv({ cls: "keep-modal-titlerow" });
    row.createDiv({ cls: "keep-modal-title", text: this.file.basename });
    const actions = row.createDiv({ cls: "keep-modal-actions" });
    this.makeAction(actions, isPinnedNow ? "pin-off" : "pin", isPinnedNow ? "Unpin" : "Pin", async () => {
      await this.view.togglePinned(this.file);
    });
    this.makeAction(actions, this.editing ? "eye" : "pencil", this.editing ? "View" : "Edit", async () => {
      if (this.editing) {
        await this.saveEdit();
        this.editing = false;
      } else {
        this.editing = true;
      }
      this.rerender();
    });
    this.makeAction(actions, "palette", "Color", (e) => {
      const menu = new obsidian.Menu();
      for (const c of COLORS) {
        menu.addItem(
          (mi) => mi.setTitle(c.name).onClick(async () => {
            await this.view.setColor(this.file, c.value);
          })
        );
      }
      menu.showAtMouseEvent(e);
    });
    this.makeAction(actions, isArchivedNow ? "archive-restore" : "archive", isArchivedNow ? "Unarchive" : "Archive", async () => {
      await this.view.toggleArchived(this.file);
    });
    this.makeAction(actions, "external-link", "Open in tab", () => {
      if (this.editing) void this.saveEdit();
      void this.app.workspace.getLeaf("tab").openFile(this.file);
      this.close();
    });
  }
  makeAction(parent, icon, label, handler) {
    const btn = parent.createEl("button", {
      cls: "keep-modal-action-btn",
      attr: { type: "button", "aria-label": label, title: label }
    });
    obsidian.setIcon(btn, icon);
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await handler(e);
    });
  }
  async renderBody() {
    let raw = "";
    try {
      raw = await this.app.vault.read(this.file);
    } catch {
      raw = "";
    }
    const { front, body: stripped } = stripFrontmatter(raw);
    this._currentFront = front;
    if (this.editing) {
      const ta = this.contentEl.createEl("textarea", { cls: "keep-modal-editor" });
      ta.value = stripped;
      this._currentTextarea = ta;
      this._dirty = false;
      ta.addEventListener("input", () => {
        this._dirty = true;
      });
      ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void this.saveEdit().then(() => {
            this.editing = false;
            this.rerender();
          });
        }
      });
      activeWindow.setTimeout(() => ta.focus(), 0);
      return;
    }
    const fc = this.app.metadataCache.getFileCache(this.file);
    const tags = fc ? obsidian.getAllTags(fc) : null;
    if (tags && tags.length > 0) {
      const tagsRow = this.contentEl.createDiv({ cls: "keep-modal-tags" });
      for (const t of tags) {
        const chip = tagsRow.createSpan({ cls: "keep-card-tag", text: t });
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          this.view.filter = { type: "tag", tag: t.replace(/^#/, "") };
          this.view.scheduleRender();
          this.close();
        });
      }
    }
    const body = this.contentEl.createDiv({ cls: "keep-modal-body" });
    const md = body.createDiv({ cls: "keep-modal-md" });
    try {
      await renderMarkdownInto(this.app, stripped, md, this.file.path, this.component);
    } catch {
      md.setText(stripped);
    }
    this.wireModalCheckboxes(md);
    const meta = body.createDiv({ cls: "keep-modal-meta" });
    const bl = backlinksCount(this.app, this.file);
    if (bl > 0) {
      const span = meta.createSpan({ cls: "keep-card-backlinks" });
      const ic = span.createSpan({ cls: "keep-card-backlinks-icon" });
      obsidian.setIcon(ic, "links-coming-in");
      span.createSpan({ text: bl + " backlink" + (bl === 1 ? "" : "s") });
    }
    meta.createSpan({ cls: "keep-modal-path", text: this.file.path });
  }
  wireModalCheckboxes(el) {
    const boxes = el.querySelectorAll("input[type=checkbox]");
    boxes.forEach((cb, i) => {
      cb.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          const raw = await this.app.vault.read(this.file);
          let n = 0;
          const updated = raw.replace(/^(\s*[-*+] \[)( |x|X)(\])/gm, (m, open, mark, close) => {
            if (n++ === i) return open + (mark === " " ? "x" : " ") + close;
            return m;
          });
          await this.app.vault.modify(this.file, updated);
        } catch (err) {
          new obsidian.Notice("Toggle failed: " + err.message);
        }
      });
    });
  }
  async saveEdit() {
    if (!this._currentTextarea) return;
    if (!this._dirty) return;
    try {
      const front = this._currentFront || "";
      this.view.suppressEvents++;
      await this.app.vault.modify(this.file, front + this._currentTextarea.value);
      this._dirty = false;
    } catch (err) {
      new obsidian.Notice("Save failed: " + err.message);
    }
  }
  onClose() {
    if (this.editing && this._dirty) {
      void this.saveEdit();
    }
    if (this.eventRef) {
      this.app.metadataCache.offref(this.eventRef);
      this.eventRef = null;
    }
    if (this.component) {
      this.component.unload();
      this.component = null;
    }
    this.contentEl.empty();
  }
};
var WallAddNotesModal = class extends obsidian.FuzzySuggestModal {
  constructor(app, plugin, wall, onChoose) {
    super(app);
    this.plugin = plugin;
    this.wall = wall;
    this.onChoose = onChoose;
    this.setPlaceholder(`Add a note to "${wall.name}"\u2026`);
  }
  getItems() {
    const folder = (this.plugin.settings.notesFolder || "").trim();
    return this.app.vault.getMarkdownFiles().filter((f) => {
      if (folder && !f.path.startsWith(folder + "/") && f.path !== folder) return false;
      return !this.wall.positions[f.path];
    });
  }
  getItemText(item) {
    return item.basename + " \xB7 " + item.path;
  }
  onChooseItem(item) {
    this.onChoose(item);
  }
};
var ConfirmModal = class extends obsidian.Modal {
  constructor(app, title, message, confirmLabel, onConfirm) {
    super(app);
    this.title = title;
    this.message = message;
    this.confirmLabel = confirmLabel;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    this.titleEl.setText(this.title);
    this.contentEl.createDiv({ cls: "keep-confirm-message", text: this.message });
    const row = this.contentEl.createDiv({ cls: "keep-modal-buttons" });
    const cancel = row.createEl("button", { text: "Cancel", attr: { type: "button" } });
    cancel.addEventListener("click", () => this.close());
    const ok = row.createEl("button", {
      text: this.confirmLabel,
      cls: "mod-warning",
      attr: { type: "button" }
    });
    ok.addEventListener("click", () => {
      void Promise.resolve(this.onConfirm()).then(() => this.close());
    });
  }
};
var RenameModal = class extends obsidian.Modal {
  constructor(app, current, onSubmit) {
    super(app);
    this.current = current;
    this.onSubmit = onSubmit;
    this.value = current;
  }
  onOpen() {
    this.titleEl.setText("Rename note");
    const input = this.contentEl.createEl("input", {
      attr: { type: "text" },
      cls: "keep-modal-input"
    });
    input.value = this.current;
    input.addEventListener("input", () => {
      this.value = input.value;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void Promise.resolve(this.onSubmit(this.value)).then(() => this.close());
      }
    });
    activeWindow.setTimeout(() => input.focus(), 0);
    const row = this.contentEl.createDiv({ cls: "keep-modal-buttons" });
    const cancel = row.createEl("button", { text: "Cancel", attr: { type: "button" } });
    cancel.addEventListener("click", () => this.close());
    const ok = row.createEl("button", { text: "Rename", cls: "mod-cta", attr: { type: "button" } });
    ok.addEventListener("click", () => {
      void Promise.resolve(this.onSubmit(this.value)).then(() => this.close());
    });
  }
};
var TagListModal = class extends obsidian.Modal {
  constructor(app, plugin, tags) {
    super(app);
    this.plugin = plugin;
    this.tags = tags;
  }
  onOpen() {
    this.titleEl.setText("Edit labels");
    const list = this.contentEl.createDiv({ cls: "keep-modal-stack" });
    for (const t of this.tags) {
      const row = list.createDiv({ cls: "keep-modal-row" });
      const dot = row.createSpan({ cls: "keep-tag-dot" });
      const dotColor = this.plugin.settings.tagColors[t] || "transparent";
      dot.setCssStyles({ background: dotColor });
      row.createSpan({ text: "#" + t });
      row.createDiv({ cls: "keep-modal-spacer" });
      const colorBtn = row.createEl("button", { text: "Color", attr: { type: "button" } });
      colorBtn.addEventListener("click", () => {
        new TagColorModal(this.app, this.plugin, t).open();
      });
      const renameBtn = row.createEl("button", {
        text: "Rename",
        cls: "mod-cta",
        attr: { type: "button" }
      });
      renameBtn.addEventListener("click", () => {
        new TagRenameModal(this.app, this.plugin, t).open();
        this.close();
      });
    }
  }
};
var TagColorModal = class extends obsidian.Modal {
  constructor(app, plugin, tag) {
    super(app);
    this.plugin = plugin;
    this.tag = tag;
  }
  onOpen() {
    this.titleEl.setText("Color for #" + this.tag);
    const grid = this.contentEl.createDiv({ cls: "keep-modal-color-grid" });
    for (const c of COLORS) {
      const sw = grid.createDiv({ cls: "keep-modal-color-swatch", attr: { title: c.name } });
      if (c.value) sw.setCssStyles({ background: c.value });
      sw.addEventListener("click", () => {
        if (c.value === null) delete this.plugin.settings.tagColors[this.tag];
        else this.plugin.settings.tagColors[this.tag] = c.value;
        void this.plugin.saveSettings().then(() => this.close());
      });
    }
  }
};
var TagRenameModal = class extends obsidian.Modal {
  constructor(app, plugin, oldTag) {
    super(app);
    this.plugin = plugin;
    this.oldTag = oldTag;
    this.newTag = oldTag;
  }
  onOpen() {
    this.titleEl.setText(`Rename label "${this.oldTag}"`);
    const input = this.contentEl.createEl("input", {
      attr: { type: "text" },
      cls: "keep-modal-input"
    });
    input.value = this.oldTag;
    input.addEventListener("input", () => {
      this.newTag = input.value;
    });
    activeWindow.setTimeout(() => input.focus(), 0);
    this.contentEl.createDiv({
      cls: "keep-modal-hint",
      text: "Renames in frontmatter (tags:) and inline #tags across the vault."
    });
    const row = this.contentEl.createDiv({ cls: "keep-modal-buttons" });
    const cancel = row.createEl("button", { text: "Cancel", attr: { type: "button" } });
    cancel.addEventListener("click", () => this.close());
    const ok = row.createEl("button", { text: "Rename", cls: "mod-cta", attr: { type: "button" } });
    ok.addEventListener("click", () => {
      void this.doRename().then(() => this.close());
    });
  }
  async doRename() {
    const oldT = this.oldTag.replace(/^#/, "");
    const newT = (this.newTag || "").replace(/^#/, "").trim();
    if (!newT || newT === oldT) return;
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      try {
        await this.app.fileManager.processFrontMatter(file, (fm) => {
          if (!fm.tags) return;
          if (Array.isArray(fm.tags)) {
            const idx = fm.tags.findIndex((x) => String(x).replace(/^#/, "") === oldT);
            if (idx !== -1) fm.tags[idx] = newT;
          } else if (typeof fm.tags === "string") {
            if (fm.tags.replace(/^#/, "") === oldT) fm.tags = newT;
          }
        });
        const raw = await this.app.vault.read(file);
        const re = new RegExp("(^|[^\\w/])#" + escapeRegex(oldT) + "(?![\\w/-])", "g");
        if (re.test(raw)) {
          const updated = raw.replace(re, "$1#" + newT);
          if (updated !== raw) {
            await this.app.vault.modify(file, updated);
            count++;
          }
        }
      } catch {
      }
    }
    if (this.plugin.settings.tagColors[oldT]) {
      this.plugin.settings.tagColors[newT] = this.plugin.settings.tagColors[oldT];
      delete this.plugin.settings.tagColors[oldT];
      await this.plugin.saveSettings();
    }
    new obsidian.Notice("Renamed #" + oldT + " \u2192 #" + newT + " (" + count + " file" + (count === 1 ? "" : "s") + " changed)");
  }
};
var KeepCardsSettingTab = class extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new obsidian.Setting(containerEl).setName("Notes folder").setDesc("Only show notes from this folder. Leave empty for the whole vault.").addText(
      (t) => t.setValue(this.plugin.settings.notesFolder).onChange(async (v) => {
        this.plugin.settings.notesFolder = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new obsidian.Setting(containerEl).setName("Preview lines").setDesc("Approximate lines of body shown on each card.").addText(
      (t) => t.setValue(String(this.plugin.settings.previewLines)).onChange(async (v) => {
        const n = parseInt(v, 10);
        if (!isNaN(n) && n > 0) {
          this.plugin.settings.previewLines = n;
          await this.plugin.saveSettings();
        }
      })
    );
    new obsidian.Setting(containerEl).setName("Color as left border").setDesc("Show note color as a 4px left border instead of the full card background.").addToggle(
      (t) => t.setValue(this.plugin.settings.colorAsBorder).onChange(async (v) => {
        this.plugin.settings.colorAsBorder = v;
        await this.plugin.saveSettings();
      })
    );
    new obsidian.Setting(containerEl).setName("Pinned section header").setDesc('Group pinned cards under a "pinned" / "others" divider.').addToggle(
      (t) => t.setValue(this.plugin.settings.pinnedHeader).onChange(async (v) => {
        this.plugin.settings.pinnedHeader = v;
        await this.plugin.saveSettings();
      })
    );
    new obsidian.Setting(containerEl).setName("Wall background").setDesc("Background texture used in wall mode.").addDropdown((dd) => {
      const options = {
        cork: "Cork",
        whiteboard: "Whiteboard",
        slate: "Slate",
        paper: "Paper",
        graph: "Graph paper",
        blueprint: "Blueprint",
        linen: "Linen",
        chalkboard: "Chalkboard"
      };
      for (const k of Object.keys(options)) {
        dd.addOption(k, options[k]);
      }
      dd.setValue(this.plugin.settings.wallBackground);
      dd.onChange(async (v) => {
        this.plugin.settings.wallBackground = v;
        await this.plugin.saveSettings();
      });
    });
    new obsidian.Setting(containerEl).setName("Show image thumbnails").setDesc("Render the first attached image at the top of each card.").addToggle(
      (t) => t.setValue(this.plugin.settings.showImages).onChange(async (v) => {
        this.plugin.settings.showImages = v;
        await this.plugin.saveSettings();
      })
    );
    new obsidian.Setting(containerEl).setName("Auto-collapse sidebars in card view").setDesc("Collapse the left and right sidebars while a cards view is active; restore them when you leave.").addToggle(
      (t) => t.setValue(this.plugin.settings.autoCollapseSidebars).onChange((v) => {
        this.plugin.settings.autoCollapseSidebars = v;
        void this.plugin.saveSettings();
        if (!v) this.plugin.restoreSidebars();
        else this.plugin.handleActiveLeafChange(
          this.app.workspace.getActiveViewOfType(CardsView)?.leaf ?? null
        );
      })
    );
  }
};
var main_default = KeepCardsPlugin;
