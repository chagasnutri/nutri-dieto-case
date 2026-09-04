# DietoCase - Simulador Clínico e Prontuário de Dietoterapia

Aplicativo educacional desenvolvido para a disciplina de **Dietoterapia** (Graduação em Nutrição). A proposta do **DietoCase** é fornecer um ambiente de simulação clínica realista onde o estudante interage com o paciente e membros da equipe multiprofissional (Médico, Enfermagem, Fonoaudiólogo, etc.) para construir o prontuário do paciente com as informações repassadas.

---

## 🌟 Arquitetura em Dois Templates Principais

1. **🏛️ Template do Professor / Administrador (Senha: `Nutri2@26`)**:
   - **Acesso Exclusivo**: Protegido por autenticação segura com a senha `Nutri2@26`.
   - **Métricas no Topo**: Indicadores em tempo real do *Total de Casos*, *Casos Liberados para Alunos* e *Casos Travados / Bloqueados*.
   - **Controle de Trava/Liberação (Lock/Unlock)**: Cada caso possui botões de 1 clique (`🔓 Liberar` / `🔒 Travar`) para controle pedagógico imediato.
   - **Gestão Completa em 8 Abas**: Criação, edição profunda, duplicação e exclusão de casos clínicos.
   - **Importação/Exportação JSON**: Backup e compartilhamento de casos entre professores.
   - **Encerramento de Sessão**: Botão **"🔒 Bloquear Painel / Sair"** com 1 clique para proteger os gabaritos.

2. **🎓 Template do Aluno: Vitrine de Casos Clínicos e Atendimento**:
   - **Vitrine Completa de Casos**: O estudante visualiza todos os casos cadastrados com identificação de status:
     - 🟢 **Disponível para Simulação**: Card interativo com botão ativo **"▶ Acessar e Iniciar Atendimento"**.
     - 🔒 **Travado pelo Professor**: Card com badge âmbar e aviso de bloqueio discente.
   - **Filtros e Busca Rápida**: Filtros por *Todos os Casos*, *Apenas Disponíveis* e *Travados*, além de busca instantânea.
   - **Ambiente de Simulação e Prontuário**: Transição suave para o atendimento com botão **"⬅ Voltar ao Painel de Casos"** e auto-salvamento de rascunhos.

3. **Gestão Completa de Casos pelo Professor**:
   - Cadastro estruturado em **8 abas temáticas**:
     - *1. Identificação & História Geral*: Queixa principal, HDA, HPP, história familiar, medicamentos, hábitos, eliminações e toggle de liberação.
     - *2. Avaliação Antropométrica*: Peso atual, peso habitual, estatura, circunferências, dobras e perda ponderal.
     - *3. Avaliação Bioquímica*: Tabela dinâmica de exames laboratoriais, valores encontrados e referências.
     - *4. Avaliação Clínica & Exame Físico*: Mucosas, acantose, depleção muscular, edemas, cavidade oral e TGI.
     - *5. Consumo Alimentar & Recordatório*: Recordatório 24h por refeição, água, preferências, aversões e quem prepara.
     - *6. Equipe Multiprofissional*: Opção dinâmica de retirar ou acrescentar profissionais de saúde (Médico, Enfermagem, Fonoaudiólogo, Psicólogo, Fisioterapeuta, Farmacêutico Clínico, Dentista, Terapeuta Ocupacional, etc.), refletindo dinamicamente no chat de atendimento do aluno.
     - *7. Questões Avaliativas*: Cadastro de perguntas específicas que o aluno deve responder para aquele caso.
     - *8. Gabarito / Resolução do Docente*: Diagnóstico PES padrão, cálculo VET, distribuição de macronutrientes e conduta.
   - **Subir Arquivo e Montar Caso Automaticamente**: Upload de documentos Word (.docx), textos (.txt, .md, .json) ou colagem direta de prontuários com análise e preenchimento automático de todas as 8 abas temáticas para revisão do docente.
   - Backup e compartilhamento: exportação e importação de casos em formato `.json`.

4. **Conversação Humanizada em 1ª Pessoa e Regra Estrita Anti-Alucinação**:
   - Diálogos naturais, calorosos e empáticos, eliminando qualquer aspecto mecânico ou de leitura de prontuário:
     - **Paciente**: Responde sempre em primeira pessoa (*"Eu sinto...", "Eu tomo remédio todo dia, doutor(a)...", "No meu exame a glicemia deu..."*).
     - **Acompanhante / Familiar**: Refere-se naturalmente ao paciente na terceira pessoa (*"Doutor(a), no dia a dia com ele...", "Ele costuma esquecer os remédios..."*).
     - **Equipe Multiprofissional**: Médico, Enfermagem, Fonoaudiologia e Psicologia comunicam-se como colegas de equipe em discussão clínica (*"Olá, colega nutricionista!"*), sem rótulos entre colchetes como `[Parecer Médico]:`.
   - **Regra Estrita Anti-Alucinação (Sem invenção de dados)**:
     - Caso o aluno faça uma pergunta sobre uma informação que **não foi inserida pelo professor** (ex: histórico não cadastrado, exame não solicitado, alergia inexistente):
     - O interlocutor **não inventa dados**: responde de forma humana e acolhedora que *não sabe informar*, que *não sente isso*, ou que *essa informação não consta nos registros*.

