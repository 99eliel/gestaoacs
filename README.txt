SISTEMA DE CONTROLE DE VISITAS ACS - V12 RELATÓRIOS E IMPRESSÃO

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

O QUE MUDOU NA V8
1. Interface totalmente repaginada.
   - Layout profissional com menu lateral.
   - Cards de indicadores no topo.
   - Área de ACS mais limpa.
   - Área de lançamento mensal em formato mais claro e intuitivo.

2. Lançamento mensal melhorado.
   Cada mês mostra:
   - Cidadãos cadastrados
   - Visitas realizadas
   - Cobertura automática

3. Painel administrativo reorganizado.
   - Cards de resumo.
   - Cadastro de novos administradores.
   - Relatório com filtros.
   - Exportação CSV.

4. Versionamento atualizado.
   - app.js?v=20260713-v8-acs
   - style.css?v=20260713-v8-acs
   - service-worker v8.0.0-20260713

5. Atualização automática mantida.
   O service worker busca HTML, CSS e JS novos primeiro.
   O botão Atualizar sistema continua limpando cache antigo.

PASSO A PASSO PARA ATUALIZAR NO GITHUB PAGES
1. Apague os arquivos antigos do repositório ou substitua todos.
2. Suba todos os arquivos desta pasta na raiz do repositório.
3. Aguarde o GitHub Pages publicar.
4. Abra o sistema no navegador.
5. Confira no topo se aparece v8.0.0-20260713.
6. Toque em Atualizar sistema uma vez no celular que estava com versão antiga.

FIREBASE
As regras continuam no arquivo firebase-rules.txt.
Se aparecer erro de permissão, copie todo o conteúdo de firebase-rules.txt e cole em:
Firebase > Firestore Database > Rules > Publish

OBSERVAÇÃO
Não cadastre dados de pacientes. O sistema deve guardar apenas ACS, posto, mês, total de cidadãos cadastrados no mês e total de visitas.


VERSÃO v9.0.0-20260713
- Nova aba Relatórios para enfermeiras e administradores.
- Relatório mensal de todos os ACS.
- Relatório por período de todos os ACS.
- Relatório de 2, 3 ou mais meses de um ACS específico.
- Relatório anual de ACS específico.
- Ranking de cobertura.
- Consolidado por posto/enfermeira.
- Exportação CSV e impressão do relatório atual.
- Enfermeira visualiza apenas seus próprios ACS e lançamentos.
- Admin visualiza todos os postos, enfermeiras e ACS.


VERSÃO v11.0.0-20260713
- Nova opção Editar nos relatórios e no relatório geral do admin.
- Enfermeira pode abrir um lançamento salvo, corrigir cidadãos/visitas e salvar novamente.
- Admin também pode melhorar filtros dos relatórios de qualquer posto pelo relatório geral.
- Ao clicar em Editar, o sistema abre automaticamente o ACS, o ano e destaca o mês escolhido.
- Botão atualizado para Salvar/atualizar visitas do ano.
- Versionamento atualizado para limpar cache antigo no GitHub Pages/PWA.


NOVIDADES DA V11
- Aba Relatórios reorganizada em passos.
- Modelos rápidos de relatório: mês, período, ACS específico, ano, ranking e consolidado.
- Atalhos de período: mês atual, últimos 3 meses, ano inteiro e limpar pesquisa.
- Resumo do filtro antes de gerar o relatório.
- Campos escondidos automaticamente quando não são necessários.



VERSÃO v12.0.0-20260713
- Aba Relatórios simplificada para ficar menos confusa.
- Tipos de relatório organizados em cartões claros: mensal, período, ACS específico, ano completo, ranking e consolidado.
- Filtros em uma área única e mais objetiva.
- Resumo do filtro com etiquetas: tipo, período, ACS e pesquisa.
- Botão Imprimir relatório agora gera um documento limpo, somente com os dados filtrados, indicadores e tabela, sem imprimir a tela inteira.
- Impressão inclui cabeçalho, período, usuário, perfil, aviso do Eliel e versão do sistema.
- Versionamento atualizado para v12.0.0-20260713.
