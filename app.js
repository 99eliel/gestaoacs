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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
  acsList: $("acs-list"),
  searchAcs: $("search-acs"),
  visitasCard: $("visitas-card"),
  selectedAcsTitle: $("selected-acs-title"),
  selectedAcsSubtitle: $("selected-acs-subtitle"),
  yearSelect: $("year-select"),
  monthsGrid: $("months-grid"),
  visitsMessage: $("visits-message"),
  acsMessage: $("acs-message"),
  tabEnfermeira: $("tab-enfermeira"),
  tabAdmin: $("tab-admin"),
  enfermeiraPanel: $("enfermeira-panel"),
  adminPanel: $("admin-panel"),
  adminYearSelect: $("admin-year-select"),
  adminMonthSelect: $("admin-month-select"),
  adminSearch: $("admin-search"),
  adminReportBody: $("admin-report-body"),
  adminTotalPostos: $("admin-total-postos"),
  adminTotalEnfermeiras: $("admin-total-enfermeiras"),
  adminTotalAcs: $("admin-total-acs"),
  adminTotalVisitas: $("admin-total-visitas")
};

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
  const years = [year - 1, year, year + 1];

  [els.yearSelect, els.adminYearSelect].forEach((select) => {
    select.innerHTML = "";
    years.forEach((ano) => {
      const option = document.createElement("option");
      option.value = ano;
      option.textContent = ano;
      if (ano === year) option.selected = true;
      select.appendChild(option);
    });
  });

  els.adminMonthSelect.value = String(currentMonthNumber());
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
  els.tabEnfermeira.classList.toggle("active", !isAdminTab);
  els.tabAdmin.classList.toggle("active", isAdminTab);
  els.enfermeiraPanel.classList.toggle("hidden", isAdminTab);
  els.adminPanel.classList.toggle("hidden", !isAdminTab);

  if (isAdminTab) loadAdminDashboard();
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.map((item) => item.toLowerCase()).includes(String(email || "").toLowerCase());
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
    const tipo = isAdminEmail(email) ? "admin" : "enfermeira";

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
    await addDoc(collection(db, "acs"), {
      nome,
      microarea,
      posto: currentProfile.posto,
      enfermeiraId: currentUser.uid,
      enfermeiraNome: currentProfile.nome,
      ativo: true,
      criadoEm: serverTimestamp()
    });

    $("acs-name").value = "";
    $("acs-microarea").value = "";
    showMessage(els.acsMessage, "ACS cadastrado com sucesso!");
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
    els.totalAcs.textContent = acsCache.length;
    loadCurrentMonthTotal();
  }, (error) => {
    els.acsList.innerHTML = `<div class="empty-box">Erro ao carregar ACS: ${traduzErroFirebase(error)}</div>`;
  });
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
    item.className = "acs-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(acs.nome)}</strong>
        <span class="muted">Microárea: ${escapeHtml(acs.microarea || "Não informada")}</span>
      </div>
      <button class="secondary-btn">Lançar visitas</button>
    `;

    item.querySelector("button").addEventListener("click", () => selectAcs(acs));
    els.acsList.appendChild(item);
  });
}

async function selectAcs(acs) {
  selectedAcs = acs;
  els.visitasCard.classList.remove("hidden");
  els.selectedAcsTitle.textContent = `Lançamento mensal - ${acs.nome}`;
  els.selectedAcsSubtitle.textContent = `Posto: ${acs.posto} | Microárea: ${acs.microarea || "não informada"}`;
  await renderMonthsForSelectedAcs();
  els.visitasCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function renderMonthsForSelectedAcs() {
  if (!selectedAcs) return;

  const ano = Number(els.yearSelect.value);
  const q = query(
    collection(db, "visitas"),
    where("acsId", "==", selectedAcs.id),
    where("ano", "==", ano)
  );

  const snap = await getDocs(q);
  const visitasPorMes = {};

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    visitasPorMes[data.mes] = data.quantidade;
  });

  els.monthsGrid.innerHTML = "";

  meses.forEach((mesNome, index) => {
    const mesNumero = index + 1;
    const box = document.createElement("div");
    box.className = "month-box";
    box.innerHTML = `
      <label>${mesNome}</label>
      <input
        type="number"
        min="0"
        step="1"
        data-month="${mesNumero}"
        value="${visitasPorMes[mesNumero] ?? 0}"
      />
    `;
    els.monthsGrid.appendChild(box);
  });
}

async function saveVisits() {
  if (!selectedAcs) return;

  const ano = Number(els.yearSelect.value);
  const inputs = Array.from(els.monthsGrid.querySelectorAll("input[data-month]"));

  try {
    showMessage(els.visitsMessage, "Salvando...");

    for (const input of inputs) {
      const mes = Number(input.dataset.month);
      const quantidade = Number(input.value || 0);

      if (quantidade < 0) {
        showMessage(els.visitsMessage, "A quantidade não pode ser negativa.", true);
        return;
      }

      const visitId = `${selectedAcs.id}_${ano}_${mes}`;
      await setDoc(doc(db, "visitas", visitId), {
        acsId: selectedAcs.id,
        nomeAcs: selectedAcs.nome,
        enfermeiraId: selectedAcs.enfermeiraId,
        nomeEnfermeira: selectedAcs.enfermeiraNome,
        posto: selectedAcs.posto,
        ano,
        mes,
        quantidade,
        atualizadoEm: serverTimestamp()
      }, { merge: true });
    }

    showMessage(els.visitsMessage, "Visitas salvas com sucesso!");
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
    snap.forEach((item) => total += Number(item.data().quantidade || 0));
    els.totalCurrentMonth.textContent = total;
  } catch (error) {
    els.totalCurrentMonth.textContent = "-";
  }
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
    els.adminReportBody.innerHTML = `<tr><td colspan="6">Nenhum dado encontrado.</td></tr>`;
    return;
  }

  els.adminReportBody.innerHTML = filtrado.map((item) => `
    <tr>
      <td>${escapeHtml(item.posto)}</td>
      <td>${escapeHtml(item.nomeEnfermeira)}</td>
      <td>${escapeHtml(item.nomeAcs)}</td>
      <td>${item.ano}</td>
      <td>${meses[(item.mes || 1) - 1]}</td>
      <td><strong>${Number(item.quantidade || 0)}</strong></td>
    </tr>
  `).join("");
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

  const header = ["Posto", "Enfermeira", "ACS", "Ano", "Mes", "Visitas"];
  const rows = dados.map((item) => [
    item.posto,
    item.nomeEnfermeira,
    item.nomeAcs,
    item.ano,
    meses[(item.mes || 1) - 1],
    item.quantidade
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
  $("btn-export-csv").addEventListener("click", exportCsv);

  els.searchAcs.addEventListener("input", renderAcsList);
  els.yearSelect.addEventListener("change", renderMonthsForSelectedAcs);
  els.adminYearSelect.addEventListener("change", loadAdminDashboard);
  els.adminMonthSelect.addEventListener("change", loadAdminDashboard);
  els.adminSearch.addEventListener("input", renderAdminReport);

  els.tabEnfermeira.addEventListener("click", () => openTab("enfermeira"));
  els.tabAdmin.addEventListener("click", () => openTab("admin"));

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
      if (unsubscribeAcs) unsubscribeAcs();
      showAuth();
      return;
    }

    currentProfile = await loadUserProfile(user);
    showApp();

    els.userInfo.textContent = `${currentProfile.nome} | ${currentProfile.posto} | ${currentProfile.tipo}`;
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
