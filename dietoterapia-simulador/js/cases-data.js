// Base de dados inicial de Casos Clínicos para o Simulador de Dietoterapia
// Armazena casos realistas e estruturados por áreas de anamnese e equipe multiprofissional.

const DEFAULT_CASES = [
  {
    id: "caso-dm2-has",
    disciplinaId: "dietoterapia",
    title: "Caso 1: Paciente Adulto com DM2, HAS e Obesidade Grau I",
    category: "Ambulatorial / Doenças Crônicas Não Transmissíveis",
    description: "Atendimento ambulatorial de paciente de 54 anos com queixas de descontrole glicêmico e pressórico após mudança recente de rotina e ganho de peso.",
    neeKcal: 1850,
    vetRecordatorioHabitual: 2750,
    isLocked: false,
    visivel: true,
    habilitarQuestoesAvaliativas: true,
    blockedTabs: [],
    patient: {
      name: "Carlos Alberto da Silva",
      age: 54,
      gender: "Masculino",
      occupation: "Motorista de ônibus urbano",
      maritalStatus: "Casado",
      residence: "São Paulo - SP",
      avatar: "👨"
    },
    history: {
      queixaPrincipal: "Eu ando muito preocupado, doutor(a). Minha glicose e minha pressão subiram demais nas últimas semanas e o médico do posto disse que eu precisava de atendimento urgente com a nutricionista. Eu acordo sem fome nenhuma de manhã, tomo só um cafezinho adoçado correndo, mas de tarde no volante sinto uma fraqueza esquisita, uma boca seca danada e uma sede que não passa, tomo garrafas de refrigerante e água mas parece que não adianta. Além disso, tenho que parar o ônibus toda hora pra urinar e à noite acordo duas ou três vezes pra ir ao banheiro.",
      hda: "Paciente do sexo masculino, 54 anos, hipertenso há 10 anos e diabético há 6 anos, comparece ao ambulatório encaminhado pela Estratégia de Saúde da Família com quadro de descompensação metabólica e pressórica progressiva nos últimos 4 meses. Apresenta sintomas clássicos de síndrome hiperglicêmica caracterizados por polidipsia intensa, xerostomia, poliúria com noctúria (2 a 3 episódios por noite) e astenia vespertina incapacitante. O paciente associa o agravamento do quadro clínico à recente transição para a escala de turno vespertino/noturno como motorista de transporte público coletivo urbano, período no qual apresentou ganho ponderal involuntário de 8,0 kg em 2 anos secundário a padrão alimentar desordenado e ritmo circadiano irregular. Nega precordialgia, palpitações ou dispneia paroxística.",
      hpp: "Portador de Hipertensão Arterial Sistêmica diagnosticada há 10 anos, Diabetes Mellitus Tipo 2 diagnosticado há 6 anos e Dislipidemia mista identificada há 2 anos. Nega antecedentes cirúrgicos prévios, episódios de acidente vascular encefálico, infarto agudo do miocárdio ou histórico de internações hospitalares recentes.",
      historiaFamiliar: "Histórico familiar positivo para eventos cardiovasculares precoces: pai falecido aos 62 anos por Infarto Agudo do Miocárdio (IAM). Mãe viva com 78 anos, portadora crônica de Diabetes Mellitus Tipo 2 e Hipertensão Arterial Sistêmica. Irmão consanguíneo mais velho portador de hipertensão arterial e sobrepeso.",
      medicamentos: "Metformina 850mg (1 comprimido após o almoço e 1 comprimido após o jantar); Losartana Potássica 50mg (1 comprimido pela manhã); Sinvastatina 20mg (1 comprimido à noite antes de dormir). Paciente relata omissões posológicas ocasionais durante jornadas de trabalho em regime de dobra ou atrasos de linha.",
      habitosVida: "Etilismo social com consumo de cerveja aos finais de semana (cerca de 3 a 4 latas por ocasião). Nega tabagismo pregressa ou atualmente. Nega prática de atividade física estruturada ou lazer ativo, referindo escassez de tempo disponível, sonolência diurna e exaustão osteomuscular decorrentes da rotina ao volante.",
      funcaoIntestinalDiurese: "Hábito intestinal preservado com evacuações diárias de consistência normal (Escala de Bristol tipo 4), sem dor, esforço evacuatório ou hematoquezia. Diurese clara, aumentada expressivamente em volume e frequência diurna e noturna (poliúria e noctúria)."
    },
    antropometria: {
      pesoAtual: 92.5,
      pesoHabitual: 84.5,
      estatura: 1.72,
      alturaJoelho: 53.5,
      circunferenciaCintura: 104.0,
      circunferenciaQuadril: 108.0,
      circunferenciaBraco: 35.0,
      circunferenciaPanturrilha: 38.5,
      dobraTricipital: 24.0,
      dobraSubescapular: 26.0,
      dobraSuprailiaca: 28.0,
      dobraAbdominal: 32.0,
      demaisAvaliacoes: "Circunferência do quadril: 108 cm (RCQ: 0.96, indicando risco cardiovascular muito aumentado); Dobra subescapular: 26 mm; Dobra suprailíaca: 28 mm; Dobra abdominal: 32 mm.",
      historicoPerdaPonderal: "Sem perda de peso; na verdade ganhou 8 kg nos últimos 2 anos de forma progressiva (ganho ponderal involuntário associado à rotina)."
    },
    bioquimica: [
      { exame: "Glicemia de Jejum", valor: "188 mg/dL", referencia: "< 99 mg/dL", interpretacao: "Hiperglicemia acentuada" },
      { exame: "Hemoglobina Glicada (HbA1c)", valor: "8.9 %", referencia: "< 5.7 % (meta < 7.0%)", interpretacao: "Mau controle glicêmico crônico" },
      { exame: "Colesterol Total", valor: "235 mg/dL", referencia: "< 190 mg/dL", interpretacao: "Hipercolesterolemia" },
      { exame: "HDL-Colesterol", valor: "38 mg/dL", referencia: "> 40 mg/dL", interpretacao: "HDL baixo / fator de risco cardiovascular" },
      { exame: "LDL-Colesterol", valor: "145 mg/dL", referencia: "< 100 mg/dL (meta < 70 em alto risco)", interpretacao: "Aumentado" },
      { exame: "Triglicerídeos", valor: "260 mg/dL", referencia: "< 150 mg/dL", interpretacao: "Hipertrigliceridemia moderada" },
      { exame: "Creatinina Sérica", valor: "0.95 mg/dL", referencia: "0.7 - 1.2 mg/dL", interpretacao: "Normal" },
      { exame: "Ureia Sérica", valor: "34 mg/dL", referencia: "15 - 45 mg/dL", interpretacao: "Normal" },
      { exame: "Ácido Úrico", valor: "6.8 mg/dL", referencia: "3.5 - 7.2 mg/dL", interpretacao: "Normal alto" },
      { exame: "TGO (AST)", valor: "28 U/L", referencia: "< 35 U/L", interpretacao: "Normal" },
      { exame: "TGP (ALT)", valor: "38 U/L", referencia: "< 45 U/L", interpretacao: "Normal" },
      { exame: "Sódio Sérico (Na+)", valor: "140 mEq/L", referencia: "135 - 145 mEq/L", interpretacao: "Normal" },
      { exame: "Potássio Sérico (K+)", valor: "4.4 mEq/L", referencia: "3.5 - 5.0 mEq/L", interpretacao: "Normal" }
    ],
    exameFisico: {
      estadoGeral: "Bom estado geral, lúcido, comunicativo, corado, hidratado, acianótico, anictérico.",
      sinaisEspecificos: "Presença de acantose nigricans visível na região posterior e lateral do pescoço (sinal clínico de resistência periférica grave à insulina). Sem lesões em membros inferiores; sensibilidade tátil dos pés preservada ao teste de monofilamento.",
      edema: "Ausência de edema em membros inferiores (+0/4). Pulsos pediosos e tibiais posteriores cheios e simétricos.",
      cavidadeOral: "Dentição própria inferior preservada e prótese parcial superior em ótimo estado. Mastigação eficiente, sem queixas de dor ou dificuldade de deglutição.",
      tgi: "Abdome globoso à custa de panículo adiposo e adiposidade visceral, flácido, indolor à palpação, sem visceromegalias palpáveis. Ruídos hidroaéreos normais. Sem queixas de pirose, náuseas ou vômitos."
    },
    consumoAlimentar: {
      padraoDiario: "Padrão alimentar caótico e hipercalórico condicionado pela jornada de trabalho em turnos alternados, caracterizado por longos períodos de jejum diurno compensados por episódios hiperfágicos noturnos de alta densidade energética. Observa-se consumo maciço de carboidratos refinados simples, alimentos ultraprocessados, bebidas açucaradas de alto índice glicêmico e gorduras saturadas em pontos comerciais de terminais urbanos, com ingestão desprezível de fibras e vegetais folhosos.",
      recordatorio24h: [
        { refeicao: "Café da manhã (05:30)", alimentos: "2 pães franceses com bastante margarina, 1 caneca grande (300mL) de café com leite integral e 3 colheres de chá cheias de açúcar refinado." },
        { refeicao: "Colação no ponto de ônibus (09:00)", alimentos: "1 lata de refrigerante comum (350mL) ou café açucarado de garrafa térmica + 1 pacote pequeno de biscoito doce." },
        { refeicao: "Almoço comercial (12:30)", alimentos: "Marmitex: 5 colheres de servir cheias de arroz branco, 1 concha de feijão, 2 pedaços médios de bife frito ou linguiça toscana, 2 rodelas de tomate (pouca ou nenhuma verdura). 1 copo grande de refrigerante de cola." },
        { refeicao: "Lanche da tarde no terminal (16:30)", alimentos: "1 salgado frito grande (geralmente coxinha ou pastel de carne) + 1 copo de suco de pacote ou refrigerante." },
        { refeicao: "Jantar em casa (20:30)", alimentos: "Repete a comida do almoço em grande quantidade, ou come 3 a 4 fatias de pizza de calabresa ou 3 pães franceses com mortadela/presunto e queijo prato + refrigerante." },
        { refeicao: "Ceia antes de deitar (23:00)", alimentos: "4 a 5 biscoitos recheados com 1 copo de leite integral com achocolatado açucarado." }
      ],
      ingestaoHidrica: "Baixa ingestão de água pura (aproximadamente 600 a 800 mL/dia). Ingere cerca de 1 a 1.5 litros de refrigerantes comuns e café açucarado diariamente.",
      preferencias: "Carnes vermelhas bem passadas, churrasco, massas, pães, refrigerantes, sobremesas doces.",
      aversoesIntolerancias: "Não gosta de legumes cozidos folhosos amargos (rúcula, jiló, quiabo). Nega qualquer tipo de alergia ou intolerância alimentar diagnosticada.",
      quemPrepara: "A esposa prepara as refeições da noite e finais de semana. Durante a jornada de trabalho, consome refeições em bares e lanchonetes de terminal rodoviário."
    },
    equipeMultiprofissional: {
      medico: "Paciente admitido no ambulatório com descontrole metabólico evidente: HbA1c 8.9% e PA sistólica elevada (145x92 mmHg). Risco cardiovascular alto conforme escore global. Solicito suporte nutricional intensivo com foco em perda ponderal de 5% a 10% em 6 meses, redução de sacarose e carboidratos refinados, controle da ingestão de sódio (< 2000mg/dia) e gordura saturada (< 7% do VET). Mantidas as medicações atuais com reavaliação laboratorial em 90 dias.",
      enfermagem: "Aferição de sinais vitais na triagem: PA = 146 x 92 mmHg; FC = 78 bpm; FR = 16 irpm; Temperatura axilar = 36.4 ºC. Glicemia capilar pontual às 14h: 214 mg/dL. Paciente foi orientado quanto ao horário correto das medicações prescritas, pois admitiu esquecimentos frequentes.",
      fonoaudiologia: "Paciente não apresenta sinais de disfagia, tosse ou engasgos. Funções de mastigação e deglutição orofaríngea plenamente preservadas. Sem necessidade de intervenção fonoaudiológica no momento.",
      psicologiaSocial: "Paciente expressa preocupação com o risco de complicações que viu em colegas de trabalho (amputações, problemas visuais), porém relata grande estresse pela rotina de trânsito e dificuldade logística para levar marmita fresca no ônibus."
    },
    questoesAvaliativas: [
      {
        id: "q1",
        pergunta: "1. Formule o Diagnóstico em Nutrição prioritário para este paciente utilizando a terminologia padronizada e a metodologia PES (Problema, Etiologia e Sinais/Sintomas).",
        tipo: "discursiva"
      },
      {
        id: "q2",
        pergunta: "2. Calcule o Valor Energético Total (VET) estimado para o paciente, justificando a fórmula ou regra de bolso escolhida (especifique o peso de referência utilizado: atual, ideal ou ajustado) e a meta de perda ponderal.",
        tipo: "discursiva"
      },
      {
        id: "q3",
        pergunta: "3. Estabeleça a distribuição de macronutrientes recomendada para este caso (em percentual do VET e em g/kg de peso), detalhando as recomendações específicas quanto ao tipo de carboidrato (índice e carga glicêmica, sacarose), fibras alimentares e perfil lipídico (saturados, poli-insaturados e monoinsaturados).",
        tipo: "discursiva"
      },
      {
        id: "q4",
        pergunta: "4. Diante da rotina de motorista de ônibus urbano (turnos e alimentação em terminais), quais estratégias práticas de planejamento alimentar e orientações dietoterápicas você prescreveria para viabilizar a adesão do paciente?",
        tipo: "discursiva"
      }
    ],
    resolucaoGabarito: {
      diagnosticoNutricional: "Ingestão excessiva de carboidratos simples e gorduras (P) relacionada a escolhas alimentares inadequadas associadas à rotina ocupacional e falta de planejamento (E), evidenciada por HbA1c de 8.9%, glicemia de jejum de 188 mg/dL, triglicerídeos de 260 mg/dL e IMC de 31.27 kg/m² caracterizando Obesidade Grau I (S).",
      calculoEnergetico: "Peso ideal para IMC 24.9 kg/m² = ~73.6 kg; Peso ajustado = 73.6 + 0.25*(92.5 - 73.6) = ~78.3 kg. Utilizando regra de bolso para perda de peso em paciente obeso com DM: 20 a 25 kcal/kg de peso atual (ou 25 a 30 kcal/kg peso ajustado) -> VET estimado entre 1800 e 1950 kcal/dia (déficit diário de 500 a 700 kcal).",
      distribuicaoMacronutrientes: "Carboidratos: 45% a 50% do VET (ênfase em carboidratos complexos ricos em fibras solúveis e insolúveis; sacarose < 5% do VET; fibras > 30g/dia); Proteínas: 15% a 20% do VET (1.0 a 1.2 g/kg de peso ideal/ajustado); Lipídios: 30% a 35% do VET (gordura saturada < 7%, poli-insaturados até 10%, monoinsaturados 15-20%, gordura trans zero). Sódio: restrição a < 2000 mg de sódio/dia (5g de sal de cozinha).",
      condutaPlanejamento: "Fracionamento em 5 a 6 refeições; eliminação de bebidas açucaradas (refrigerantes e sucos de pacote), substituindo por água e infusões sem açúcar; substituição de cereais refinados por integrais; lanches práticos para o ônibus (frutas com casca, castanhas/oleaginosas, iogurte desnatado, sanduíche natural em pão integral); inclusão de saladas cruas e legumes no almoço e jantar."
    }
  },
  {
    id: "caso-drc-idoso",
    disciplinaId: "dietoterapia",
    title: "Caso 2: Paciente Idosa Hospitalizada com Desnutrição e DRC Conservadora (Estágio 4)",
    category: "Hospitalar / Geriatria / Nefrologia",
    description: "Paciente de 76 anos internada com fraqueza intensa, uremia sintomática, náuseas matinais e perda ponderal grave de 14.4% nos últimos 3 meses.",
    neeKcal: 1500,
    vetRecordatorioHabitual: 920,
    isLocked: false,
    visivel: true,
    habilitarQuestoesAvaliativas: true,
    blockedTabs: [],
    patient: {
      name: "Lourdes Maria de Oliveira",
      age: 76,
      gender: "Feminino",
      occupation: "Aposentada (ex-costureira)",
      maritalStatus: "Viúva",
      residence: "Campinas - SP",
      avatar: "👵"
    },
    history: {
      queixaPrincipal: "Eu não aguento mais essa fraqueza no corpo, minha filha que precisou me trazer. Já faz quase um mês que eu olho para a comida e não desce nada, sinto um enjoo muito ruim toda manhã, a boca fica amarga como se eu tivesse mastigando ferro ou moeda velha e as pernas parecem pesadas feito chumbo. Minhas roupas estão todas caindo e já perdi quase oito quilos sem querer.",
      hda: "Paciente idosa de 76 anos, portadora de Doença Renal Crônica em estágio 4 não dialítico (eTFG estimada em 21 mL/min/1,73m²) e hipertensão arterial crônica de longa data, admitida na enfermaria de clínica médica para compensação de síndrome urêmica sintomática e desnutrição energético-proteica aguda. Apresenta astenia incapacitante, hiporexia severa com recusa alimentar superior a 75% da ingestão habitual nas últimas 3 semanas, náuseas matinais diárias, xerostomia e queixa de disgeusia pronunciada ('gosto metálico'). A cuidadora familiar confirma redução ponderal involuntária progressiva de 7,8 kg no último trimestre (perda de 14,4% da massa corporal total), acompanhada de sonolência e fadiga aos mínimos esforços.",
      hpp: "Diagnóstico prévio de hipertensão arterial sistêmica há 25 anos em uso regular de medicação e doença renal crônica estágio 4 diagnosticada há 3 anos com declínio progressivo da filtração glomerular. Apresenta osteoartrite moderada em articulações de joelhos. Nega histórico de diabetes mellitus, tabagismo, etilismo ou cardiopatia isquêmica prévia.",
      historiaFamiliar: "Histórico paterno de falecimento por complicações decorrentes de nefropatia aos 70 anos. Histórico materno positivo para hipertensão arterial crônica e demência senil.",
      medicamentos: "Enalapril 10mg (1 comprimido via oral pela manhã); Furosemida 40mg (1 comprimido pela manhã); Carbonato de Cálcio 500mg (1 comprimido junto às refeições de almoço e jantar prescrito como quelante intestinal de fósforo); Ondansetrona 8mg se náuseas ou êmese.",
      habitosVida: "Quadro de sedentarismo extremo condicionado pela senescência e limitação álgica articular, permanecendo a maior parte do dia em repouso no leito ou em poltrona. Reside com a filha que desempenha o papel de cuidadora primária.",
      funcaoIntestinalDiurese: "Hábito intestinal caracterizado por constipação crônica agravada no período de internação (evacuações a cada 4 ou 5 dias com fezes ressecadas tipo Bristol 1 ou 2). Diurese espontânea oligúrica em 24h (~700 mL/dia), límpida a moderadamente concentrada, sem hematúria macroscópica."
    },
    antropometria: {
      pesoAtual: 46.2,
      pesoHabitual: 54.0,
      estatura: 1.55,
      alturaJoelho: 48.5,
      circunferenciaCintura: 72.0,
      circunferenciaQuadril: 88.0,
      circunferenciaBraco: 21.5,
      circunferenciaPanturrilha: 28.5,
      dobraTricipital: 8.0,
      dobraSubescapular: 7.5,
      dobraSuprailiaca: 9.0,
      dobraAbdominal: 10.0,
      demaisAvaliacoes: "Circunferência do quadril: 88 cm (RCQ: 0.81); Dobra subescapular: 7.5 mm; CMB: 18.9 cm (< percentil 5 - depleção muscular grave); Altura do Joelho aferida no leito: 48.5 cm (estimativa de estatura de Chumlea: 1.55 m).",
      historicoPerdaPonderal: "Perda involuntária de 7.8 kg em 3 meses (redução de 14.4% do peso corporal, classificada como perda grave e aguda no idoso)."
    },
    bioquimica: [
      { exame: "Creatinina Sérica", valor: "2.9 mg/dL", referencia: "0.5 - 1.0 mg/dL", interpretacao: "Insuficiência renal avançada" },
      { exame: "Ureia Sérica", valor: "118 mg/dL", referencia: "15 - 45 mg/dL", interpretacao: "Uremia acentuada (causa das náuseas e disgeusia)" },
      { exame: "Taxa de Filtração Glomerular (eTFG)", valor: "21 mL/min/1.73m²", referencia: "> 60 mL/min", interpretacao: "DRC Estágio 4 (pré-dialítico grave)" },
      { exame: "Potássio Sérico (K+)", valor: "5.4 mEq/L", referencia: "3.5 - 5.0 mEq/L", interpretacao: "Hipercalemia leve a moderada" },
      { exame: "Fósforo Sérico (P)", valor: "5.8 mg/dL", referencia: "2.5 - 4.5 mg/dL", interpretacao: "Hiperfosfatemia relevante" },
      { exame: "Cálcio Sérico Total", valor: "8.6 mg/dL", referencia: "8.5 - 10.2 mg/dL", interpretacao: "Normal baixo" },
      { exame: "Albumina Sérica", valor: "2.9 g/dL", referencia: "3.5 - 5.0 g/dL", interpretacao: "Hipoalbuminemia importante (desnutrição/inflamação)" },
      { exame: "Hemoglobina (Hb)", valor: "9.4 g/dL", referencia: "12.0 - 15.5 g/dL", interpretacao: "Anemia normocítica/normocrômica da doença renal" },
      { exame: "Hematócrito (Ht)", valor: "29.0 %", referencia: "36.0 - 46.0 %", interpretacao: "Reduzido" },
      { exame: "Bicarbonato Sérico", valor: "19 mEq/L", referencia: "22 - 28 mEq/L", interpretacao: "Acidose metabólica leve" },
      { exame: "Glicemia de Jejum", valor: "88 mg/dL", referencia: "< 99 mg/dL", interpretacao: "Normal" }
    ],
    exameFisico: {
      estadoGeral: "Estado geral comprometido, emagrecida, hipocorada 2+/4+, discretamente desidratada 1+/4+, anictérica, sonolenta mas responde prontamente quando chamada.",
      sinaisEspecificos: "Perda severa e visível de massa muscular temporal bilateral (fossa temporal escavada), clavículas e costelas proeminentes, adelgaçamento evidente da musculatura de quadríceps e panturrilha (CP de 28.5 cm indica sarcopenia). Bola gordurosa de Bichat deprimida.",
      edema: "Discreto edema perimaleolar bilateral (+1/4) com cacifo moderado. Pele fina, seca e descamativa.",
      cavidadeOral: "Hálito urêmico característico (odor amoniacal leve). Mucosa oral ressecada (xerostomia). Prótese total superior e inferior bem ajustadas, porém relata cansaço e fadiga rápida ao mastigar carnes e alimentos secos.",
      tgi: "Abdome escavado, ruídos hidroaéreos diminuídos, indolor à palpação superficial e profunda. Sem visceromegalias. Náuseas frequentes ao sentir cheiro forte de comida quente."
    },
    consumoAlimentar: {
      padraoDiario: "Ingestão calórico-proteica gravemente deficitária com consumo energético habitual inferior a 700 kcal/dia nas últimas semanas. Observa-se aversão acentuada a carnes vermelhas, aves e caldos concentrados secundária à disgeusia urêmica, associada à recusa sistemática de preparações sólidas e quentes devido a náuseas desencadeadas por estímulos olfativos.",
      recordatorio24h: [
        { refeicao: "Café da manhã no hospital (08:00)", alimentos: "1 fatia fina de pão de forma com manteiga (deixou a casca) + 1/2 xícara de chá de erva-doce morno com 1 colherzinha de açúcar." },
        { refeicao: "Colação (10:00)", alimentos: "Recusou a fruta oferecida (alegou náusea)." },
        { refeicao: "Almoço (12:00)", alimentos: "2 colheres de sopa de purê de batata inglesa e 1 garfada de peito de frango desfiado (rejeitou todo o restante da bandeja por enjoo e odor)." },
        { refeicao: "Lanche da tarde (15:30)", alimentos: "1/2 copo pequeno de suco de maçã diluído." },
        { refeicao: "Jantar (18:30)", alimentos: "1 concha pequena de sopa rala de fubá com abobrinha. Não aceitou carne nem sobremesa." },
        { refeicao: "Ceia (21:00)", alimentos: "Recusou alimentação." }
      ],
      ingestaoHidrica: "Aproximadamente 500 mL de líquidos/dia (água e chás fracos), restrita pelo desânimo e recomendação anterior.",
      preferencias: "Preparações cremosas, frias ou mornas, purês, compotas caseiras de frutas de baixo potássio (maçã, pera cozida).",
      aversoesIntolerancias: "Aversão intensa a carnes vermelhas (gosto amargo/metálico), café preto, preparações com cheiro forte de alho e cebola refogados.",
      quemPrepara: "No hospital, a dieta da copa; em casa, a filha prepara tudo, mas tinha muitas dúvidas sobre o que a mãe podia comer."
    },
    equipeMultiprofissional: {
      medico: "Paciente idosa com DRC estágio 4 agudizada sobre crônica e uremia sintomática gerando hiporexia severa e perda ponderal grave. Não tem indicação de hemodiálise de urgência no momento, porém a TFG é de 21 mL/min. Conduta médica: controle estrito da proteinúria e retenção de escórias nitrogenadas com dieta hipoproteica equilibrada (0.6 a 0.8 g/kg/dia se tolerado, sem desnutrir ainda mais), controle de potássio (< 50 mEq/dia) e restrição de fósforo sérico (< 800-1000 mg/dia) com uso obrigatório do carbonato de cálcio junto às principais refeições. Hidratação cuidadosa pelo risco de edema.",
      enfermagem: "Sinais vitais: PA = 132 x 82 mmHg; FC = 74 bpm; FR = 18 irpm; Afebril (36.2ºC). Peso matinal de 46.2 kg. Diurese aferida de 720 mL nas últimas 24h. Edema em membros inferiores +1/4. Constipação ativa há 4 dias (sem evacuações desde a admissão).",
      fonoaudiologia: "Avaliação fonoaudiológica clínica da deglutição: Ausência de disfagia mecânica, tosse ou engasgos com líquidos ou pastosos. Constatada lentidão e fadiga dos músculos mastigatórios ao mastigar sólidos rígidos. Recomendação fonoaudiológica: dieta de consistência branda a pastosa macia para diminuir o gasto energético na mastigação e favorecer a ingestão voluntária.",
      psicologiaSocial: "Acompanhante (filha) muito fragilizada emocionalmente, com medo de perder a mãe e sentindo culpa por não conseguir fazê-la comer em casa. Necessita de suporte e orientações práticas de preparo culinário para alta hospitalar."
    },
    questoesAvaliativas: [
      {
        id: "q1",
        pergunta: "1. Formule o Diagnóstico em Nutrição (PES) considerando a faixa etária idosa, a perda de peso acelerada, a desnutrição proteico-calórica e a DRC em estágio 4.",
        tipo: "discursiva"
      },
      {
        id: "q2",
        pergunta: "2. Como deve ser a recomendação proteica (em g de proteína/kg de peso/dia) para este paciente em tratamento conservador de DRC estágio 4 versus a necessidade premente de recuperação do estado nutricional? Justifique o dilema clínico e a prescrição adotada.",
        tipo: "discursiva"
      },
      {
        id: "q3",
        pergunta: "3. Quais as condutas dietoterápicas obrigatórias quanto ao controle de fósforo, potássio e sódio na dieta da paciente, considerando os exames de K+ (5.4 mEq/L) e P (5.8 mg/dL)? Descreva as técnicas dietéticas de preparo (ex: remolho e cocção de vegetais).",
        tipo: "discursiva"
      },
      {
        id: "q4",
        pergunta: "4. Diante do quadro de uremia, xerostomia, hipogeusia (gosto metálico) e cansaço mastigatório apontado pela fonoaudiologia, quais estratégias sensoriais, de consistência e de fracionamento você prescreveria no planejamento alimentar?",
        tipo: "discursiva"
      }
    ],
    resolucaoGabarito: {
      diagnosticoNutricional: "Desnutrição proteico-calórica grave (P) relacionada à baixa ingestão alimentar secundária à síndrome urêmica (hiporexia, náuseas e disgeusia) e restrições dietéticas prévias (E), evidenciada por perda de peso involuntária de 14.4% em 3 meses, IMC de 19.23 kg/m², hipoalbuminemia de 2.9 g/dL e sinais evidentes de atrofia muscular e subcutânea (S).",
      calculoEnergetico: "VET: 30 a 35 kcal/kg de peso/dia (para garantir balanço nitrogenado neutro ou positivo e evitar autocanibalismo muscular/catabolismo que aumentaria a ureia). Considerando peso de 46.2 kg -> ~1400 a 1600 kcal/dia. Proteína: 0.6 a 0.8 g/kg/dia (cerca de 28 a 37 g/dia), sendo pelo menos 50% de alto valor biológico (ovo, laticínios pobres em fósforo, peixe/frango). Evitar dietas excessivamente restritivas (< 0.55g/kg) sem cetodietas pelo alto risco de morte por desnutrição.",
      distribuicaoMacronutrientes: "Carboidratos: 55 a 65% do VET (fornecendo calorias não-proteicas para poupar proteína); Lipídios: 25 a 30% do VET (ênfase em azeite de oliva e fontes mono/poli-insaturadas). Potássio: restringir a < 2000-2400 mg/dia (técnica de dupla cocção em água abundante com descarte da água para hortaliças e tubérculos). Fósforo: limitar a < 800 mg/dia (evitar carnes processadas com aditivos fosfatados inorgânicos de alta biodisponibilidade e orientar quelante carbonato de cálcio junto às refeições). Sódio: 1500 a 2000 mg/dia.",
      condutaPlanejamento: "Dieta fracionada em 6 pequenas refeições ao dia em consistência pastosa ou branda/macia (purês enriquecidos, papas, suflês macios); preparações servidas frias ou em temperatura ambiente para diminuir a exalação de vapores aromáticos que deflagram náuseas; higienização bucal frequente antes das refeições com água gelada ou gotas de limão para combater a boca amarga/metálica."
    }
  },
  {
    id: "caso-gastrectomia-dumping",
    disciplinaId: "dietoterapia",
    title: "Caso 3: Paciente Pós-Gastrectomia Subtotal com Síndrome de Dumping",
    category: "Cirúrgico / Trato Gastrointestinal",
    description: "Paciente de 42 anos no 45º dia de pós-operatório de gastrectomia com queixas intensas de tontura, sudorese, taquicardia e diarreia explosiva pós-prandial.",
    neeKcal: 2150,
    vetRecordatorioHabitual: 1380,
    isLocked: false,
    visivel: true,
    habilitarQuestoesAvaliativas: true,
    blockedTabs: [],
    patient: {
      name: "Roberto Silveira Santos",
      age: 42,
      gender: "Masculino",
      occupation: "Técnico em Manutenção de Informática",
      maritalStatus: "Casado",
      residence: "Ribeirão Preto - SP",
      avatar: "👨‍💻"
    },
    history: {
      queixaPrincipal: "Doutor(a), eu estou com um medo enorme de comer. Desde que eu passei pela cirurgia de retirada do estômago, cerca de vinte minutos depois que eu almoço ou quando como qualquer doce, meu coração começa a disparar forte no peito, eu começo a suar frio pela testa, as vistas escurecem de tontura e logo em seguida vem uma cólica desesperadora com diarreia que tenho que sair correndo pro banheiro. Depois de uma hora e meia ainda sinto minhas mãos tremerem como se eu fosse desmaiar.",
      hda: "Paciente masculino de 42 anos, no 45º dia de pós-operatório tardio de gastrectomia subtotal com reconstrução em Y de Roux secundária a complicação de úlcera péptica gástrica terebrante com displasia de alto grau. Evolui com quadro clínico típico de Síndrome de Dumping mista: fase precoce vasomotora e gastrointestinal aos 15 a 30 minutos pós-prandiais (plenitude precoce desconfortável, sudorese profusa, palpitações taquicárdicas e diarreia líquida motora explosiva secundária à sobrecarga osmótica hiperosmolar no jejuno) associada à fase tardia aos 90 a 120 minutos pós-prandiais (tremores de extremidades, diaforese e lipotimia decorrentes de hipoglicemia reativa hiperinsulinêmica). Paciente desenvolveu sitofobia (medo de se alimentar) que culminou em emagrecimento severo de 11,0 kg em 45 dias.",
      hpp: "Histórico pregresso de gastrite crônica e úlcera péptica associada a H. pylori erradicada no pré-operatório. Sem antecedentes de hipertensão arterial ou diabetes mellitus. Ex-tabagista (cessação há 6 meses após a indicação cirúrgica).",
      historiaFamiliar: "Histórico materno de neoplasia gástrica aos 65 anos. Histórico paterno de hipertensão arterial sistêmica.",
      medicamentos: "Omeprazol 40mg (1 comprimido em jejum pela manhã); suplemento polivitamínico e mineral por via oral (1 comprimido ao dia); Dimeticona em gotas se meteorismo ou distensão abdominal.",
      habitosVida: "Atividade profissional desempenhada predominantemente sentado em bancada técnica de testes computacionais. Atualmente em benefício temporário de auxílio-doença pelo INSS em decorrência da incapacidade funcional gerada pelos sintomas pós-prandiais.",
      funcaoIntestinalDiurese: "Evacuações diarreicas explosivas de padrão motor e osmótico (fezes líquidas Bristol 7) cerca de 2 a 3 vezes ao dia, tipicamente 20 a 40 minutos após o almoço ou jantar. Diurese fisiológica preservada em volume e coloração."
    },
    antropometria: {
      pesoAtual: 67.0,
      pesoHabitual: 78.0,
      estatura: 1.75,
      alturaJoelho: 54.5,
      circunferenciaCintura: 79.0,
      circunferenciaQuadril: 92.0,
      circunferenciaBraco: 27.0,
      circunferenciaPanturrilha: 33.0,
      dobraTricipital: 11.0,
      dobraSubescapular: 13.0,
      dobraSuprailiaca: 14.0,
      dobraAbdominal: 16.0,
      demaisAvaliacoes: "Circunferência do quadril: 92 cm (RCQ: 0.86); Dobra subescapular: 13 mm; Dobra suprailíaca: 14 mm; Dobra abdominal: 16 mm.",
      historicoPerdaPonderal: "Perda ponderal de 11.0 kg em 45 dias (redução de 14.1% do peso pré-cirúrgico, configurando perda severa aguda pós-operatória)."
    },
    bioquimica: [
      { exame: "Hemoglobina (Hb)", valor: "11.2 g/dL", referencia: "13.5 - 17.5 g/dL", interpretacao: "Anemia leve" },
      { exame: "Hematócrito (Ht)", valor: "34.5 %", referencia: "40.0 - 52.0 %", interpretacao: "Reduzido" },
      { exame: "Ferritina Sérica", valor: "18 ng/mL", referencia: "30 - 400 ng/mL", interpretacao: "Depleção de estoques de ferro (risco de anemia ferropriva pós-gastrectomia)" },
      { exame: "Vitamina B12", valor: "195 pg/mL", referencia: "200 - 900 pg/mL", interpretacao: "Deficiência de B12 incipiente (perda de fator intrínseco e bypass duodenal)" },
      { exame: "Glicemia de Jejum", valor: "82 mg/dL", referencia: "< 99 mg/dL", interpretacao: "Normal" },
      { exame: "Glicemia Pós-Prandial (90 min)", valor: "54 mg/dL", referencia: "> 70 mg/dL", interpretacao: "Hipoglicemia reativa importante (Dumping tardio)" },
      { exame: "Albumina Sérica", valor: "3.6 g/dL", referencia: "3.5 - 5.0 g/dL", interpretacao: "Normal limítrofe inferior" },
      { exame: "Proteínas Totais", valor: "6.2 g/dL", referencia: "6.0 - 8.0 g/dL", interpretacao: "Normal baixo" },
      { exame: "Sódio Sérico (Na+)", valor: "139 mEq/L", referencia: "135 - 145 mEq/L", interpretacao: "Normal" },
      { exame: "Potássio Sérico (K+)", valor: "4.1 mEq/L", referencia: "3.5 - 5.0 mEq/L", interpretacao: "Normal" }
    ],
    exameFisico: {
      estadoGeral: "Lúcido, orientado, fáceis de ansiedade e apreensão evidente em relação ao ato de se alimentar, corado 1+/4+, hidratado, acianótico, anictérico.",
      sinaisEspecificos: "Cicatriz cirúrgica mediana supraumbilical com boa coaptação e aspecto fisiológico, sem sinais flogísticos ou hérnias incisionais. Pele e mucosas sem lesões.",
      edema: "Ausência de edema periférico.",
      cavidadeOral: "Dentição íntegra e completa. Mastigação muito rápida e ansiosa (costuma mastigar poucas vezes e engolir depressa).",
      tgi: "Abdome plano, ruídos hidroaéreos acentuados e audíveis à ausculta em mesogástrio imediatamente após a ingestão de água e alimentos. Timpanismo difuso aumentado. Desconforto à palpação profunda pós-prandial."
    },
    consumoAlimentar: {
      padraoDiario: "Padrão dietético transgressor e inadequado ao pós-operatório gástrico: realiza refeições excessivamente volumosas em apenas 3 momentos ao dia, ingere grandes volumes hídricos durante as refeições principais e consome preparações hiperosmolares ricas em sacarose na tentativa equivocada de estancar a perda de peso, desencadeando esvaziamento gástrico precipitado.",
      recordatorio24h: [
        { refeicao: "Café da manhã (07:30)", alimentos: "1 xícara grande de café com leite e 2 colheres cheias de açúcar + 2 fatias de bolo caseiro açucarado." },
        { refeicao: "Colação (10:00)", alimentos: "Não costuma comer nada no meio da manhã." },
        { refeicao: "Almoço (12:30)", alimentos: "Prato grande com arroz branco, feijão com caldo, carne cozida picada e 1 copo grande (300mL) de suco de laranja bem adoçado ingerido junto com a comida. 20 min depois relata taquicardia e diarreia." },
        { refeicao: "Lanche da tarde (16:00)", alimentos: "1 lata de refrigerante com 1 pacote pequeno de bolacha doce." },
        { refeicao: "Jantar (19:30)", alimentos: "1 prato fundo de sopa de legumes com macarrão e carne + 1 copo de refrigerante. Seguido de náusea e distensão abdominal." },
        { refeicao: "Ceia (22:00)", alimentos: "Não consome por medo de passar mal deitado." }
      ],
      ingestaoHidrica: "Ingere cerca de 1.8 L de líquidos por dia, mas concentra quase metade desse volume concomitantemente com as grandes refeições de almoço e jantar.",
      preferencias: "Gosta de massas, pães doces, sobremesas, caldos e sucos de frutas.",
      aversoesIntolerancias: "Relata que leite puro causa gases e distensão (provável intolerância secundária transitória à lactose por trânsito acelerado).",
      quemPrepara: "A esposa prepara as refeições, mas ambos desconheciam as regras de separação de sólidos e líquidos pós-gastrectomia."
    },
    equipeMultiprofissional: {
      medico: "Paciente no 45º DPO de gastrectomia subtotal com reconstrução em Y de Roux. Apresenta quadro fisiopatológico clássico de Síndrome de Dumping mista (fase precoce osmótica com hipotensão/taquicardia/diarreia aos 20-30 min e fase tardia com hipoglicemia reativa aos 90-120 min). Perda de peso acelerada de 11 kg. Antes de qualquer tentativa farmacológica com análogos de somatostatina (octreotida) ou acarbose, a intervenção prioritária e resolutiva é o ajuste dietoterápico rigoroso. Solicito intervenção da nutrição.",
      enfermagem: "Aferição pós-prandial durante observação: logo após ingerir suco açucarado no almoço, paciente apresentou PA transitória de 95x60 mmHg com FC de 112 bpm e sudorese fria em fronte, melhorando após deitar-se em decúbito dorsal por 30 minutos.",
      fonoaudiologia: "Sem alterações na musculatura faríngea ou deglutição. Observada mastigação extremamente acelerada, recomendando orientação de mastigação lenta e pausas entre bocados.",
      psicologiaSocial: "Paciente encontra-se altamente angustiado, referindo 'medo de comer' e sensação de que a cirurgia deu errado, necessitando de acolhimento e explicação clara de que seus sintomas são de origem alimentar e totalmente controláveis com a dieta correta."
    },
    questoesAvaliativas: [
      {
        id: "q1",
        pergunta: "1. Formule o Diagnóstico em Nutrição prioritário (PES) para este paciente considerando a Síndrome de Dumping e a perda de peso acelerada.",
        tipo: "discursiva"
      },
      {
        id: "q2",
        pergunta: "2. Explique a fisiopatologia que diferencia a Síndrome de Dumping Precoce da Síndrome de Dumping Tardia demonstradas no caso, correlacionando-as com as queixas do paciente.",
        tipo: "discursiva"
      },
      {
        id: "q3",
        pergunta: "3. Elabore a prescrição dietoterápica detalhada para a prevenção do Dumping: volume por refeição, número de refeições diárias (fracionamento), consistência, temperatura dos alimentos e a regra essencial de ingestão de líquidos.",
        tipo: "discursiva"
      },
      {
        id: "q4",
        pergunta: "4. Quais nutrientes e vitaminas devem ser monitorados e suplementados a médio e longo prazo neste paciente gastrectomizado e por quais razões anatômicas/absortivas?",
        tipo: "discursiva"
      }
    ],
    resolucaoGabarito: {
      diagnosticoNutricional: "Alteração da função gastrointestinal (P) relacionada à perda do reservatório gástrico e do esfíncter pilórico pós-gastrectomia com ingestão alimentar inadequada de carboidratos simples e líquidos com as refeições (E), evidenciada por sintomas clássicos de Síndrome de Dumping precoce (taquicardia, sudorese, diarreia explosiva) e tardia (hipoglicemia de 54 mg/dL) e perda ponderal de 14.1% em 45 dias (S).",
      calculoEnergetico: "VET hipercalórico/normocalórico e hiperproteico para recuperação de peso: 30 a 35 kcal/kg de peso atual (2000 a 2300 kcal/dia). Proteínas: 1.2 a 1.5 g/kg de peso atual (80 a 100g de proteína/dia) para suporte cicatricial e recuperação de massa magra; Carboidratos: 40 a 45% do VET (complexos, ricos em fibras solúveis como pectina/goma guar para retardar o esvaziamento; rigorosa exclusão de sacarose, frutose e doces concentrados); Lipídios: 30 a 35% do VET para garantir aporte calórico em baixo volume.",
      distribuicaoMacronutrientes: "Fracionamento rigoroso em 6 a 8 pequenas refeições diárias (volumes reduzidos de 150 a 200 mL por vez); separação obrigatória entre sólidos e líquidos (não ingerir líquidos durante as refeições, consumindo-os 45 a 60 minutos antes ou após); temperatura morna a ambiente (evitar extremos de temperatura que estimulam peristaltismo); orientar repouso em decúbito dorsal por 20 a 30 minutos após as refeições principais se necessário para lentificar o trânsito.",
      condutaPlanejamento: "Monitoramento e suplementação de Vitamina B12 por via parenteral/sublingual (devido à perda de células parietais produtoras de fator intrínseco), Ferro elementar (perda da acidez gástrica que reduz Fe3+ a Fe2+ e bypass duodenal), Cálcio e Vitamina D (prevenção de osteomalácia), e monitoramento de folato e zinco."
    }
  }
];

