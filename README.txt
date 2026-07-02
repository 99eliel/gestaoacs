SISTEMA DE CONTROLE DE VISITAS ACS - VERSÃO COM ADMIN E COBERTURA

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
- Campo de pessoas cadastradas na área de cada ACS.
- Lista de ACS por enfermeira.
- Lançamento das visitas por mês.
- Cálculo automático de cobertura do território.
  Exemplo: ACS com 100 pessoas cadastradas e 70 visitas = 70%.
- Painel administrativo.
- Função para liberar outros administradores manualmente pelo e-mail.
- Relatório administrativo por ano e mês.
- Relatório com pessoas cadastradas e percentual de cobertura.
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
Não cadastre dados de pacientes no sistema. Use apenas quantidade de visitas por ACS e total de pessoas cadastradas na área.
