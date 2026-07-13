SISTEMA DE CONTROLE DE VISITAS ACS - V7

Projeto Firebase configurado:
gestaoacs-f4bdd

Administrador principal:
carmoeliel99@gmail.com

ARQUIVOS PARA SUBIR NO GITHUB PAGES
Suba todos estes arquivos na raiz do repositório:

index.html
style.css
app.js
manifest.json
firebase-rules.txt
service-worker.js
icon-192.png
icon-512.png
README.txt

O QUE MUDOU NA V7
1. Correção definitiva da tela de lançamento mensal.
   Ao clicar em "Abrir lançamento de visitas", devem aparecer os 12 meses.
   Cada mês mostra:
   - Quantos cidadãos?
   - Quantas visitas?
   - Cobertura automática em %

2. Versionamento do site.
   O index.html chama app.js e style.css com versão no link:
   app.js?v=20260713-v7-acs
   style.css?v=20260713-v7-acs

3. Atualização automática do app.
   O service-worker.js não prende mais HTML, JS e CSS antigos.
   Ele sempre tenta buscar a versão nova primeiro.

4. Botão "Atualizar sistema" no topo.
   Se algum celular estiver segurando cache antigo, toque nesse botão.
   Ele limpa cache, remove service worker antigo e recarrega o sistema.

5. Versão visível no topo.
   No banner aparece a versão v7.0.0-20260713.
   Isso ajuda a confirmar se o celular realmente abriu a versão nova.

PASSO A PASSO PARA ATUALIZAR NO GITHUB PAGES
1. Apague os arquivos antigos do repositório ou substitua todos.
2. Suba todos os arquivos desta pasta na raiz do repositório.
3. Aguarde o GitHub Pages publicar.
4. Abra o sistema no navegador.
5. Confira no topo se aparece v7.0.0-20260713.
6. Toque em "Atualizar sistema" uma vez no celular que estava com problema.
7. Depois clique no ACS e verifique se aparecem os campos dos meses.

FIREBASE
Se já publicou as regras da versão anterior, as regras continuam compatíveis.
Mesmo assim, se der erro de permissão, copie todo o conteúdo de firebase-rules.txt e cole em:
Firebase > Firestore Database > Rules > Publish

OBSERVAÇÃO
Não cadastre dados de pacientes. O sistema deve guardar apenas ACS, posto, mês, total de cidadãos cadastrados no mês e total de visitas.
