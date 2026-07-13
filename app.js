import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const APP_VERSION = "v11.0.0-20260713";
const APP_CACHE_PREFIX = "visitas-acs-";
console.info(`Sistema Controle ACS carregado: ${APP_VERSION}`);

// 1) COLE AQUI A CONFIGURAÇÃO DO SEU FIREBASE
// Firebase Console > Configurações do projeto > Seus apps > SDK setup and configuration > Config
const firebaseConfig = {
  apiKey: "AIzaSyCgOCnS3d-LjH_GwLUVCeXAwhs3vuwyqh4",
  authDomain: "gestaoacs-f4bdd.firebaseapp.com",
  projectId: "gestaoacs-f4bdd",
  storageBucket: "gestaoacs-f4bdd.firebasestorage.app",
  messagingSenderId: "382740288045",
  appId: "1:382740288045:web:3c0579e6bccc5fcb165ea4",
  measurementId: "G-S9J1TSZKL2"
};

// 2) COLOQUE AQUI O E-MAIL QUE SERÁ ADMIN DO SISTEMA
// Use o mesmo e-mail no arquivo firebase-rules.txt
const ADMIN_EMAILS = ["carmoeliel99@gmail.com"];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let currentUser = null;
let currentProfile = null;
let acsCache = [];
let selectedAcs = null;
let unsubscribeAcs = null;
let adminReportData = [];
let reportsRawData = [];
let reportsRenderedRows = [];

const $ = (id) => document.getElementById(id);

const els = {
  loading: $("loading"),
  authArea: $("auth-area"),
  appArea: $("app-area"),
  loginBox: $("login-box"),
  registerBox: $("register-box"),
  authMessage: $("auth-message"),
  userInfo: $("user-info"),
  postoName: $("posto-name"),
  totalAcs: $("total-acs"),
  totalCurrentMonth: $("total-current-month"),
  avgCurrentCoverage: $("avg-current-coverage"),
  acsList: $("acs-list"),
  searchAcs: $("search-acs"),
  visitasCard: $("visitas-card"),
  selectedAcsTitle: $("selected-acs-title"),
  selectedAcsSubtitle: $("selected-acs-subtitle"),
  yearSelect: $("year-select"),
  monthsGrid: $("months-grid"),
  visitsMessage: $("visits-message"),
  acsMessage: $("acs-message"),
  adminName: $("admin-name"),
  adminEmail: $("admin-email"),
  adminPosto: $("admin-posto"),
  adminMessage: $("admin-message"),
  adminList: $("admin-list"),
  tabEnfermeira: $("tab-enfermeira"),
  tabAdmin: $("tab-admin"),
  tabRelatorios: $("tab-relatorios"),
  enfermeiraPanel: $("enfermeira-panel"),
  relatoriosPanel: $("relatorios-panel"),
  adminPanel: $("admin-panel"),
  adminYearSelect: $("admin-year-select"),
  adminMonthSelect: $("admin-month-select"),
  adminSearch: $("admin-search"),
  adminReportBody: $("admin-report-body"),
  adminTotalPostos: $("admin-total-postos"),
  adminTotalEnfermeiras: $("admin-total-enfermeiras"),
  adminTotalAcs: $("admin-total-acs"),
  adminTotalVisitas: $("admin-total-visitas"),
  reportType: $("report-type"),
  reportYearSelect: $("report-year-select"),
  reportStartMonth: $("report-start-month"),
  reportEndMonth: $("report-end-month"),
  reportAcsSelect: $("report-acs-select"),
  reportSearch: $("report-search"),
  reportMessage: $("report-message"),
  reportHelp: $("report-help"),
  reportPreview: $("report-preview"),
  reportStartLabel: $("report-start-label"),
  reportAcsHint: $("report-acs-hint"),
  reportTitle: $("report-title"),
  reportSubtitle: $("report-subtitle"),
  reportTableBody: $("report-table-body"),
  reportTotalVisits: $("report-total-visits"),
  reportTotalCitizens: $("report-total-citizens"),
  reportCoverage: $("report-coverage"),
  reportTotalAcs: $("report-total-acs"),
  reportSummaryText: $("report-summary-text"),
  reportHighlights: $("report-highlights"),
  reportRankingList: $("report-ranking-list"),
  installButton: $("btn-install-app"),
  updateButton: $("btn-update-app"),
  appVersion: $("app-version"),
  emptyLaunchHint: $("empty-launch-hint")
};


let deferredInstallPrompt = null;

function isRunningAsInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function updateInstallButton() {
  if (!els.installButton) return;
  els.installButton.classList.toggle("hidden", isRunningAsInstalledApp());
}

async function installApp() {
  if (isRunningAsInstalledApp()) {
    alert("O sistema já está aberto como aplicativo instalado.");
    updateInstallButton();
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    updateInstallButton();
    return;
  }

  alert("Para instalar: no celular, abra este sistema pelo Chrome/Edge, toque no menu de três pontos e escolha 'Instalar app' ou 'Adicionar à tela inicial'. No iPhone, use o botão Compartilhar e depois 'Adicionar à Tela de Início'.");
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallButton();
});

async function clearOldAppCaches() {
  if (!("caches" in window)) return;

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(APP_CACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

async function registerAutoUpdateServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register(`./service-worker.js?v=${encodeURIComponent(APP_VERSION)}`, {
      updateViaCache: "none"
    });

    registration.update();

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
  } catch (error) {
    console.warn("Service worker não registrado:", error);
  }
}

let reloadingForUpdate = false;
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    const storedVersion = localStorage.getItem("ACS_APP_VERSION");
    if (storedVersion !== APP_VERSION) {
      await clearOldAppCaches();
      localStorage.setItem("ACS_APP_VERSION", APP_VERSION);
    }

    await registerAutoUpdateServiceWorker();
  });
}

async function forceAppUpdate() {
  try {
    showMessage(els.authMessage || els.visitsMessage, "Atualizando o sistema...");
  } catch (_) {}

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  await clearOldAppCaches();
  localStorage.setItem("ACS_APP_VERSION", APP_VERSION);

  const url = new URL(window.location.href);
  url.searchParams.set("v", APP_VERSION);
  window.location.replace(url.toString());
}

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle("error", isError);
}

function normalizeText(text) {
  return String(text || "").trim();
}

function currentYear() {
  return new Date().getFullYear();
}

function currentMonthNumber() {
  return new Date().getMonth() + 1;
}

function fillYearSelects() {
  const year = currentYear();
  const years = [year - 2, year - 1, year, year + 1];

  [els.yearSelect, els.adminYearSelect, els.reportYearSelect].filter(Boolean).forEach((select) => {
    select.innerHTML = "";
    years.forEach((ano) => {
      const option = document.createElement("option");
      option.value = ano;
      option.textContent = ano;
      if (ano === year) option.selected = true;
      select.appendChild(option);
    });
  });

  if (els.adminMonthSelect) els.adminMonthSelect.value = String(currentMonthNumber());
  if (els.reportStartMonth) els.reportStartMonth.value = String(currentMonthNumber());
  if (els.reportEndMonth) els.reportEndMonth.value = String(currentMonthNumber());
}