// Salva e recupera casos e disciplinas do LocalStorage
const STORAGE_KEY_CASES = "dietoterapia_casos_clinicos_v1";
const STORAGE_KEY_DISCIPLINAS = "dietocase_disciplinas_v1";

if (typeof window !== "undefined") {
  window.STORAGE_KEY_CASES = STORAGE_KEY_CASES;
  window.STORAGE_KEY_DISCIPLINAS = STORAGE_KEY_DISCIPLINAS;
}

// Disciplinas acadêmicas predefinidas
const DEFAULT_DISCIPLINAS = [
  {
    id: "dietoterapia",
    nome: "Dietoterapia",
    codigo: "NUT-301",
    icone: "🥗",
    descricao: "Manejo dietoterápico nas patologias e doenças crônicas não transmissíveis."
  },
  {
    id: "estagios",
    nome: "Estágios Curriculares",
    codigo: "NUT-EST",
    icone: "🏥",
    descricao: "Atendimento clínico supervisionado, ambulatório escola e enfermaria hospitalar."
  }
];

function getDisciplinas() {
  const stored = localStorage.getItem(STORAGE_KEY_DISCIPLINAS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(DEFAULT_DISCIPLINAS));
    return DEFAULT_DISCIPLINAS;
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_DISCIPLINAS;
  } catch (e) {
    console.error("Erro ao carregar disciplinas do localStorage:", e);
    return DEFAULT_DISCIPLINAS;
  }
}

