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
  enfermeiraPanel: $("enfermeira-panel"),
  adminPanel: $("admin-panel"),
  adminYearSelect: $("admin-year-select"),
  adminMonthSelect: $("admin-month-select"),
  adminSearch: $("admin-search"),
  adminReportBody: $("admin-report-body"),
  adminTotalPostos: $("admin-total-postos"),
  adminTotalEnfermeiras: $("admin-total-enfermeiras"),
  adminTotalAcs: $("admin-total-acs"),
  adminTotalVisitas: $("admin-total-visitas"),
  installButton: $("btn-install-app")
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker não registrado:", error);
    });
  });
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
        <span class="muted">Microárea: ${escapeHtml(acs.microarea || "Não informada")} | População informada mês a mês</span>
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
  els.selectedAcsSubtitle.textContent = `Posto: ${acs.posto} | Microárea: ${acs.microarea || "não informada"} | Informe cidadãos cadastrados e visitas em cada mês`;
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
    visitasPorMes[data.mes] = {
      quantidade: Number(data.quantidade || 0),
      pessoasCadastradas: Number(data.pessoasCadastradas ?? selectedAcs.pessoasCadastradas ?? 0)
    };
  });

  els.monthsGrid.innerHTML = "";

  meses.forEach((mesNome, index) => {
    const mesNumero = index + 1;
    const dadosMes = visitasPorMes[mesNumero] || { quantidade: 0, pessoasCadastradas: 0 };
    const quantidadeAtual = Number(dadosMes.quantidade || 0);
    const pessoasAtual = Number(dadosMes.pessoasCadastradas || 0);
    const percentualAtual = calcularPercentual(quantidadeAtual, pessoasAtual);
    const box = document.createElement("div");
    box.className = "month-box";
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
          />
        </div>
      </div>
      <small class="coverage-info">Cobertura: <strong>${percentualAtual}%</strong></small>
    `;

    const atualizarCobertura = () => {
      const pessoas = Number(box.querySelector('input[data-field="pessoas"]').value || 0);
      const visitas = Number(box.querySelector('input[data-field="visitas"]').value || 0);
      box.querySelector(".coverage-info strong").textContent = `${calcularPercentual(visitas, pessoas)}%`;
    };

    box.querySelectorAll("input").forEach((input) => input.addEventListener("input", atualizarCobertura));

    els.monthsGrid.appendChild(box);
  });
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
        atualizadoEm: serverTimestamp()
      }, { merge: true });
    }

    showMessage(els.visitsMessage, "Lançamentos mensais salvos com sucesso!");
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
    els.adminReportBody.innerHTML = `<tr><td colspan="8">Nenhum dado encontrado.</td></tr>`;
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
  if (els.installButton) els.installButton.addEventListener("click", installApp);
  updateInstallButton();

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