function showAuth() {
  els.loading.classList.add("hidden");
  els.appArea.classList.add("hidden");
  els.authArea.classList.remove("hidden");
}

function showApp() {
  els.loading.classList.add("hidden");
  els.authArea.classList.add("hidden");
  els.appArea.classList.remove("hidden");
}

function openTab(tab) {
  const isAdminTab = tab === "admin";
  const isReportsTab = tab === "relatorios";
  const isDashboardTab = !isAdminTab && !isReportsTab;

  els.tabEnfermeira.classList.toggle("active", isDashboardTab);
  if (els.tabRelatorios) els.tabRelatorios.classList.toggle("active", isReportsTab);
  els.tabAdmin.classList.toggle("active", isAdminTab);

  els.enfermeiraPanel.classList.toggle("hidden", !isDashboardTab);
  if (els.relatoriosPanel) els.relatoriosPanel.classList.toggle("hidden", !isReportsTab);
  els.adminPanel.classList.toggle("hidden", !isAdminTab);

  if (isAdminTab) loadAdminDashboard();
  if (isReportsTab) loadReportsData();
}

function emailKey(email) {
  return String(email || "").trim().toLowerCase();
}

function isOwnerAdminEmail(email) {
  return ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(emailKey(email));
}

async function isAuthorizedAdminEmail(email) {
  const key = emailKey(email);
  if (!key) return false;
  if (isOwnerAdminEmail(key)) return true;

  try {
    const snap = await getDoc(doc(db, "adminEmails", key));
    return snap.exists() && snap.data().ativo === true;
  } catch (error) {
    return false;
  }
}

async function loadUserProfile(user) {
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Seu login existe, mas o perfil não foi encontrado no Firestore. Crie a conta pelo botão de cadastro do sistema ou cadastre o perfil manualmente.");
  }

  return { id: snap.id, ...snap.data() };
}

async function registerUser() {
  const nome = normalizeText($("register-name").value);
  const posto = normalizeText($("register-posto").value);
  const email = normalizeText($("register-email").value).toLowerCase();
  const senha = $("register-password").value;
  const confirmar = $("register-password-confirm").value;

  if (!nome || !posto || !email || !senha || !confirmar) {
    showMessage(els.authMessage, "Preencha todos os campos.", true);
    return;
  }

  if (senha !== confirmar) {
    showMessage(els.authMessage, "As senhas não conferem.", true);
    return;
  }

  if (senha.length < 6) {
    showMessage(els.authMessage, "A senha precisa ter pelo menos 6 caracteres.", true);
    return;
  }

  try {
    showMessage(els.authMessage, "Criando conta...");
    const credential = await createUserWithEmailAndPassword(auth, email, senha);
    const tipo = await isAuthorizedAdminEmail(email) ? "admin" : "enfermeira";

    await setDoc(doc(db, "usuarios", credential.user.uid), {
      nome,
      email,
      posto,
      tipo,
      ativo: true,
      criadoEm: serverTimestamp()
    });

    showMessage(els.authMessage, "Cadastro criado com sucesso!");
  } catch (error) {
    showMessage(els.authMessage, traduzErroFirebase(error), true);
  }
}

async function loginUser() {
  const email = normalizeText($("login-email").value).toLowerCase();
  const senha = $("login-password").value;

  if (!email || !senha) {
    showMessage(els.authMessage, "Digite e-mail e senha.", true);
    return;
  }

  try {
    showMessage(els.authMessage, "Entrando...");
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    showMessage(els.authMessage, traduzErroFirebase(error), true);
  }
}

async function resetPassword() {
  const email = normalizeText($("login-email").value).toLowerCase();

  if (!email) {
    showMessage(els.authMessage, "Digite seu e-mail no campo de login para recuperar a senha.", true);
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showMessage(els.authMessage, "E-mail de recuperação enviado. Verifique a caixa de entrada e o spam.");
  } catch (error) {
    showMessage(els.authMessage, traduzErroFirebase(error), true);
  }
}

function traduzErroFirebase(error) {
  const code = error?.code || "";

  const mensagens = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "Senha fraca. Use pelo menos 6 caracteres.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "permission-denied": "Sem permissão no Firestore. Confira as regras de segurança."
  };

  return mensagens[code] || error?.message || "Ocorreu um erro inesperado.";
}

async function addAcs() {
  const nome = normalizeText($("acs-name").value);
  const microarea = normalizeText($("acs-microarea").value);

  if (!nome) {
    showMessage(els.acsMessage, "Digite o nome do ACS.", true);
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "acs"), {
      nome,
      microarea,
      posto: currentProfile.posto,
      enfermeiraId: currentUser.uid,
      enfermeiraNome: currentProfile.nome,
      ativo: true,
      criadoEm: serverTimestamp()
    });

    const novoAcs = {
      id: docRef.id,
      nome,
      microarea,
      posto: currentProfile.posto,
      enfermeiraId: currentUser.uid,
      enfermeiraNome: currentProfile.nome,
      ativo: true
    };

    $("acs-name").value = "";
    $("acs-microarea").value = "";
    showMessage(els.acsMessage, "ACS cadastrado com sucesso! A tela de lançamento de visitas foi aberta logo abaixo.");
    await selectAcs(novoAcs);
  } catch (error) {
    showMessage(els.acsMessage, traduzErroFirebase(error), true);
  }
}

function listenAcs() {
  if (unsubscribeAcs) unsubscribeAcs();

  let q;
  if (currentProfile.tipo === "admin") {
    q = query(collection(db, "acs"), where("ativo", "==", true));
  } else {
    q = query(
      collection(db, "acs"),
      where("enfermeiraId", "==", currentUser.uid),
      where("ativo", "==", true)
    );
  }

  unsubscribeAcs = onSnapshot(q, (snapshot) => {
    acsCache = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome)));

    renderAcsList();
    populateReportAcsOptions();
    els.totalAcs.textContent = acsCache.length;
    loadCurrentMonthTotal();
  }, (error) => {
    els.acsList.innerHTML = `<div class="empty-box">Erro ao carregar ACS: ${traduzErroFirebase(error)}</div>`;
  });
}

function getInitials(name) {
  const words = String(name || "ACS").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "ACS";
  const first = words[0]?.[0] || "A";
  const last = words.length > 1 ? words[words.length - 1]?.[0] : words[0]?.[1];
  return `${first}${last || ""}`.toUpperCase();
}

