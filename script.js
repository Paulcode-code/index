const SUPABASE_URL = "https://vhzqpmlqgtuteknuyoem.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoenFwbWxxZ3R1dGVrbnV5b2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzkwMTQsImV4cCI6MjA5NDQxNTAxNH0.yVH-2m7qxi23bsCUa-DF9gT5F0pxWmZgd3A805WEJPY";
let currentPassword = "";
let pendingAction = null;

const openAddButton = document.querySelector("#openAdd");
const passwordDialog = document.querySelector("#passwordDialog");
const passwordForm = document.querySelector("#passwordForm");
const passwordInput = document.querySelector("#passwordInput");
const passwordError = document.querySelector("#passwordError");
const addDialog = document.querySelector("#addDialog");
const addForm = document.querySelector("#addForm");
const siteNameInput = document.querySelector("#siteName");
const siteUrlInput = document.querySelector("#siteUrl");
const addError = document.querySelector("#addError");
const siteList = document.querySelector("#siteList");

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error("Supabase request failed");
  }

  return response.json();
}

function normalizeUrl(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function renderSites(sites) {
  siteList.replaceChildren();

  if (sites.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Aucun site ajoute pour le moment.";
    siteList.append(emptyState);
    return;
  }

  for (const site of sites) {
    const card = document.createElement("article");
    const link = document.createElement("a");
    const name = document.createElement("span");
    const url = document.createElement("span");
    const deleteButton = document.createElement("button");

    card.className = "site-card";
    link.className = "site-link";
    link.href = site.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    name.className = "site-name";
    name.textContent = site.name;

    url.className = "site-url";
    url.textContent = site.url.replace(/^https?:\/\//i, "");

    link.append(name, url);

    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Supprimer";
    deleteButton.addEventListener("click", () => {
      pendingAction = { type: "delete", site };
      passwordForm.reset();
      passwordError.textContent = "";
      openDialog(passwordDialog, passwordInput);
    });

    card.append(link, deleteButton);
    siteList.append(card);
  }
}

function renderMessage(message) {
  const text = document.createElement("p");
  text.className = "empty-state";
  text.textContent = message;
  siteList.replaceChildren(text);
}

async function loadSites() {
  renderMessage("Chargement des sites...");

  try {
    const sites = await supabaseRequest("/sites?select=id,name,url&order=created_at.asc");
    renderSites(sites);
  } catch {
    renderMessage("Impossible de charger les sites pour le moment.");
  }
}

function openDialog(dialog, focusTarget) {
  dialog.showModal();
  requestAnimationFrame(() => focusTarget.focus());
}

openAddButton.addEventListener("click", () => {
  pendingAction = { type: "add" };
  passwordForm.reset();
  passwordError.textContent = "";
  openDialog(passwordDialog, passwordInput);
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  currentPassword = passwordInput.value;

  if (pendingAction?.type === "delete") {
    try {
      await supabaseRequest("/rpc/delete_site_with_password", {
        method: "POST",
        body: JSON.stringify({
          site_id: pendingAction.site.id,
          password_to_check: currentPassword,
        }),
      });
      currentPassword = "";
      pendingAction = null;
      passwordDialog.close();
      await loadSites();
    } catch {
      passwordError.textContent = "Mot de passe incorrect ou suppression impossible.";
      passwordInput.select();
    }
    return;
  }

  passwordDialog.close();
  addForm.reset();
  addError.textContent = "";
  openDialog(addDialog, siteNameInput);
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = siteNameInput.value.trim();
  const url = normalizeUrl(siteUrlInput.value);

  if (!name || !url) {
    addError.textContent = "Remplis les deux champs.";
    return;
  }

  try {
    await supabaseRequest("/rpc/add_site_with_password", {
      method: "POST",
      body: JSON.stringify({
        site_name: name,
        site_url: url,
        password_to_check: currentPassword,
      }),
    });
    currentPassword = "";
    await loadSites();
    addDialog.close();
  } catch {
    addError.textContent = "Mot de passe incorrect ou ajout impossible.";
  }
});

loadSites();
