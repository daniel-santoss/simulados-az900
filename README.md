# AZ-900 Simulados

Simulados interativos e gratuitos para a certificação **Microsoft Azure Fundamentals (AZ-900)**, em português (Brasil). Feito para estudar de verdade: além de acertar/errar, o app mostra onde você está fraco por **seção da prova** e guarda seu histórico.

> **Aviso:** material de estudo **não oficial**, sem vínculo com a Microsoft. A linha de corte (70%) é apenas uma referência de estudo, não a nota real da prova.

## O que tem

- **6 formatos de questão:** múltipla escolha, escolha dupla, verdadeiro/falso, várias afirmações V/F, arrastar e soltar e completar lacunas.
- **5 simulados** (a tela inicial deixa você escolher):
  - **Conceitos de Nuvem** (Domínio 1) — 30 questões sorteadas
  - **Arquitetura e Serviços** (Domínio 2) — 30 questões sorteadas
  - **Gerenciamento e Governança** (Domínio 3) — 30 questões sorteadas
  - **Simulado Geral** — 70 sorteadas de todos os domínios (no máximo 2 de escala vertical/horizontal; Data Lake, Data Factory, Management Groups e Resource Groups sempre entram)
  - **Banco Completo** — todas as questões do banco, embaralhadas
- **Dois modos:** *Treino* (feedback e explicação na hora) e *Prática* (prova, resultado só no fim).
- **Cronômetro** e **navegador de questões**.
- **Marcar para revisar depois** (☆), igual à prova oficial — as marcadas ficam destacadas e podem ser revisadas no fim.
- **Resultado com gráfico de desempenho por seção** (em %), no estilo da tela oficial de resultado.
- **Dica final inteligente:** aponta a seção mais fraca e os tópicos que mais derrubaram você.
- **Histórico das últimas 10 tentativas** de cada simulado, com data, tempo, gráfico por seção e as questões respondidas (sua resposta × a correta).
- **Tema escuro (padrão) e claro**, com alternância no botão do topo. A preferência fica salva.

O histórico e o tema são salvos no seu navegador (`localStorage`) — ficam só no seu dispositivo.

## Como rodar

**Localmente (mais simples):** clone o repositório e **abra o `index.html`** no navegador.

Abrir o arquivo direto funciona porque o projeto usa apenas HTML/CSS/JS puro, sem build.

## Estrutura

```
index.html      # casca da página (carrega tudo)
styles.css      # estilos e os dois temas (claro/escuro)
questions.js    # o banco de questões + configuração dos simulados
app.js          # motor: hub, exame, cronômetro, gráficos, histórico
```

## Como contribuir com questões

Todo o banco fica em **`questions.js`**, em `window.POOL`. Cada questão é um objeto com:

- `domain`: `"conceitos"`, `"arquitetura"` ou `"governanca"` (a seção da prova)
- `type`: `"mc"`, `"multi"`, `"tf"`, `"yesno"`, `"dnd"` ou `"fill"`
- `k`: o tópico (aparece como etiqueta e é usado na dica final)
- `s`: o enunciado
- `e`: a explicação da resposta
- campos específicos por tipo (`o`/`a` para múltipla escolha, `st` para V/F por afirmação, `chips`/`slots` para arrastar, `segs` para lacunas etc.)

Para adicionar uma questão, copie um objeto do mesmo `type` que já existe, ajuste o conteúdo e defina o `domain`. Sugestões e correções são bem-vindas por *issue* ou *pull request*.

> **Sobre a classificação por seção:** cada questão foi marcada com seu `domain` seguindo o outline oficial do AZ-900 (por exemplo, *Management Groups*, *Resource Groups* e *RBAC* ficam no Domínio 2; *Azure Policy*, *Resource Locks*, *Tags* e custos ficam no Domínio 3). É um trabalho manual e pode ter imprecisões — se achar alguma questão na seção errada, é só corrigir o campo `domain`. O outline da Microsoft também muda com o tempo; confira o "Skills measured" atual antes de usar como referência definitiva.