function saveDisciplinas(disciplinas) {
  localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(disciplinas));
}

function resetDefaultDisciplinas() {
  localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(DEFAULT_DISCIPLINAS));
  return DEFAULT_DISCIPLINAS;
}

function getCases() {
  const stored = localStorage.getItem(STORAGE_KEY_CASES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(DEFAULT_CASES));
    return DEFAULT_CASES;
  }
  try {
    const parsed = JSON.parse(stored);
    // Garante que isLocked, visivel, blockedTabs e disciplinaId existam com compatibilidade retroativa
    return parsed.map(c => ({
      ...c,
      isLocked: c.isLocked === true,
      visivel: c.visivel !== false,
      blockedTabs: Array.isArray(c.blockedTabs) ? c.blockedTabs : [],
      disciplinaId: c.disciplinaId || "dietoterapia"
    }));
  } catch (e) {
    console.error("Erro ao carregar casos do localStorage, recarregando padrões:", e);
    return DEFAULT_CASES;
  }
}

function saveCases(cases) {
  localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
}

function resetDefaultCases() {
  localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(DEFAULT_CASES));
  resetDefaultDisciplinas();
  return DEFAULT_CASES;
}

// Catálogo de modelos predefinidos de profissionais para adição rápida
const PROFESSIONAL_PRESETS = [
  { id: "medico", nome: "Médico(a) Assistente", avatar: "🩺", especialidade: "Medicina Clínica / Especialista", defaultParecer: "Parecer médico: diagnósticos clínicos, metas terapêuticas e prescrição farmacológica." },
  { id: "enfermagem", nome: "Enfermeiro(a) do Plantão", avatar: "💉", especialidade: "Enfermagem e Cuidados Clínicos", defaultParecer: "Aferição de sinais vitais na triagem (PA, FC, FR, Temp), glicemia capilar e aceitação da dieta." },
  { id: "fono", nome: "Fonoaudiólogo(a)", avatar: "🗣️", especialidade: "Deglutição e Mastigação", defaultParecer: "Avaliação fonoaudiológica funcional: mastigação, risco de disfagia e consistência alimentar indicada." },
  { id: "psicologia", nome: "Psicólogo(a) / Apoio Social", avatar: "🤝", especialidade: "Aspectos Psicossociais", defaultParecer: "Acolhimento psicossocial: aspectos emocionais, adesão ao plano de cuidado e apoio familiar." },
  { id: "fisioterapia", nome: "Fisioterapeuta", avatar: "🏃", especialidade: "Reabilitação Motora e Respiratória", defaultParecer: "Avaliação fisioterapêutica: mobilidade funcional, capacidade cardiorrespiratória e fortalecimento motor." },
  { id: "farmacia", nome: "Farmacêutico(a) Clínico(a)", avatar: "💊", especialidade: "Farmácia Clínica e Interações", defaultParecer: "Revisão farmacoterapêutica: horários de administração, potenciais interações fármaco-nutriente e polifarmácia." },
  { id: "odontologia", nome: "Cirurgião(ã)-Dentista", avatar: "🦷", especialidade: "Saúde Bucal e Estomatologia", defaultParecer: "Avaliação odontológica: saúde bucal, integridade da mucosa oral, adaptação de prótese e mastigação." },
  { id: "terapia_ocupacional", nome: "Terapeuta Ocupacional", avatar: "🧩", especialidade: "Autonomia nas AVDs", defaultParecer: "Avaliação da autonomia no ato de alimentar-se e prescrição de adaptação de talheres e utensílios." },
  { id: "educacao_fisica", nome: "Profissional de Ed. Física", avatar: "🏋️", especialidade: "Exercício e Composição Corporal", defaultParecer: "Prescrição de treinamento físico, gasto calórico das atividades e preservação de massa magra." },
  { id: "servico_social", nome: "Assistente Social", avatar: "👥", especialidade: "Vulnerabilidade e Acesso", defaultParecer: "Avaliação da vulnerabilidade social, segurança alimentar domiciliar e articulação com programas sociais." },
  { id: "personalizado", nome: "Especialista Personalizado", avatar: "🏥", especialidade: "Equipe de Saúde", defaultParecer: "Parecer técnico e observações clínicas deste profissional sobre o quadro do paciente." }
];

