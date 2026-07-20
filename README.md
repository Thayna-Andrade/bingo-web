# Bingo Marcador (site) 🎱

Site para cadastrar cartelas de bingo e marcar todas elas de uma vez só
quando uma peça é sorteada. Usa a mesma conta do Firebase que já estava
configurada na versão mobile — os dados continuam na nuvem, sincronizados
e isolados por usuário.

## Funcionalidades

- Login e cadastro (Firebase Authentication)
- Criar jogo com quantas cartelas quiser — digitando os números manualmente
  **ou enviando uma foto da cartela**, com preenchimento automático por OCR
  (reconhecimento de texto rodando no próprio navegador, sem servidor)
- Marcar jogo: toca no número sorteado e ele marca **em todas as cartelas
  daquele jogo ao mesmo tempo**, destacando quem fecha linha/coluna/cartela cheia
- Histórico de jogos com resultado

---

## Parte 1 — Testando localmente

Pré-requisito: [Node.js](https://nodejs.org) versão 20 ou mais recente.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Como o Firebase já está configurado em
`src/firebaseConfig.js` com as chaves do seu projeto, o login já deve
funcionar direto.

---

## Parte 2 — Publicando no GitHub Pages

### 2.1. Criar o repositório no GitHub

1. Vá em [github.com/new](https://github.com/new)
2. Dê um nome (ex: `bingo-marcador`), deixe **público** (o GitHub Pages
   gratuito exige repositório público, a não ser que você tenha GitHub Pro)
3. Não marque nenhuma opção de inicializar com README (você já tem os arquivos aqui)

### 2.2. Enviar o código para o repositório

Na pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versão do site"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/bingo-marcador.git
git push -u origin main
```

### 2.3. Ativar o GitHub Pages com deploy automático

1. No repositório no GitHub, vá em **Settings → Pages**
2. Em "Build and deployment" → "Source", escolha **"GitHub Actions"**
   (não "Deploy from a branch" — já deixei um workflow pronto em
   `.github/workflows/deploy.yml` que cuida disso)
3. Pronto. Toda vez que você der `git push` na branch `main`, o site é
   compilado e publicado automaticamente
4. Acompanhe o progresso na aba **"Actions"** do repositório — quando o
   ícone ficar verde, o site está no ar

O endereço do site vai ser algo como:
`https://SEU-USUARIO.github.io/bingo-marcador/`
(aparece em Settings → Pages depois do primeiro deploy)

### 2.4. Autorizar o domínio no Firebase (passo importante!)

O Firebase só permite login em domínios que você autorizou, por segurança.
Antes de testar o login no site publicado:

1. Vá no [Firebase Console](https://console.firebase.google.com) → seu projeto → **Authentication → Settings → Authorized domains**
2. Clique em **"Add domain"**
3. Adicione `SEU-USUARIO.github.io` (sem `https://` e sem o nome do repositório)
4. Salve

Sem isso, o login no site publicado vai dar erro `auth/unauthorized-domain`.

---

## Como funciona o roteamento

O site usa `HashRouter` (endereços como `.../#/marcar` em vez de
`.../marcar`). Isso é de propósito: o GitHub Pages não sabe redirecionar
URLs "bonitas" para o `index.html` automaticamente, e o HashRouter evita
esse problema por completo, sem precisar de configuração extra.

## Sobre o reconhecimento automático de números (OCR)

O cadastro de cartela por foto usa a biblioteca **Tesseract.js**, que roda o
reconhecimento de texto inteiramente no navegador da pessoa (via
WebAssembly) — sem precisar de servidor nem de chave de API. Isso é
importante porque o GitHub Pages só hospeda arquivos estáticos, então não
teríamos como esconder uma chave de API com segurança.

Prós: gratuito, funciona offline depois do primeiro uso (o navegador guarda
o modelo em cache), não expõe nenhuma credencial.

Contras: a precisão é um pouco menor que a de serviços pagos de OCR (como a
Google Cloud Vision, usada na versão mobile antes de migrarmos pro site) —
principalmente em fotos tortas, com pouca luz, ou cartelas com fonte muito
pequena. Por isso a etapa de revisão manual da grade **sempre aparece**
depois da leitura automática, com os números editáveis antes de salvar.

Dicas que ajudam a melhorar a precisão: tirar a foto bem de frente (não
inclinada), com boa iluminação, e enquadrando só a cartela (sem muita borda
ao redor).

## Próximos passos possíveis

- **Domínio próprio**: dá pra apontar um domínio personalizado (ex:
  `bingo.seusite.com.br`) para o GitHub Pages nas configurações do repositório
- **PWA (instalar como app)**: dá pra configurar o site para poder ser
  "instalado" na tela inicial do celular, funcionando quase como um app

## Estrutura do projeto

```
bingo-web/
├── .github/workflows/deploy.yml   # publica automaticamente a cada push
├── index.html
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                    # rotas do site
│   ├── index.css                  # estilos e identidade visual
│   ├── firebaseConfig.js          # chaves do Firebase (login + banco de dados)
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── GamesContext.jsx
│   ├── services/
│   │   ├── ocr.js                 # OCR no navegador (Tesseract.js)
│   │   └── bingoParser.js         # texto reconhecido -> grade 5x5
│   ├── pages/                     # uma página por rota
│   ├── components/
│   │   ├── BingoCard.jsx
│   │   └── Topbar.jsx
│   └── utils/
│       └── bingoUtils.js          # regras de marcação e vitória
```
