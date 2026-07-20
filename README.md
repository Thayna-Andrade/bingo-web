# 🎱 Bingo Marcador

**Marque todas as suas cartelas de bingo de uma vez só — sem esquecer nenhuma.**

🔗 **Acesse o site:** [thayna-andrade.github.io/bingo-web](https://thayna-andrade.github.io/bingo-web/)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=white)
![Tesseract.js](https://img.shields.io/badge/OCR-Tesseract.js-000000)
![GitHub Pages](https://img.shields.io/badge/Hospedagem-GitHub%20Pages-222222?logo=github&logoColor=white)

---

## 💡 Sobre o projeto

Quem já jogou bingo com várias cartelas na mão conhece o problema: a peça é
sorteada, e lá vai você conferir cartela por cartela, correndo o risco de
deixar alguma sem marcar. O **Bingo Marcador** resolve exatamente isso.

Você cadastra todas as cartelas de um jogo (digitando os números ou só
enviando uma foto), e na hora de jogar basta tocar em cada número sorteado
**uma única vez** — o site marca automaticamente todas as cartelas que têm
aquele número, ao mesmo tempo, e avisa assim que alguma cartela vence.

## ✨ Funcionalidades

- 🔐 **Login e cadastro de conta**, com os dados de cada pessoa isolados e
  sincronizados na nuvem
- 🗂️ **Criar jogos** e cadastrar quantas cartelas quiser em cada um
- 📷 **Cadastro de cartela por foto**, com preenchimento automático dos
  números via reconhecimento de texto (OCR) — ou, se preferir, digitação manual
- 🏷️ **Número de identificação por cartela** (o número impresso nela), com
  busca rápida para achar a cartela física vencedora
- 🎯 **Modo de vitória configurável**: escolha se aquele bingo é ganho por
  linha/coluna completa ou só quando a cartela enche por completo
- ✅ **Marcação simultânea**: um toque marca o número em todas as cartelas
  do jogo ao mesmo tempo, destacando quem está prestes a vencer (ou já venceu)
- 📜 **Histórico** de jogos anteriores, com o resultado de cada um

## 🧭 Como usar

1. **Crie sua conta** com e-mail e senha (ou entre, se já tiver uma)
2. **Crie um jogo**, dando um nome a ele e escolhendo a regra de vitória
   (por linha ou cartela cheia)
3. **Adicione as cartelas** desse jogo — tire uma foto de cada uma (os
   números são reconhecidos automaticamente, é só revisar antes de salvar)
   ou digite os números na mão
4. Na hora de jogar, abra **"Marcar jogo"** e vá tocando em cada número
   sorteado — todas as cartelas com aquele número são marcadas juntas
5. Quando alguém vencer, o site avisa na hora e mostra o número da cartela,
   pra você achar ela rapidinho no meio das outras
6. Depois, encontre esse jogo (e o resultado dele) a qualquer momento em
   **"Jogos antigos"**

## 🛠️ Tecnologias e ferramentas

| Camada | Tecnologia | Papel no projeto |
|---|---|---|
| Interface | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) | Construção da interface e empacotamento do site |
| Navegação | [React Router](https://reactrouter.com/) (`HashRouter`) | Rotas entre as telas, compatível com hospedagem estática |
| Autenticação | [Firebase Authentication](https://firebase.google.com/docs/auth) | Cadastro e login por e-mail/senha |
| Banco de dados | [Cloud Firestore](https://firebase.google.com/docs/firestore) | Armazena jogos e cartelas na nuvem, em tempo real, isolados por usuário |
| Reconhecimento de texto (OCR) | [Tesseract.js](https://github.com/naptha/tesseract.js) | Lê os números da cartela a partir de uma foto, rodando 100% no navegador (sem servidor, sem chave de API) |
| Hospedagem | [GitHub Pages](https://pages.github.com/) | Publicação gratuita do site como arquivo estático |
| Deploy contínuo | [GitHub Actions](https://github.com/features/actions) | Publica automaticamente uma nova versão a cada `git push` |

### Por que essa combinação?

O site é hospedado inteiramente como arquivos estáticos (sem servidor
próprio), então toda a "inteligência" do back-end vem de serviços que
funcionam direto do navegador: o **Firebase** cuida do login e do banco de
dados, e o **Tesseract.js** faz o OCR localmente — assim não é preciso
expor nenhuma chave de API secreta no código público do repositório.

## 🚀 Rodando o projeto localmente

Pré-requisito: [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
git clone https://github.com/Thayna-Andrade/bingo-web.git
cd bingo-web
npm install
npm run dev
```

O site abre em `http://localhost:5173`.

## ☁️ Deploy

O deploy é automático: todo `git push` na branch `main` dispara um workflow
do GitHub Actions (`.github/workflows/deploy.yml`) que compila o projeto e
publica o resultado no GitHub Pages. Não é preciso rodar nenhum comando de
build manualmente.

## 📁 Estrutura do projeto

```
bingo-web/
├── .github/workflows/deploy.yml   # publica automaticamente a cada push
├── index.html
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                    # rotas do site
│   ├── index.css                  # estilos e identidade visual
│   ├── firebaseConfig.js          # configuração do Firebase (login + banco de dados)
│   ├── context/
│   │   ├── AuthContext.jsx        # login, cadastro e sessão do usuário
│   │   └── GamesContext.jsx       # jogos, cartelas e marcação (Firestore)
│   ├── services/
│   │   ├── ocr.js                 # OCR no navegador (Tesseract.js)
│   │   └── bingoParser.js         # texto reconhecido -> grade 5x5 da cartela
│   ├── pages/                     # uma página por rota (login, criar jogo, marcar, histórico...)
│   ├── components/
│   │   ├── BingoCard.jsx          # cartela visual, com marcação e status de vitória
│   │   └── Topbar.jsx
│   └── utils/
│       └── bingoUtils.js          # regras de marcação e verificação de vitória
```

## 🗺️ Possíveis próximos passos

- Domínio próprio (ex: `bingo.seusite.com.br`) apontando para o GitHub Pages
- Suporte a PWA, para "instalar" o site na tela inicial do celular
- Edição do número de identificação de cartelas já cadastradas
- Compartilhar um mesmo jogo entre várias pessoas marcando ao mesmo tempo

## 👤 Autoria

Desenvolvido por [Thayná Andrade](https://github.com/Thayna-Andrade).