// Normaliza a equipe multiprofissional para formato dinâmico (array de objetos)
function normalizeEquipeMultiprofissional(rawEquipe) {
  if (!rawEquipe) return [];
  if (Array.isArray(rawEquipe)) {
    return rawEquipe.map((p, idx) => ({
      id: p.id || `prof_${Date.now()}_${idx}`,
      nome: p.nome || p.role || "Profissional de Saúde",
      avatar: p.avatar || "🩺",
      especialidade: p.especialidade || "Equipe Multiprofissional",
      parecer: p.parecer || ""
    }));
  }

  // Objeto legado { medico: "...", enfermagem: "...", fonoaudiologia: "...", psicologiaSocial: "..." }
  const list = [];
  if (rawEquipe.medico !== undefined && rawEquipe.medico !== null) {
    list.push({ id: "medico", nome: "Médico(a) Assistente", avatar: "🩺", especialidade: "Medicina Clínica", parecer: String(rawEquipe.medico) });
  }
  if (rawEquipe.enfermagem !== undefined && rawEquipe.enfermagem !== null) {
    list.push({ id: "enfermagem", nome: "Enfermeiro(a) do Plantão", avatar: "💉", especialidade: "Enfermagem e Sinais Vitais", parecer: String(rawEquipe.enfermagem) });
  }
  if (rawEquipe.fonoaudiologia !== undefined && rawEquipe.fonoaudiologia !== null) {
    list.push({ id: "fono", nome: "Fonoaudiólogo(a)", avatar: "🗣️", especialidade: "Deglutição e Mastigação", parecer: String(rawEquipe.fonoaudiologia) });
  }
  if (rawEquipe.psicologiaSocial !== undefined && rawEquipe.psicologiaSocial !== null) {
    list.push({ id: "psicologia", nome: "Psicólogo(a) / Apoio Social", avatar: "🤝", especialidade: "Aspectos Psicossociais", parecer: String(rawEquipe.psicologiaSocial) });
  }

  // Outras chaves personalizadas
  for (const [k, v] of Object.entries(rawEquipe)) {
    if (!["medico", "enfermagem", "fonoaudiologia", "psicologiaSocial"].includes(k) && typeof v === "string") {
      list.push({ id: k, nome: k, avatar: "🩺", especialidade: "Equipe de Saúde", parecer: v });
    }
  }

  return list;
}

// Base de Dados Oficial TACO (Tabela Brasileira de Composição de Alimentos - UNICAMP, 4ª edição)
// Carregada a partir do módulo isolado js/tacoData.js
const TACO_FOODS_DATABASE = (typeof TACO_DATABASE !== "undefined")
  ? TACO_DATABASE
  : (typeof window !== "undefined" && window.TACO_DATABASE ? window.TACO_DATABASE : []);

// Disponibiliza no escopo global
if (typeof window !== "undefined") {
  window.PROFESSIONAL_PRESETS = PROFESSIONAL_PRESETS;
  window.normalizeEquipeMultiprofissional = normalizeEquipeMultiprofissional;
  window.TACO_FOODS_DATABASE = TACO_FOODS_DATABASE;
}

