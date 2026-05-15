const PASSWORD = "Paula12ans!";
const STORAGE_KEY = "index-des-sites";

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

function loadSites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSites(sites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
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

function renderSites() {
  const sites = loadSites();
  siteList.replaceChildren();

  if (sites.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Aucun site ajoute pour le moment.";
    siteList.append(emptyState);
    return;
  }

  for (const site of sites) {
    const link = document.createElement("a");
    const name = document.createElement("span");
    const url = document.createElement("span");

    link.className = "site-card";
    link.href = site.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    name.className = "site-name";
    name.textContent = site.name;

    url.className = "site-url";
    url.textContent = site.url.replace(/^https?:\/\//i, "");

    link.append(name, url);
    siteList.append(link);
  }
}

function openDialog(dialog, focusTarget) {
  dialog.showModal();
  requestAnimationFrame(() => focusTarget.focus());
}

openAddButton.addEventListener("click", () => {
  passwordForm.reset();
  passwordError.textContent = "";
  openDialog(passwordDialog, passwordInput);
});

passwordForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (passwordInput.value !== PASSWORD) {
    passwordError.textContent = "Mot de passe incorrect.";
    passwordInput.select();
    return;
  }

  passwordDialog.close();
  addForm.reset();
  addError.textContent = "";
  openDialog(addDialog, siteNameInput);
});

addForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = siteNameInput.value.trim();
  const url = normalizeUrl(siteUrlInput.value);

  if (!name || !url) {
    addError.textContent = "Remplis les deux champs.";
    return;
  }

  const sites = loadSites();
  sites.push({ name, url });
  saveSites(sites);
  renderSites();
  addDialog.close();
});

renderSites();
