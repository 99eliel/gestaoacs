SISTEMA DE CONTROLE DE VISITAS ACS - V5

Atualização desta versão:
- Corrigida a visualização do lançamento de visitas para enfermeiras.
- Depois de cadastrar um ACS, a tela de lançamento mensal abre automaticamente.
- Na lista de ACS, agora o card inteiro é clicável.
- O botão ficou mais claro: "Abrir lançamento de visitas".
- Mantido cálculo mensal de cobertura usando cidadãos cadastrados no mês + visitas realizadas.

SISTEMA DE CONTROLE DE VISITAS ACS - VERSÃO COM POPULAÇÃO MENSAL

Projeto pronto em HTML, CSS e JavaScript usando Firebase Authentication e Cloud Firestore.

CONFIGURAÇÃO JÁ INSERIDA
Projeto Firebase: gestaoacs-f4bdd
Auth domain: gestaoacs-f4bdd.firebaseapp.com
Project ID: gestaoacs-f4bdd
Admin principal: carmoeliel99@gmail.com

FUNÇÕES PRONTAS
- Login com e-mail e senha.
- Cadastro de enfermeiras.
- Nome do posto no cadastro.
- Cadastro de ACS.
- Lista de ACS por enfermeira.
- Lançamento mensal com dois campos por mês: cidadãos cadastrados no mês e visitas realizadas.
- Cálculo automático de cobertura do território usando a população daquele mês.
  Exemplo: Janeiro com 500 cidadãos e 400 visitas = 80%.
  Exemplo: Fevereiro com 450 cidadãos e 400 visitas = 89%.
- Painel administrativo.
- Função para liberar outros administradores manualmente pelo e-mail.
- Relatório administrativo por ano e mês.
- Relatório com cidadãos cadastrados por mês e percentual de cobertura mensal.
- Exportação CSV.
- Recuperação de senha.

PASSO A PASSO NO FIREBASE
1. Acesse o Firebase Console.
2. Entre no projeto gestaoacs-f4bdd.
3. Vá em Authentication > Sign-in method.
4. Ative Email/Password.
5. Vá em Firestore Database.
6. Crie o banco em modo Production, se ainda não tiver criado.
7. Vá em Rules.
8. Cole todo o conteúdo do arquivo firebase-rules.txt.
9. Clique em Publish.

IMPORTANTE SOBRE NOVOS ADMINISTRADORES
1. Entre no sistema com o e-mail admin principal: carmoeliel99@gmail.com.
2. Acesse a aba Admin.
3. Use o card "Adicionar administrador".
4. Coloque nome, e-mail e setor/posto.
5. Clique em "Liberar administrador".

Se a pessoa ainda não tiver conta:
- Ela deve clicar em "Criar cadastro de enfermeira" usando exatamente o e-mail liberado.
- O sistema vai reconhecer esse e-mail e criar o perfil como admin.

Se a pessoa já tiver conta:
- O sistema atualiza o perfil existente para admin automaticamente.

COMO TESTAR NO PC
1. Abra a pasta no VS Code.
2. Use a extensão Live Server.
3. Clique com o botão direito no index.html.
4. Clique em Open with Live Server.
5. Crie sua conta usando carmoeliel99@gmail.com.
6. Depois cadastre enfermeiras, ACS e lançamentos mensais.

COMO SUBIR NO GITHUB PAGES
1. Suba os arquivos index.html, style.css, app.js, manifest.json, firebase-rules.txt e README.txt no repositório.
2. Vá em Settings > Pages.
3. Em Source, selecione Deploy from a branch.
4. Selecione a branch main e a pasta /root.
5. Salve.
6. No Firebase, em Authentication > Settings > Authorized domains, adicione 99eliel.github.io se o login der erro de domínio.

OBSERVAÇÃO IMPORTANTE
Não cadastre dados de pacientes no sistema. Use apenas quantidade de visitas por ACS e total de cidadãos cadastrados no mês.


NOVIDADES DA VERSÃO 4
- Aviso fixo no topo: Sistema desenvolvido e emprestado por Eliel do Carmo.
- Botão para instalar o sistema como app no celular/PC.
- Manifest atualizado com ícones 192x192 e 512x512.
- Service worker adicionado para habilitar instalação PWA e cache básico dos arquivos.

ARQUIVOS NOVOS DESTA VERSÃO
- service-worker.js
- icon-192.png
- icon-512.png

OBSERVAÇÃO SOBRE ATUALIZAÇÕES
Ao substituir os arquivos no GitHub Pages, se o celular ainda mostrar uma versão antiga, abra o sistema, atualize a página e aguarde alguns segundos. O service worker desta versão foi configurado para buscar os arquivos novos pela internet e atualizar o cache.