function renderAcsList() {
  const filtro = normalizeText(els.searchAcs.value).toLowerCase();
  const lista = acsCache.filter((acs) =>
    String(acs.nome || "").toLowerCase().includes(filtro) ||
    String(acs.microarea || "").toLowerCase().includes(filtro)
  );

  if (!lista.length) {
    els.acsList.innerHTML = `<div class="empty-box">Nenhum ACS encontrado.</div>`;
    return;
  }

  els.acsList.innerHTML = "";

  lista.forEach((acs) => {
    const item = document.createElement("div");
    item.className = `acs-item clickable ${selectedAcs?.id === acs.id ? "selected" : ""}`;
    item.dataset.initials = getInitials(acs.nome);
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(acs.nome)}</strong>
        <span class="muted">Microárea: ${escapeHtml(acs.microarea || "Não informada")}</span>
        <small class="acs-hint">População informada mês a mês</small>
      </div>
      <button class="secondary-btn acs-launch-btn">Abrir lançamento</button>
    `;

    item.addEventListener("click", () => selectAcs(acs));
    item.querySelector("button").addEventListener("click", (event) => {
      event.stopPropagation();
      selectAcs(acs);
    });
    els.acsList.appendChild(item);
  });
}

async function selectAcs(acs) {
  selectedAcs = acs;
  els.visitasCard.classList.remove("hidden");
  if (els.emptyLaunchHint) els.emptyLaunchHint.classList.add("hidden");
  showMessage(els.visitsMessage, "");
  els.selectedAcsTitle.textContent = `Lançamento de visitas mensais`;
  els.selectedAcsSubtitle.textContent = `ACS selecionado: ${acs.nome} • Posto: ${acs.posto} • Microárea: ${acs.microarea || "não informada"} • Para corrigir, altere os campos e salve novamente.`;
  renderAcsList();

  // Abre os 12 meses imediatamente, antes mesmo de consultar o Firestore.
  // Assim a enfermeira sempre verá os campos: cidadãos do mês + visitas do mês.
  montarCamposMensais({});

  await renderMonthsForSelectedAcs();
  els.visitasCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function renderMonthsForSelectedAcs() {
  if (!selectedAcs) return;

  const ano = Number(els.yearSelect.value);
  const visitasPorMes = {};

  // Primeiro monta os campos vazios, assim a enfermeira sempre vê onde lançar.
  // Depois, se já existir lançamento salvo, os valores são carregados por cima.
  montarCamposMensais(visitasPorMes);

  try {
    const filtros = [
      where("acsId", "==", selectedAcs.id),
      where("ano", "==", ano)
    ];

    // Importante para as regras do Firestore: a enfermeira só pode consultar os documentos dela.
    // Sem este filtro, a consulta podia ser bloqueada e os campos de visitas ficavam invisíveis.
    if (currentProfile?.tipo !== "admin") {
      filtros.push(where("enfermeiraId", "==", currentUser.uid));
    }

    const q = query(collection(db, "visitas"), ...filtros);
    const snap = await getDocs(q);

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      visitasPorMes[data.mes] = {
        quantidade: Number(data.quantidade || 0),
        pessoasCadastradas: Number(data.pessoasCadastradas ?? 0)
      };
    });

    els.monthsGrid.innerHTML = "";
    montarCamposMensais(visitasPorMes);
  } catch (error) {
    console.error("Erro ao carregar lançamentos mensais:", error);
    showMessage(els.visitsMessage, "Os campos foram abertos. Se valores antigos não aparecerem, confira as regras do Firestore e salve novamente.", true);
  }
}

function coberturaClasse(percentual) {
  if (percentual <= 0) return "coverage-zero";
  if (percentual < 70) return "coverage-low";
  if (percentual < 85) return "coverage-medium";
  return "coverage-good";
}

function montarCamposMensais(visitasPorMes) {
  if (!els.monthsGrid) return;
  els.monthsGrid.innerHTML = "";

  meses.forEach((mesNome, index) => {
    const mesNumero = index + 1;
    const dadosMes = visitasPorMes[mesNumero] || { quantidade: 0, pessoasCadastradas: 0 };
    const quantidadeAtual = Number(dadosMes.quantidade || 0);
    const pessoasAtual = Number(dadosMes.pessoasCadastradas || 0);
    const percentualAtual = calcularPercentual(quantidadeAtual, pessoasAtual);
    const box = document.createElement("div");
    box.className = "month-box";
    box.dataset.monthBox = String(mesNumero);
    box.innerHTML = `
      <label>${mesNome}</label>
      <div class="month-fields">
        <div>
          <span>Cidadãos cadastrados</span>
          <input
            type="number"
            min="0"
            step="1"
            data-month="${mesNumero}"
            data-field="pessoas"
            value="${pessoasAtual}"
            placeholder="Ex.: 500"
          />
        </div>
        <div>
          <span>Visitas realizadas</span>
          <input
            type="number"
            min="0"
            step="1"
            data-month="${mesNumero}"
            data-field="visitas"
            value="${quantidadeAtual}"
            placeholder="Ex.: 400"
          />
        </div>
      </div>
      <small class="coverage-info ${coberturaClasse(percentualAtual)}">Cobertura: <strong>${percentualAtual}%</strong></small>
    `;

    const atualizarCobertura = () => {
      const pessoas = Number(box.querySelector('input[data-field="pessoas"]').value || 0);
      const visitas = Number(box.querySelector('input[data-field="visitas"]').value || 0);
      const percentual = calcularPercentual(visitas, pessoas);
      const badge = box.querySelector(".coverage-info");
      badge.classList.remove("coverage-zero", "coverage-low", "coverage-medium", "coverage-good");
      badge.classList.add(coberturaClasse(percentual));
      badge.querySelector("strong").textContent = `${percentual}%`;
    };

    box.querySelectorAll("input").forEach((input) => input.addEventListener("input", atualizarCobertura));

    els.monthsGrid.appendChild(box);
  });

  if (!els.monthsGrid.children.length) {
    els.monthsGrid.innerHTML = `<div class="empty-box">Não foi possível montar os campos. Atualize o sistema e tente novamente.</div>`;
  }
}

function calcularPercentual(visitas, pessoas) {
  const totalPessoas = Number(pessoas || 0);
  const totalVisitas = Number(visitas || 0);

  if (!totalPessoas || totalPessoas <= 0) return 0;
  return Math.round((totalVisitas / totalPessoas) * 100);
}

async function saveVisits() {
  if (!selectedAcs) return;

  const ano = Number(els.yearSelect.value);
  const monthBoxes = Array.from(els.monthsGrid.querySelectorAll(".month-box"));

  if (!monthBoxes.length) {
    showMessage(els.visitsMessage, "Os campos de lançamento ainda não carregaram. Toque novamente em Abrir lançamento de visitas.", true);
    return;
  }

  try {
    showMessage(els.visitsMessage, "Salvando...");

    for (const box of monthBoxes) {
      const pessoasInput = box.querySelector('input[data-field="pessoas"]');
      const visitasInput = box.querySelector('input[data-field="visitas"]');
      const mes = Number(pessoasInput.dataset.month);
      const pessoasCadastradas = Number(pessoasInput.value || 0);
      const quantidade = Number(visitasInput.value || 0);
      const coberturaPercentual = calcularPercentual(quantidade, pessoasCadastradas);

      if (!Number.isInteger(pessoasCadastradas) || !Number.isInteger(quantidade) || pessoasCadastradas < 0 || quantidade < 0) {
        showMessage(els.visitsMessage, "Use apenas números inteiros e positivos nos lançamentos.", true);
        return;
      }

      if (quantidade > 0 && pessoasCadastradas <= 0) {
        showMessage(els.visitsMessage, "Quando houver visitas no mês, informe também o total de cidadãos cadastrados daquele mês.", true);
        return;
      }

      const visitId = `${selectedAcs.id}_${ano}_${mes}`;
      await setDoc(doc(db, "visitas", visitId), {
        acsId: selectedAcs.id,
        nomeAcs: selectedAcs.nome,
        enfermeiraId: selectedAcs.enfermeiraId,
        nomeEnfermeira: selectedAcs.enfermeiraNome,
        posto: selectedAcs.posto,
        pessoasCadastradas,
        coberturaPercentual,
        ano,
        mes,
        quantidade,
        atualizadoEm: serverTimestamp(),
        atualizadoPor: currentUser.uid,
        atualizadoPorEmail: currentUser.email || "",
        atualizadoPorNome: currentProfile.nome || currentUser.email || ""
      }, { merge: true });
    }

    showMessage(els.visitsMessage, "Lançamentos salvos/atualizados com sucesso!");
    loadCurrentMonthTotal();
  } catch (error) {
    showMessage(els.visitsMessage, traduzErroFirebase(error), true);
  }
}

async function loadCurrentMonthTotal() {
  if (!currentUser || !currentProfile || currentProfile.tipo === "admin") return;

  try {
    const q = query(
      collection(db, "visitas"),
      where("enfermeiraId", "==", currentUser.uid),
      where("ano", "==", currentYear()),
      where("mes", "==", currentMonthNumber())
    );

    const snap = await getDocs(q);
    let total = 0;
    let somaPercentual = 0;
    let mesesComBase = 0;

    snap.forEach((item) => {
      const data = item.data();
      total += Number(data.quantidade || 0);
      if (Number(data.pessoasCadastradas || 0) > 0) {
        somaPercentual += Number(data.coberturaPercentual ?? calcularPercentual(data.quantidade, data.pessoasCadastradas));
        mesesComBase += 1;
      }
    });

    els.totalCurrentMonth.textContent = total;
    if (els.avgCurrentCoverage) {
      els.avgCurrentCoverage.textContent = mesesComBase ? `${Math.round(somaPercentual / mesesComBase)}%` : "0%";
    }
  } catch (error) {
    els.totalCurrentMonth.textContent = "-";
    if (els.avgCurrentCoverage) els.avgCurrentCoverage.textContent = "-";
  }
}


function monthName(mes) {
  return meses[(Number(mes) || 1) - 1] || "-";
}

function periodoLabel(inicio, fim, ano) {
  if (inicio === 1 && fim === 12) return `Ano completo de ${ano}`;
  if (inicio === fim) return `${monthName(inicio)} de ${ano}`;
  return `${monthName(inicio)} a ${monthName(fim)} de ${ano}`;
}

function populateReportAcsOptions() {
  if (!els.reportAcsSelect) return;

  const currentValue = els.reportAcsSelect.value;
  els.reportAcsSelect.innerHTML = `<option value="">Todos os ACS</option>`;

  acsCache
    .slice()
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome)))
    .forEach((acs) => {
      const option = document.createElement("option");
      option.value = acs.id;
      option.textContent = `${acs.nome}${acs.microarea ? ` — Microárea ${acs.microarea}` : ""}${currentProfile?.tipo === "admin" ? ` — ${acs.posto}` : ""}`;
      els.reportAcsSelect.appendChild(option);
    });

  if ([...els.reportAcsSelect.options].some((option) => option.value === currentValue)) {
    els.reportAcsSelect.value = currentValue;
  }
}

function getReportTypeMeta(type) {
  const meta = {
    monthly_all: {
      label: "Mês de todos os ACS",
      help: "Mostra todos os ACS no mês selecionado. Ideal para fechar a produção mensal do posto.",
      startLabel: "Mês",
      showEnd: false,
      acsRequired: false,
      acsOptional: true,
      periodText: "um único mês"
    },
    period_all: {
      label: "Período de todos os ACS",
      help: "Mostra todos os lançamentos entre o mês inicial e final. Exemplo: janeiro a março de toda a equipe.",
      startLabel: "Mês inicial",
      showEnd: true,
      acsRequired: false,
      acsOptional: true,
      periodText: "um período"
    },
    period_acs: {
      label: "Período de um ACS específico",
      help: "Escolha um ACS e defina o intervalo. Ideal para ver 2, 3 ou mais meses de uma pessoa específica.",
      startLabel: "Mês inicial",
      showEnd: true,
      acsRequired: true,
      acsOptional: false,
      periodText: "um período de um ACS"
    },
    annual_acs: {
      label: "Ano completo de um ACS",
      help: "Escolha um ACS. O sistema mostra janeiro a dezembro do ano escolhido.",
      startLabel: "Janeiro a dezembro",
      showEnd: false,
      acsRequired: true,
      acsOptional: false,
      periodText: "o ano completo"
    },
    ranking_coverage: {
      label: "Ranking de cobertura",
      help: "Agrupa o período escolhido e ordena os ACS pela maior cobertura.",
      startLabel: "Mês inicial",
      showEnd: true,
      acsRequired: false,
      acsOptional: true,
      periodText: "ranking do período"
    },
    consolidated: {
      label: "Consolidado por posto/enfermeira",
      help: "Agrupa visitas, cidadãos e cobertura por posto e enfermeira. Para admin, compara as unidades; para enfermeira, consolida o próprio posto.",
      startLabel: "Mês inicial",
      showEnd: true,
      acsRequired: false,
      acsOptional: false,
      periodText: "consolidado do período"
    }
  };
  return meta[type] || meta.monthly_all;
}

function updateReportTemplateCards(type) {
  document.querySelectorAll("[data-report-template]").forEach((button) => {
    const active = button.dataset.reportTemplate === type;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function toggleReportField(field, visible) {
  if (!field) return;
  field.classList.toggle("field-hidden", !visible);
  const control = field.querySelector("input, select");
  if (control) control.disabled = !visible;
}

function updateReportPreview() {
  if (!els.reportPreview || !els.reportType) return;
  const config = getReportConfig();
  const meta = getReportTypeMeta(config.type);
  const acsText = config.acsId
    ? (acsCache.find((item) => item.id === config.acsId)?.nome || "ACS selecionado")
    : (meta.acsRequired ? "nenhum ACS selecionado" : "todos os ACS");
  const pesquisaText = config.search ? ` • Pesquisa: “${escapeHtml(config.search)}”` : "";
  els.reportPreview.innerHTML = `<strong>Resumo do filtro:</strong> <span>${escapeHtml(meta.label)} • ${escapeHtml(periodoLabel(config.inicio, config.fim, config.ano))} • ${escapeHtml(acsText)}${pesquisaText}</span>`;
}

function updateReportHelp() {
  if (!els.reportHelp || !els.reportType) return;
  const type = els.reportType.value;
  const meta = getReportTypeMeta(type);

  els.reportHelp.textContent = meta.help;
  updateReportTemplateCards(type);

  const startField = els.reportStartMonth?.closest(".field-group");
  const endField = els.reportEndMonth?.closest(".field-group");
  const acsField = els.reportAcsSelect?.closest(".field-group");

  if (els.reportStartLabel) els.reportStartLabel.textContent = meta.startLabel;

  if (type === "monthly_all") {
    els.reportEndMonth.value = els.reportStartMonth.value;
  }

  if (type === "annual_acs") {
    els.reportStartMonth.value = "1";
    els.reportEndMonth.value = "12";
  }

  toggleReportField(startField, type !== "annual_acs");
  toggleReportField(endField, meta.showEnd);
  toggleReportField(acsField, meta.acsRequired || meta.acsOptional);

  if (!meta.acsRequired && !meta.acsOptional && els.reportAcsSelect) {
    els.reportAcsSelect.value = "";
  }

  if (acsField) {
    acsField.classList.toggle("required-filter", meta.acsRequired);
  }

  if (els.reportAcsHint) {
    if (meta.acsRequired) {
      els.reportAcsHint.textContent = "Obrigatório para este relatório.";
    } else if (meta.acsOptional) {
      els.reportAcsHint.textContent = "Opcional para filtrar somente um ACS.";
    } else {
      els.reportAcsHint.textContent = "Este modelo usa dados consolidados.";
    }
  }

  updateReportPreview();
}

async function loadReportsData() {
  if (!currentUser || !currentProfile || !els.reportTableBody) return;

  populateReportAcsOptions();
  updateReportHelp();
  showMessage(els.reportMessage, "Carregando dados do relatório...");

  try {
    let snap;
    if (currentProfile.tipo === "admin") {
      snap = await getDocs(collection(db, "visitas"));
    } else {
      snap = await getDocs(query(collection(db, "visitas"), where("enfermeiraId", "==", currentUser.uid)));
    }

    reportsRawData = [];
    snap.forEach((item) => reportsRawData.push({ id: item.id, ...item.data() }));

    showMessage(els.reportMessage, "");
    renderReports();
  } catch (error) {
    showMessage(els.reportMessage, `Erro ao carregar relatórios: ${traduzErroFirebase(error)}`, true);
  }
}

function getReportConfig() {
  const type = els.reportType.value;
  const ano = Number(els.reportYearSelect.value);
  let inicio = Number(els.reportStartMonth.value);
  let fim = Number(els.reportEndMonth.value);
  const acsId = els.reportAcsSelect.value;
  const search = normalizeText(els.reportSearch.value).toLowerCase();

  if (type === "monthly_all") fim = inicio;
  if (type === "annual_acs") {
    inicio = 1;
    fim = 12;
  }

  if (inicio > fim) [inicio, fim] = [fim, inicio];

  return { type, ano, inicio, fim, acsId, search };
}

function getFilteredReportVisits(config) {
  const needsAcs = config.type === "period_acs" || config.type === "annual_acs";
  if (needsAcs && !config.acsId) {
    showMessage(els.reportMessage, "Escolha um ACS para esse tipo de relatório.", true);
    return [];
  }

  showMessage(els.reportMessage, "");

  return reportsRawData
    .filter((item) => Number(item.ano) === config.ano)
    .filter((item) => Number(item.mes) >= config.inicio && Number(item.mes) <= config.fim)
    .filter((item) => !config.acsId || item.acsId === config.acsId)
    .filter((item) => Number(item.quantidade || 0) > 0 || Number(item.pessoasCadastradas || 0) > 0)
    .filter((item) => {
      if (!config.search) return true;
      const text = `${item.posto || ""} ${item.nomeEnfermeira || ""} ${item.nomeAcs || ""} ${getAcsMicroarea(item.acsId)}`.toLowerCase();
      return text.includes(config.search);
    });
}

function getAcsMicroarea(acsId) {
  const acs = acsCache.find((item) => item.id === acsId);
  return acs?.microarea || "";
}

function aggregateRowsBy(visits, keyFn, labelFn) {
  const map = new Map();

  visits.forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, {
        periodo: "",
        posto: item.posto || "-",
        nomeEnfermeira: item.nomeEnfermeira || "-",
        nomeAcs: item.nomeAcs || "-",
        microarea: getAcsMicroarea(item.acsId),
        pessoasCadastradas: 0,
        quantidade: 0,
        meses: new Set(),
        coberturaPercentual: 0,
        sortName: "",
        acsId: item.acsId || "",
        editavel: false
      });
    }

    const row = map.get(key);
    row.pessoasCadastradas += Number(item.pessoasCadastradas || 0);
    row.quantidade += Number(item.quantidade || 0);
    row.meses.add(Number(item.mes));
    labelFn(row, item);
  });

  return [...map.values()].map((row) => {
    row.coberturaPercentual = calcularPercentual(row.quantidade, row.pessoasCadastradas);
    row.periodo = row.periodo || `${row.meses.size} mês(es)`;
    return row;
  });
}

function buildReportRows(visits, config) {
  if (config.type === "ranking_coverage") {
    return aggregateRowsBy(
      visits,
      (item) => item.acsId,
      (row, item) => {
        row.periodo = periodoLabel(config.inicio, config.fim, config.ano);
        row.posto = item.posto || "-";
        row.nomeEnfermeira = item.nomeEnfermeira || "-";
        row.nomeAcs = item.nomeAcs || "-";
        row.microarea = getAcsMicroarea(item.acsId);
        row.sortName = item.nomeAcs || "";
      }
    ).sort((a, b) => Number(b.coberturaPercentual) - Number(a.coberturaPercentual) || String(a.nomeAcs).localeCompare(String(b.nomeAcs)));
  }

  if (config.type === "consolidated") {
    return aggregateRowsBy(
      visits,
      (item) => `${item.posto || ""}|${item.nomeEnfermeira || ""}`,
      (row, item) => {
        row.periodo = periodoLabel(config.inicio, config.fim, config.ano);
        row.posto = item.posto || "-";
        row.nomeEnfermeira = item.nomeEnfermeira || "-";
        row.nomeAcs = "Todos os ACS";
        row.microarea = "-";
        row.sortName = `${item.posto || ""} ${item.nomeEnfermeira || ""}`;
      }
    ).sort((a, b) => String(a.posto).localeCompare(String(b.posto)) || String(a.nomeEnfermeira).localeCompare(String(b.nomeEnfermeira)));
  }

  return visits
    .map((item) => ({
      periodo: `${monthName(item.mes)} de ${item.ano}`,
      acsId: item.acsId || "",
      ano: Number(item.ano || config.ano),
      visitId: item.id || "",
      editavel: true,
      posto: item.posto || "-",
      nomeEnfermeira: item.nomeEnfermeira || "-",
      nomeAcs: item.nomeAcs || "-",
      microarea: getAcsMicroarea(item.acsId) || "-",
      pessoasCadastradas: Number(item.pessoasCadastradas || 0),
      quantidade: Number(item.quantidade || 0),
      coberturaPercentual: Number(item.coberturaPercentual ?? calcularPercentual(item.quantidade, item.pessoasCadastradas)),
      mes: Number(item.mes || 0),
      sortName: item.nomeAcs || ""
    }))
    .sort((a, b) => String(a.posto).localeCompare(String(b.posto)) || String(a.nomeAcs).localeCompare(String(b.nomeAcs)) || Number(a.mes) - Number(b.mes));
}

function reportTypeTitle(type) {
  const titles = {
    monthly_all: "Relatório mensal de todos os ACS",
    period_all: "Relatório por período de todos os ACS",
    period_acs: "Relatório por período de ACS específico",
    annual_acs: "Relatório anual de ACS específico",
    ranking_coverage: "Ranking de cobertura dos ACS",
    consolidated: "Relatório consolidado por posto/enfermeira"
  };
  return titles[type] || "Relatório";
}

function renderReports() {
  if (!els.reportTableBody) return;

  updateReportHelp();
  const config = getReportConfig();
  const visits = getFilteredReportVisits(config);
  reportsRenderedRows = buildReportRows(visits, config);

  const totalVisitas = reportsRenderedRows.reduce((sum, item) => sum + Number(item.quantidade || 0), 0);
  const totalCidadaos = reportsRenderedRows.reduce((sum, item) => sum + Number(item.pessoasCadastradas || 0), 0);
  const coberturaGeral = calcularPercentual(totalVisitas, totalCidadaos);
  const acsUnicos = new Set(visits.map((item) => item.acsId).filter(Boolean));

  els.reportTotalVisits.textContent = totalVisitas;
  els.reportTotalCitizens.textContent = totalCidadaos;
  els.reportCoverage.textContent = `${coberturaGeral}%`;
  els.reportTotalAcs.textContent = acsUnicos.size;
  els.reportTitle.textContent = reportTypeTitle(config.type);
  els.reportSubtitle.textContent = `${periodoLabel(config.inicio, config.fim, config.ano)} • ${currentProfile.tipo === "admin" ? "Todos os postos conforme filtros" : `Posto ${currentProfile.posto}`}`;

  renderReportTable(reportsRenderedRows);
  renderReportInsights(reportsRenderedRows, visits, config, totalVisitas, totalCidadaos, coberturaGeral);
}

function renderReportTable(rows) {
  if (!rows.length) {
    els.reportTableBody.innerHTML = `<tr><td colspan="9">Nenhum dado encontrado para esse filtro.</td></tr>`;
    return;
  }

  els.reportTableBody.innerHTML = rows.map((item) => {
    const percent = Number(item.coberturaPercentual || 0);
    return `
      <tr>
        <td>${escapeHtml(item.periodo)}</td>
        <td>${escapeHtml(item.posto)}</td>
        <td>${escapeHtml(item.nomeEnfermeira)}</td>
        <td><strong>${escapeHtml(item.nomeAcs)}</strong></td>
        <td>${escapeHtml(item.microarea || "-")}</td>
        <td>${Number(item.pessoasCadastradas || 0)}</td>
        <td><strong>${Number(item.quantidade || 0)}</strong></td>
        <td><span class="coverage-chip ${coberturaClasse(percent)}">${percent}%</span></td>
        <td>${item.editavel && item.acsId && item.ano && item.mes ? `<button type="button" class="table-edit-btn" data-edit-launch="1" data-acs-id="${escapeHtml(item.acsId)}" data-ano="${Number(item.ano)}" data-mes="${Number(item.mes)}">Editar</button>` : `<span class="muted">-</span>`}</td>
      </tr>
    `;
  }).join("");
  bindEditLaunchButtons(els.reportTableBody, reportsRenderedRows);
}

function renderReportInsights(rows, visits, config, totalVisitas, totalCidadaos, coberturaGeral) {
  if (!rows.length) {
    els.reportSummaryText.textContent = "Nenhum lançamento encontrado para o filtro escolhido.";
    els.reportHighlights.innerHTML = `<div class="empty-box">Tente mudar o período, escolher outro ACS ou limpar a pesquisa.</div>`;
    els.reportRankingList.innerHTML = `<div class="empty-box">Sem dados para ranking.</div>`;
    return;
  }

  const maior = [...rows].sort((a, b) => Number(b.coberturaPercentual || 0) - Number(a.coberturaPercentual || 0))[0];
  const menor = [...rows].sort((a, b) => Number(a.coberturaPercentual || 0) - Number(b.coberturaPercentual || 0))[0];
  const totalRegistros = visits.length;

  els.reportSummaryText.textContent = `${reportTypeTitle(config.type)} — ${periodoLabel(config.inicio, config.fim, config.ano)}.`;
  els.reportHighlights.innerHTML = `
    <div class="highlight-line"><span>Registros considerados</span><strong>${totalRegistros}</strong></div>
    <div class="highlight-line"><span>Visitas no filtro</span><strong>${totalVisitas}</strong></div>
    <div class="highlight-line"><span>Cidadãos no filtro</span><strong>${totalCidadaos}</strong></div>
    <div class="highlight-line"><span>Cobertura geral</span><strong>${coberturaGeral}%</strong></div>
    <div class="highlight-line"><span>Maior cobertura</span><strong>${escapeHtml(maior.nomeAcs)} • ${Number(maior.coberturaPercentual || 0)}%</strong></div>
    <div class="highlight-line"><span>Menor cobertura</span><strong>${escapeHtml(menor.nomeAcs)} • ${Number(menor.coberturaPercentual || 0)}%</strong></div>
  `;

  const ranking = aggregateRowsBy(
    visits,
    (item) => item.acsId,
    (row, item) => {
      row.periodo = periodoLabel(config.inicio, config.fim, config.ano);
      row.posto = item.posto || "-";
      row.nomeEnfermeira = item.nomeEnfermeira || "-";
      row.nomeAcs = item.nomeAcs || "-";
      row.microarea = getAcsMicroarea(item.acsId);
    }
  ).sort((a, b) => Number(b.coberturaPercentual || 0) - Number(a.coberturaPercentual || 0)).slice(0, 5);

  els.reportRankingList.innerHTML = ranking.map((item, index) => `
    <div class="ranking-item">
      <span class="rank-number">${index + 1}</span>
      <div>
        <strong>${escapeHtml(item.nomeAcs)}</strong>
        <small>${escapeHtml(item.posto)} • ${Number(item.quantidade || 0)} visitas</small>
      </div>
      <span class="coverage-chip ${coberturaClasse(item.coberturaPercentual)}">${Number(item.coberturaPercentual || 0)}%</span>
    </div>
  `).join("");
}

function ensureYearOption(select, ano) {
  if (!select || !ano) return;
  const exists = [...select.options].some((option) => Number(option.value) === Number(ano));
  if (!exists) {
    const option = document.createElement("option");
    option.value = String(ano);
    option.textContent = String(ano);
    select.appendChild(option);
  }
}

function findVisitSourceRow(acsId, ano, mes) {
  const id = String(acsId || "");
  const year = Number(ano);
  const month = Number(mes);
  return reportsRawData.find((item) => item.acsId === id && Number(item.ano) === year && Number(item.mes) === month)
    || adminReportData.find((item) => item.acsId === id && Number(item.ano) === year && Number(item.mes) === month)
    || {};
}

function buildAcsFallback(acsId, sourceRow = {}) {
  return {
    id: acsId,
    nome: sourceRow.nomeAcs || "ACS selecionado",
    microarea: getAcsMicroarea(acsId) || sourceRow.microarea || "",
    posto: sourceRow.posto || currentProfile?.posto || "-",
    enfermeiraId: sourceRow.enfermeiraId || currentUser?.uid || "",
    enfermeiraNome: sourceRow.nomeEnfermeira || currentProfile?.nome || ""
  };
}

function highlightMonthForEditing(mes) {
  const monthBox = els.monthsGrid?.querySelector(`[data-month-box="${Number(mes)}"]`);
  if (!monthBox) return;

  els.monthsGrid.querySelectorAll(".editing-month").forEach((box) => box.classList.remove("editing-month"));
  monthBox.classList.add("editing-month");
  monthBox.scrollIntoView({ behavior: "smooth", block: "center" });

  const visitasInput = monthBox.querySelector('input[data-field="visitas"]');
  const pessoasInput = monthBox.querySelector('input[data-field="pessoas"]');
  setTimeout(() => {
    (visitasInput || pessoasInput)?.focus();
    (visitasInput || pessoasInput)?.select?.();
  }, 350);
}

async function openEditLaunch(acsId, ano, mes) {
  if (!acsId || !ano || !mes) {
    alert("Não foi possível identificar o lançamento para edição.");
    return;
  }

  const sourceRow = findVisitSourceRow(acsId, ano, mes);
  const acs = acsCache.find((item) => item.id === acsId) || buildAcsFallback(acsId, sourceRow);

  ensureYearOption(els.yearSelect, ano);
  els.yearSelect.value = String(ano);
  openTab("enfermeira");
  await selectAcs(acs);
  highlightMonthForEditing(mes);
  showMessage(els.visitsMessage, `Editando ${monthName(mes)} de ${ano}. Corrija cidadãos ou visitas e clique em Salvar visitas do ano.`);
}

function bindEditLaunchButtons(container) {
  if (!container) return;

  container.querySelectorAll("[data-edit-launch]").forEach((button) => {
    button.addEventListener("click", async () => {
      await openEditLaunch(button.dataset.acsId, Number(button.dataset.ano), Number(button.dataset.mes));
    });
  });
}


function exportReportCsv() {
  if (!reportsRenderedRows.length) {
    alert("Nenhum dado para exportar no relatório atual.");
    return;
  }

  const header = ["Periodo", "Posto", "Enfermeira", "ACS", "Microarea", "Cidadaos", "Visitas", "Cobertura percentual"];
  const rows = reportsRenderedRows.map((item) => [
    item.periodo,
    item.posto,
    item.nomeEnfermeira,
    item.nomeAcs,
    item.microarea,
    Number(item.pessoasCadastradas || 0),
    Number(item.quantidade || 0),
    `${Number(item.coberturaPercentual || 0)}%`
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-acs-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function printCurrentReport() {
  if (!reportsRenderedRows.length) {
    alert("Gere um relatório antes de imprimir.");
    return;
  }
  window.print();
}


async function addAdminManual() {
  const nome = normalizeText(els.adminName.value);
  const email = emailKey(els.adminEmail.value);
  const posto = normalizeText(els.adminPosto.value) || "Secretaria de Saúde";

  if (!nome || !email) {
    showMessage(els.adminMessage, "Preencha pelo menos nome e e-mail do novo administrador.", true);
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    showMessage(els.adminMessage, "Digite um e-mail válido.", true);
    return;
  }

  try {
    showMessage(els.adminMessage, "Salvando administrador...");

    await setDoc(doc(db, "adminEmails", email), {
      nome,
      email,
      posto,
      ativo: true,
      criadoPor: currentUser.uid,
      criadoPorEmail: currentUser.email,
      criadoEm: serverTimestamp()
    }, { merge: true });

    const usuariosSnap = await getDocs(query(collection(db, "usuarios"), where("email", "==", email)));
    for (const userDoc of usuariosSnap.docs) {
      await updateDoc(doc(db, "usuarios", userDoc.id), {
        tipo: "admin",
        posto,
        atualizadoEm: serverTimestamp()
      });
    }

    els.adminName.value = "";
    els.adminEmail.value = "";
    els.adminPosto.value = "";

    if (usuariosSnap.empty) {
      showMessage(els.adminMessage, "Administrador liberado. Agora ele precisa criar cadastro usando esse mesmo e-mail.");
    } else {
      showMessage(els.adminMessage, "Administrador liberado e perfil existente atualizado para admin.");
    }

    await loadAdminDashboard();
  } catch (error) {
    showMessage(els.adminMessage, traduzErroFirebase(error), true);
  }
}

async function renderAdminList() {
  if (!els.adminList) return;

  const admins = [];
  ADMIN_EMAILS.forEach((email) => {
    admins.push({
      email,
      nome: "Administrador principal",
      posto: "Secretaria de Saúde",
      ativo: true,
      principal: true
    });
  });

  try {
    const snap = await getDocs(collection(db, "adminEmails"));
    snap.forEach((item) => admins.push({ id: item.id, ...item.data() }));
  } catch (error) {
    els.adminList.innerHTML = `<div class="empty-box">Erro ao carregar administradores: ${traduzErroFirebase(error)}</div>`;
    return;
  }

  if (!admins.length) {
    els.adminList.innerHTML = `<div class="empty-box">Nenhum administrador adicional cadastrado.</div>`;
    return;
  }

  els.adminList.innerHTML = admins.map((admin) => `
    <div class="admin-item">
      <div>
        <strong>${escapeHtml(admin.nome || admin.email)}</strong>
        <span class="muted">${escapeHtml(admin.email)} | ${escapeHtml(admin.posto || "Secretaria de Saúde")}</span>
      </div>
      <span class="badge ${admin.ativo === false ? "danger-badge" : "success-badge"}">${admin.principal ? "Principal" : admin.ativo === false ? "Inativo" : "Ativo"}</span>
    </div>
  `).join("");
}

async function loadAdminDashboard() {
  if (!currentProfile || currentProfile.tipo !== "admin") return;

  const ano = Number(els.adminYearSelect.value);
  const mes = Number(els.adminMonthSelect.value);

  const usuariosSnap = await getDocs(collection(db, "usuarios"));
  const acsSnap = await getDocs(query(collection(db, "acs"), where("ativo", "==", true)));

  let visitasQuery = query(collection(db, "visitas"), where("ano", "==", ano));
  if (mes > 0) {
    visitasQuery = query(collection(db, "visitas"), where("ano", "==", ano), where("mes", "==", mes));
  }

  const visitasSnap = await getDocs(visitasQuery);

  const enfermeiras = [];
  const postos = new Set();
  usuariosSnap.forEach((item) => {
    const data = item.data();
    if (data.tipo === "enfermeira") enfermeiras.push(data);
    if (data.posto) postos.add(data.posto);
  });

  adminReportData = [];
  visitasSnap.forEach((item) => adminReportData.push({ id: item.id, ...item.data() }));

  els.adminTotalPostos.textContent = postos.size;
  els.adminTotalEnfermeiras.textContent = enfermeiras.length;
  els.adminTotalAcs.textContent = acsSnap.size;

  renderAdminReport();
  await renderAdminList();
}

function renderAdminReport() {
  const filtro = normalizeText(els.adminSearch.value).toLowerCase();
  const filtrado = adminReportData
    .filter((item) => {
      const text = `${item.posto} ${item.nomeEnfermeira} ${item.nomeAcs}`.toLowerCase();
      return text.includes(filtro);
    })
    .sort((a, b) => {
      const postoCompare = String(a.posto).localeCompare(String(b.posto));
      if (postoCompare !== 0) return postoCompare;
      return String(a.nomeAcs).localeCompare(String(b.nomeAcs));
    });

  let total = 0;
  filtrado.forEach((item) => total += Number(item.quantidade || 0));
  els.adminTotalVisitas.textContent = total;

  if (!filtrado.length) {
    els.adminReportBody.innerHTML = `<tr><td colspan="9">Nenhum dado encontrado.</td></tr>`;
    return;
  }

  els.adminReportBody.innerHTML = filtrado.map((item) => `
    <tr>
      <td>${escapeHtml(item.posto)}</td>
      <td>${escapeHtml(item.nomeEnfermeira)}</td>
      <td>${escapeHtml(item.nomeAcs)}</td>
      <td>${Number(item.pessoasCadastradas || 0)}</td>
      <td>${item.ano}</td>
      <td>${meses[(item.mes || 1) - 1]}</td>
      <td><strong>${Number(item.quantidade || 0)}</strong></td>
      <td><strong>${Number(item.coberturaPercentual ?? calcularPercentual(item.quantidade, item.pessoasCadastradas))}%</strong></td>
      <td><button type="button" class="table-edit-btn" data-edit-launch="1" data-acs-id="${escapeHtml(item.acsId || "")}" data-ano="${Number(item.ano)}" data-mes="${Number(item.mes)}">Editar</button></td>
    </tr>
  `).join("");
  bindEditLaunchButtons(els.adminReportBody, adminReportData);
}

function exportCsv() {
  if (!adminReportData.length) {
    alert("Nenhum dado para exportar.");
    return;
  }

  const filtro = normalizeText(els.adminSearch.value).toLowerCase();
  const dados = adminReportData.filter((item) => {
    const text = `${item.posto} ${item.nomeEnfermeira} ${item.nomeAcs}`.toLowerCase();
    return text.includes(filtro);
  });

  const header = ["Posto", "Enfermeira", "ACS", "Cidadãos cadastrados no mês", "Ano", "Mes", "Visitas", "Cobertura percentual"];
  const rows = dados.map((item) => [
    item.posto,
    item.nomeEnfermeira,
    item.nomeAcs,
    Number(item.pessoasCadastradas || 0),
    item.ano,
    meses[(item.mes || 1) - 1],
    item.quantidade,
    `${Number(item.coberturaPercentual ?? calcularPercentual(item.quantidade, item.pessoasCadastradas))}%`
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-visitas-acs-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function bindEvents() {
  $("btn-show-register").addEventListener("click", () => {
    els.loginBox.classList.add("hidden");
    els.registerBox.classList.remove("hidden");
    showMessage(els.authMessage, "");
  });

  $("btn-show-login").addEventListener("click", () => {
    els.registerBox.classList.add("hidden");
    els.loginBox.classList.remove("hidden");
    showMessage(els.authMessage, "");
  });

  $("btn-register").addEventListener("click", registerUser);
  $("btn-login").addEventListener("click", loginUser);
  $("btn-reset-password").addEventListener("click", resetPassword);
  $("btn-logout").addEventListener("click", () => signOut(auth));
  $("btn-add-acs").addEventListener("click", addAcs);
  $("btn-save-visits").addEventListener("click", saveVisits);
  $("btn-add-admin").addEventListener("click", addAdminManual);
  $("btn-export-csv").addEventListener("click", exportCsv);
  $("btn-run-report").addEventListener("click", renderReports);
  $("btn-export-report-csv").addEventListener("click", exportReportCsv);
  $("btn-print-report").addEventListener("click", printCurrentReport);

  document.querySelectorAll("[data-report-template]").forEach((button) => {
    button.addEventListener("click", () => {
      els.reportType.value = button.dataset.reportTemplate;
      const type = els.reportType.value;
      if (type === "monthly_all") {
        els.reportStartMonth.value = String(currentMonthNumber());
        els.reportEndMonth.value = els.reportStartMonth.value;
      }
      if (type === "period_acs" && !els.reportAcsSelect.value) {
        showMessage(els.reportMessage, "Escolha o ACS para gerar esse relatório.");
      }
      updateReportHelp();
      renderReports();
    });
  });

  document.querySelectorAll("[data-period-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      applyReportPeriodPreset(button.dataset.periodPreset);
      updateReportHelp();
      renderReports();
    });
  });
  if (els.installButton) els.installButton.addEventListener("click", installApp);
  if (els.updateButton) els.updateButton.addEventListener("click", forceAppUpdate);
  if (els.appVersion) els.appVersion.textContent = APP_VERSION;
  updateInstallButton();

  els.searchAcs.addEventListener("input", renderAcsList);
  els.yearSelect.addEventListener("change", renderMonthsForSelectedAcs);
  els.adminYearSelect.addEventListener("change", loadAdminDashboard);
  els.adminMonthSelect.addEventListener("change", loadAdminDashboard);
  els.adminSearch.addEventListener("input", renderAdminReport);

  [els.reportType, els.reportYearSelect, els.reportStartMonth, els.reportEndMonth, els.reportAcsSelect].forEach((el) => {
    if (el) el.addEventListener("change", renderReports);
  });
  if (els.reportSearch) els.reportSearch.addEventListener("input", () => {
    updateReportPreview();
    renderReports();
  });
  if (els.reportStartMonth) els.reportStartMonth.addEventListener("change", () => {
    if (els.reportType.value === "monthly_all") els.reportEndMonth.value = els.reportStartMonth.value;
  });

  els.tabEnfermeira.addEventListener("click", () => openTab("enfermeira"));
  if (els.tabRelatorios) els.tabRelatorios.addEventListener("click", () => openTab("relatorios"));
  els.tabAdmin.addEventListener("click", () => openTab("admin"));

  document.querySelectorAll("[data-scroll-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openTab("enfermeira");
      const target = document.getElementById(btn.dataset.scrollTarget);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = $(btn.dataset.togglePassword);
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "Ver" : "Ocultar";
    });
  });
}

onAuthStateChanged(auth, async (user) => {
  try {
    currentUser = user;

    if (!user) {
      currentProfile = null;
      selectedAcs = null;
      acsCache = [];
      if (els.emptyLaunchHint) els.emptyLaunchHint.classList.remove("hidden");
      if (unsubscribeAcs) unsubscribeAcs();
      showAuth();
      return;
    }

    currentProfile = await loadUserProfile(user);
    showApp();

    els.userInfo.textContent = `${currentProfile.posto} • ${currentProfile.tipo}`;
    const sidebarName = document.getElementById("sidebar-user-name");
    if (sidebarName) sidebarName.textContent = currentProfile.nome || currentUser.email;
    els.postoName.textContent = currentProfile.posto || "-";
    els.tabAdmin.classList.toggle("hidden", currentProfile.tipo !== "admin");

    if (currentProfile.tipo === "admin") {
      openTab("admin");
    } else {
      openTab("enfermeira");
    }

    listenAcs();
  } catch (error) {
    showAuth();
    showMessage(els.authMessage, error.message, true);
  }
});

fillYearSelects();
bindEvents();