5. **Prontuário Nutricional Eletrônico do Estudante**:
   - Construção guiada durante a anamnese:
     - Anamnese e História Clínica
     - Avaliação Antropométrica com **calculadora de IMC e % de perda ponderal em tempo real** (com classificação OMS para adultos e Lipschitz para idosos)
     - Avaliação Bioquímica e interpretação
     - Exame Físico Nutricional
     - Inquérito Alimentar
     - **Diagnóstico em Nutrição no formato PES (Problema, Etiologia, Sinais e Sintomas)**
     - Prescrição Dietoterápica (VET, g/kg e % de carboidratos, proteínas e lipídios, consistência e fracionamento)
     - **Planejamento Alimentar (Cardápio)** com tabela dinâmica de refeições, horários e substituições
     - Orientações Nutricionais ao paciente

6. **Questões Avaliativas Específicas**:
   - O aluno responde às questões configuradas pelo docente para o caso selecionado.

7. **Finalização sem Feedback Imediato de Certo/Errado**:
   - Conforme a metodologia da disciplina, o estudante **não recebe gabarito nem pontuação imediata de acertos/erros** ao submeter, permitindo que a avaliação e discussão sejam conduzidas posteriormente pelo professor em sala de aula.

8. **Geração e Download Automático de Relatório em Word (`.docx`)**:
   - Ao finalizar, o sistema gera e baixa imediatamente um documento `.docx` formatado (`DietoCase_Relatorio_[Aluno]_[Caso].docx`) com cabeçalho institucional, tabelas organizadas, caixas de destaque, o prontuário preenchido pelo aluno, a resolução dietoterápica completa, o planejamento alimentar e todas as respostas às questões avaliativas.

---

## 📂 Estrutura de Arquivos

```
dietoterapia-simulador/
│
├── index.html                  # Interface SPA responsiva (Modo Aluno e Painel do Professor)
├── css/
│   └── styles.css              # Estilos clínicos personalizados e temas de saúde
├── js/
│   ├── app.js                  # Controlador principal, autenticação docente (Nutri2@26) e bloqueios
│   ├── cases-data.js           # Banco de casos com controle de isLocked e localStorage
│   ├── portuguese-reviser.js   # Validador e revisor ortográfico/gramatical
│   ├── case-builder.js         # Montador dinâmico de novos casos
│   ├── sync-engine.js          # Sincronização em tempo real (P2P + Server)
│   ├── admin-manager.js        # Gestão de disciplinas, casos e alternância de trava
│   ├── chat-engine.js          # Motor de diálogo com proteção estrita anti-alucinação
│   ├── student-prontuario.js   # Lógica do prontuário, cálculos e persistência de rascunhos
│   └── docx-generator.js       # Montador do relatório em Word (.docx) DietoCase
├── lib/
│   └── mini-docx.js            # Gerador binário puro OpenXML ZIP (.docx) para navegador
├── manifest.json               # Configuração PWA (Instalação no Celular/Desktop)
├── sw.js                       # Service Worker para funcionamento 100% offline
└── README.md                   # Esta documentação
```

---

## 🚀 Como Executar o DietoCase Localmente

O aplicativo é 100% independente e roda em qualquer navegador moderno (**Google Chrome, Microsoft Edge, Mozilla Firefox, Safari**) sem necessidade de instalar dependências complexas ou bancos de dados externos.

### Abertura Direta
Basta dar um duplo-clique no arquivo `index.html` ou abri-lo pelo seu navegador favorito.

### 🌐 Como Hospedar no GitHub Pages (Acesso Gratuito para Alunos e Professores)
1. Crie um repositório no GitHub (ex: `dietocase`).
2. No seu terminal, envie os arquivos:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: Versao inicial DietoCase"
   git remote add origin https://github.com/SEU-USUARIO/dietocase.git
   git push -u origin main
   ```
3. No GitHub, acesse **Settings** > **Pages**:
   - Em **Source**, selecione **Deploy from a branch**.
   - Em **Branch**, selecione `main` e pasta `/ (root)`.
   - Clique em **Save**.
4. Em instantes, o link público estará pronto (ex: `https://seu-usuario.github.io/dietocase/`).

### 🔑 Instruções para o Professor
1. Clique no botão **"⚙️ Painel do Professor"** no canto superior direito da tela.
2. Na janela de segurança, digite a senha: `Nutri2@26` e clique em **Entrar**.
3. Na lista de disciplinas e casos clínicos:
   - Cadastre, edite ou exclua disciplinas e casos em tempo real.
   - Clique em **"🔒 Travar"** para ocultar um caso dos alunos.
   - Clique em **"🔓 Liberar"** para disponibilizá-lo na lista de casos da turma.
4. Para sair com segurança e proteger a área docente contra os alunos, clique no botão **"🔒 Bloquear Painel / Sair"**.

---

## 📋 Casos Clínicos Pré-Cadastrados

1. **Caso 1: Paciente Adulto com DM2, HAS e Obesidade Grau I (Ambulatorial)**
   - *Paciente*: Carlos Alberto, 54 anos, motorista de ônibus.
   - *Foco*: Descontrole glicêmico (HbA1c 8.9%), acantose nigricans, dislipidemia mista, rotina alimentar irregular e rica em carboidratos simples.

2. **Caso 2: Paciente Idosa com Desnutrição e DRC Não Dialítica (Hospitalar)**
   - *Paciente*: Lourdes Maria, 76 anos, aposentada.
   - *Foco*: Perda ponderal severa (14.4% em 3 meses), uremia, hiporexia, gosto metálico, adequação proteica e restrição de fósforo/potássio.

3. **Caso 3: Paciente Pós-Gastrectomia Subtotal com Síndrome de Dumping (Cirúrgico)**
   - *Paciente*: Roberto Silveira, 42 anos.
   - *Foco*: Síndrome de Dumping precoce e tardia, hipoglicemia reativa, fracionamento rigoroso (6-8 refeições), separação estrita de sólidos e líquidos.
