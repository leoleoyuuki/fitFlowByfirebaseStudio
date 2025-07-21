
import type { NavItem, Workout, Exercise, SubscriptionPlan, ProgressLog } from '@/types';
import { Dumbbell, Zap, Heart, Target, Brain, User, Settings, LayoutDashboard, BookOpen, Activity, Gift, Flame, Pizza, Utensils, FileText, Users, Crown, Star } from 'lucide-react';

export const APP_NAME = "FitFlow Pro"; // Nome alterado para B2B

export const mainNavItems: NavItem[] = [
  { title: "Para Academias", href: "/#features" },
  { title: "Assinatura", href: "/subscribe" },
];

export const dashboardNavItems: NavItem[] = [
  { title: "Painel Principal", href: "/dashboard", icon: LayoutDashboard },
  { title: "Gerar Plano Cliente", href: "/dashboard/personalized-plan", icon: Brain },
  { title: "Planos Salvos", href: "/dashboard/my-ai-plan", icon: FileText }, // Renomeado e aponta para a lista
  { title: "Biblioteca de Exercícios", href: "/dashboard/exercises", icon: BookOpen },
  // { title: "Registrar Progresso Cliente", href: "/dashboard/progress", icon: Activity }, // Talvez reavaliar para B2B
  { title: "Assinatura Pro", href: "/subscribe", icon: Gift },
  { title: "Configurações da Conta", href: "/dashboard/settings", icon: Settings },
];

// MOCK_WORKOUTS e MOCK_EXERCISES permanecem, pois são a base que a IA usa e que o profissional pode editar.

export const MOCK_WORKOUTS: Workout[] = [
  { id: "1", name: "Base Hipertrofia Corpo Inteiro (Editável)", goal: "Hypertrophy", difficulty: "Intermediário", duration: "75 min", description: "Um treino de corpo inteiro baseado em ciência, otimizado para o crescimento muscular, servindo como base para personalização profissional.", icon: Dumbbell, exercises: ["1", "5", "2", "10", "11", "8"] },
  { id: "2", name: "Base Força e Pump Superior (Editável)", goal: "Hypertrophy", difficulty: "Intermediário", duration: "60 min", description: "Foco na construção de força e tamanho no peito, costas, ombros e braços, como ponto de partida para o profissional.", icon: Dumbbell, exercises: ["2", "10", "12", "13", "14"] },
];

export const MOCK_EXERCISES: Exercise[] = [
  { id: "1", name: "Agachamento Livre com Barra", description: "O rei dos exercícios para pernas, construindo massa e força geral na parte inferior do corpo. Essencial para o desenvolvimento de quadríceps, glúteos e isquiotibiais.", instructions: "1. Posicione a barra na parte superior das costas. Pés na largura dos ombros, dedos levemente para fora. 2. Contraia o core, desça flexionando os quadris e joelhos até as coxas ficarem paralelas ao chão ou abaixo. 3. Empurre através dos calcanhares para retornar ao início, contraindo os glúteos no topo.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "barbell squat fitness", muscleGroups: ["Quadríceps", "Glúteos", "Isquiotibiais", "Adutores", "Core"] },
  { id: "2", name: "Supino Reto com Barra", description: "Um exercício fundamental para a parte superior do corpo, visando peito, ombros e tríceps.", instructions: "1. Deite-se no banco, pés firmes no chão. Segure a barra um pouco mais afastada que a largura dos ombros. 2. Abaixe a barra até o meio do peito, cotovelos levemente dobrados a ~45 graus. 3. Empurre a barra para cima até os braços estarem totalmente estendidos. Controle a descida.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "bench press fitness", muscleGroups: ["Peitorais", "Deltoides (Anterior)", "Tríceps"] },
  { id: "3", name: "Levantamento Terra Romeno (RDL)", description: "Excelente para o desenvolvimento de isquiotibiais e glúteos, fortalecendo também a região lombar.", instructions: "1. Segure a barra ou halteres na frente das coxas, pés na largura do quadril. 2. Mantendo as pernas predominantemente retas (leve flexão nos joelhos), flexione os quadris, baixando o peso em direção ao chão. Mantenha as costas retas. 3. Sinta o alongamento nos isquiotibiais. Retorne ao início contraindo os glúteos.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "romanian deadlift fitness", muscleGroups: ["Isquiotibiais", "Glúteos", "Eretores da Espinha"] },
  { id: "4", name: "Prancha Abdominal", description: "Um exercício isométrico de força do core, crucial para estabilidade e prevenção de lesões.", instructions: "1. Mantenha uma posição de flexão, antebraços no chão ou mãos diretamente sob os ombros. 2. Mantenha o corpo em linha reta da cabeça aos calcanhares. 3. Envolva o core e os glúteos. Segure por tempo.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "exercise plank core", muscleGroups: ["Reto Abdominal", "Transverso Abdominal", "Oblíquos"] },
  { id: "5", name: "Levantamento Terra Convencional", description: "Um exercício composto de corpo inteiro que constrói imensa força e músculo, particularmente na cadeia posterior.", instructions: "1. Fique com os pés na largura do quadril, barra sobre o meio do pé. 2. Flexione os quadris e dobre os joelhos, mantendo as costas retas. Segure a barra por fora dos joelhos. 3. Empurre através dos pés, estenda os quadris e joelhos simultaneamente, puxando a barra para cima. Mantenha a barra próxima ao corpo. 4. Abaixe a barra com controle.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "weightlifting deadlift fitness", muscleGroups: ["Isquiotibiais", "Glúteos", "Eretores da Espinha", "Quadríceps", "Trapézios", "Dorsais"] },
  { id: "6", name: "Desenvolvimento com Barra (Militar)", description: "Constrói força e tamanho nos ombros, também trabalha tríceps e core.", instructions: "1. Fique com a barra no nível frontal dos ombros, pegada um pouco mais afastada que os ombros. 2. Contraia o core, empurre a barra acima da cabeça até os braços estarem totalmente estendidos. 3. Abaixe a barra com controle de volta aos ombros.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "overhead press fitness", muscleGroups: ["Deltoides", "Tríceps", "Trapézios", "Core"] },
  { id: "7", name: "Barra Fixa / Puxada Alta na Polia", description: "Exercícios chave para largura e espessura das costas, visando o latíssimo do dorso.", instructions: "Barra Fixa: 1. Segure a barra com pegada pronada, um pouco mais afastada que os ombros. 2. Pendure-se com os braços estendidos. 3. Puxe o peito em direção à barra. 4. Abaixe com controle. Puxada Alta: Use o equivalente na máquina.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "pullup latpulldown fitness", muscleGroups: ["Latíssimo do Dorso", "Bíceps", "Romboides", "Trapézios (Médio/Inferior)"] },
  { id: "8", name: "Elevação de Pernas Suspenso", description: "Exercício avançado de core visando abdominais inferiores e flexores do quadril.", instructions: "1. Pendure-se em uma barra fixa. 2. Mantendo as pernas retas (ou joelhos dobrados para versão mais fácil), eleve as pernas em direção ao peito. 3. Abaixe lentamente com controle.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "abs legraise core", muscleGroups: ["Reto Abdominal (Inferior)", "Flexores do Quadril", "Oblíquos"] },
  { id: "9", name: "Avanço com Deslocamento", description: "Variação dinâmica do avanço, ótima para hipertrofia das pernas e força unilateral.", instructions: "1. Dê um passo à frente com uma perna em um avanço. 2. Abaixe os quadris até ambos os joelhos estarem dobrados a 90 graus. 3. Em vez de empurrar para trás, empurre com o pé de trás para dar um passo à frente com a outra perna no próximo avanço.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "walking lunge fitness", muscleGroups: ["Quadríceps", "Glúteos", "Isquiotibiais"] },
  { id: "10", name: "Remada Curvada", description: "Constrói um dorso superior espesso, visando dorsais, romboides e trapézios. Pode ser feito com barra ou halteres.", instructions: "1. Segure a barra ou halteres, pés na largura dos ombros. Flexione os quadris a ~45 graus, costas retas. 2. Puxe o peso em direção ao peito inferior/abdômen superior, espremendo as omoplatas. 3. Abaixe com controle.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "bentover row fitness", muscleGroups: ["Latíssimo do Dorso", "Romboides", "Trapézios (Médio)", "Bíceps", "Eretores da Espinha"] },
  { id: "11", name: "Rosca Direta", description: "Exercício de isolamento para crescimento do bíceps. Pode ser feito com halteres ou barra.", instructions: "1. Em pé ou sentado, segurando halteres com as palmas para frente (ou barra). 2. Flexione os cotovelos, trazendo os pesos em direção aos ombros, mantendo os cotovelos estáveis. 3. Contraia os bíceps no topo. Abaixe com controle.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "bicep curl fitness", muscleGroups: ["Bíceps Braquial", "Braquial"] },
  { id: "12", name: "Supino Inclinado com Halteres", description: "Visa a porção superior dos músculos peitorais.", instructions: "1. Deite-se em um banco inclinado (30-45 graus). Segure halteres ao nível do peito, palmas para frente. 2. Empurre os halteres para cima até os braços estarem estendidos. 3. Abaixe lentamente com controle.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "incline press fitness", muscleGroups: ["Peitorais (Superior)", "Deltoides (Anterior)", "Tríceps"] },
  { id: "13", name: "Elevação Lateral com Halteres", description: "Isola os deltoides mediais (laterais) para largura dos ombros.", instructions: "1. Em pé, segurando halteres ao lado do corpo, palmas voltadas para o corpo. 2. Eleve os braços para os lados até ficarem paralelos ao chão, com uma leve flexão nos cotovelos. 3. Abaixe lentamente com controle.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "lateral raise fitness", muscleGroups: ["Deltoides (Medial)"] },
  { id: "14", name: "Tríceps na Polia Alta", description: "Exercício na polia para isolar e construir massa no tríceps. Pode ser feito com corda ou barra.", instructions: "1. Prenda uma corda ou barra na polia alta. Segure o acessório, cotovelos próximos ao corpo. 2. Estenda os braços para baixo até o bloqueio completo, contraindo o tríceps. 3. Permita que os braços retornem lentamente.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "triceps pushdown fitness", muscleGroups: ["Tríceps"] },
  { id: "15", name: "Mergulho nas Paralelas", description: "Exercício composto para peito, ombros e tríceps. Pode ser com peso corporal ou adicionado.", instructions: "1. Segure as barras paralelas, sustente o corpo com os braços estendidos. 2. Abaixe o corpo flexionando os cotovelos até os ombros ficarem abaixo dos cotovelos ou até um ponto confortável. 3. Empurre de volta para o início.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "dips fitness", muscleGroups: ["Peitorais (Inferior)", "Tríceps", "Deltoides (Anterior)"] },
  { id: "16", name: "Supino Fechado com Barra", description: "Variação do supino reto que enfatiza o desenvolvimento do tríceps.", instructions: "1. Deite-se no banco, segure a barra com pegada na largura dos ombros ou um pouco mais estreita. 2. Abaixe a barra até a parte inferior do peito, mantendo os cotovelos próximos ao corpo. 3. Empurre a barra para cima até os braços estarem totalmente estendidos.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "closegrip bench fitness", muscleGroups: ["Tríceps", "Peitorais", "Deltoides (Anterior)"] },
  { id: "17", name: "Leg Press 45º", description: "Máquina popular para desenvolver força e massa nas pernas, especialmente quadríceps e glúteos, com menos estresse na lombar em comparação com o agachamento.", instructions: "1. Sente-se na máquina com as costas e cabeça apoiadas. Coloque os pés na plataforma na largura dos ombros. 2. Destrave a segurança e abaixe o peso dobrando os joelhos até formarem um ângulo de 90 graus ou menos, se a mobilidade permitir. 3. Empurre a plataforma de volta à posição inicial, estendendo os joelhos, mas sem travá-los completamente.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "leg press machine", muscleGroups: ["Quadríceps", "Glúteos", "Isquiotibiais", "Adutores"] },
  { id: "18", name: "Cadeira Extensora", description: "Exercício de isolamento para o quadríceps, focado na parte frontal da coxa.", instructions: "1. Sente-se na máquina com as costas apoiadas e os joelhos alinhados com o eixo da máquina. Coloque os tornozelos sob o rolo almofadado. 2. Estenda as pernas para cima até ficarem retas, contraindo o quadríceps. 3. Abaixe o peso lentamente de volta à posição inicial.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "leg extension machine", muscleGroups: ["Quadríceps"] },
  { id: "19", name: "Mesa Flexora (Isquiotibiais Deitado)", description: "Exercício de isolamento para os isquiotibiais, focado na parte posterior da coxa.", instructions: "1. Deite-se de bruços na máquina, com os joelhos logo abaixo da borda do banco e os tornozelos sob o rolo almofadado. 2. Flexione os joelhos, puxando o rolo em direção aos glúteos, contraindo os isquiotibiais. 3. Abaixe o peso lentamente de volta à posição inicial.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "leg curl machine", muscleGroups: ["Isquiotibiais", "Panturrilhas (auxiliar)"] },
  { id: "20", name: "Elevação de Panturrilha em Pé", description: "Exercício para desenvolver os músculos da panturrilha (gastrocnêmio e sóleo). Pode ser feito em máquina específica ou com peso livre.", instructions: "1. Fique em pé com a parte anterior dos pés sobre uma plataforma elevada, calcanhares para fora. Se usar peso, segure halteres ou posicione a máquina. 2. Eleve os calcanhares o máximo possível, contraindo as panturrilhas. 3. Abaixe os calcanhares lentamente abaixo do nível da plataforma para um alongamento completo.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "calf raise fitness", muscleGroups: ["Gastrocnêmio", "Sóleo"] },
  { id: "21", name: "Supino Máquina (Vertical/Articulado)", description: "Alternativa ao supino com barra/halteres, oferecendo um movimento mais guiado e estável para o peitoral.", instructions: "1. Ajuste o assento para que as manoplas fiquem na altura do meio do peito. Sente-se com as costas firmes no apoio. 2. Segure as manoplas e empurre para frente até os braços estarem quase totalmente estendidos. 3. Retorne lentamente à posição inicial, controlando o movimento.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "chest press machine", muscleGroups: ["Peitorais", "Deltoides (Anterior)", "Tríceps"] },
  { id: "22", name: "Crucifixo Máquina (Peck Deck)", description: "Exercício de isolamento para o peitoral, focando na adução dos braços.", instructions: "1. Sente-se na máquina com as costas apoiadas. Ajuste os braços da máquina ou as almofadas para que fiquem alinhados com o peito. 2. Segure as manoplas ou posicione os antebraços nas almofadas. 3. Junte os braços à frente do corpo, contraindo o peitoral. 4. Retorne lentamente à posição inicial, sentindo o alongamento no peito.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "pec deck machine", muscleGroups: ["Peitorais"] },
  { id: "23", name: "Desenvolvimento Máquina (Ombros)", description: "Alternativa ao desenvolvimento com barra/halteres, oferecendo um movimento guiado para os deltoides.", instructions: "1. Ajuste o assento para que as manoplas fiquem na altura dos ombros. Sente-se com as costas firmes. 2. Segure as manoplas e empurre para cima até os braços estarem quase totalmente estendidos. 3. Retorne lentamente à posição inicial.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "shoulder press machine", muscleGroups: ["Deltoides", "Tríceps"] },
  { id: "24", name: "Puxada Alta na Polia (Pegada Pronada)", description: "Excelente para desenvolver a largura das costas, focando no latíssimo do dorso.", instructions: "1. Sente-se na máquina, ajuste o apoio dos joelhos. Segure a barra com pegada pronada (palmas para baixo), mais afastada que a largura dos ombros. 2. Puxe a barra em direção à parte superior do peito, inclinando o tronco levemente para trás e espremendo as omoplatas. 3. Retorne lentamente a barra à posição inicial, controlando o movimento.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "lat pulldown fitness", muscleGroups: ["Latíssimo do Dorso", "Bíceps", "Romboides", "Trapézios (Médio/Inferior)"] },
  { id: "25", name: "Remada Sentada na Polia (Triângulo)", description: "Constrói espessura no meio das costas, trabalhando romboides, trapézios e latíssimo do dorso.", instructions: "1. Sente-se na máquina com os pés apoiados e joelhos levemente flexionados. Segure o triângulo com pegada neutra. 2. Mantenha as costas retas e puxe o triângulo em direção ao abdômen, espremendo as omoplatas. 3. Retorne lentamente à posição inicial, controlando o movimento.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "seated cable row", muscleGroups: ["Romboides", "Trapézios (Médio)", "Latíssimo do Dorso", "Bíceps"] },
  { id: "26", name: "Crucifixo Invertido na Polia (ou Máquina)", description: "Focado nos deltoides posteriores e músculos da parte superior das costas (romboides, trapézio medial).", instructions: "1. Em pé entre duas polias altas (ou sentado na máquina de crucifixo invertido). Segure as manoplas das polias com os braços cruzados à frente (mão direita na polia esquerda, e vice-versa). 2. Mantenha uma leve flexão nos cotovelos e puxe as manoplas para fora e para trás, em um movimento de arco, até os braços estarem alinhados com os ombros ou ligeiramente atrás. Contraia os músculos das costas e ombros posteriores. 3. Retorne lentamente à posição inicial.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "reverse fly cable", muscleGroups: ["Deltoides (Posterior)", "Romboides", "Trapézios (Médio)"] },
  { id: "27", name: "Tríceps Corda na Polia Alta", description: "Variação popular do tríceps na polia, permitindo uma maior amplitude de movimento e pico de contração.", instructions: "1. Prenda uma corda na polia alta. Segure as extremidades da corda com pegada neutra (palmas se enfrentando). 2. Mantenha os cotovelos próximos ao corpo e estenda os braços para baixo, afastando as mãos ao final do movimento para maximizar a contração do tríceps. 3. Retorne lentamente à posição inicial.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "triceps rope pushdown", muscleGroups: ["Tríceps"] },
  { id: "28", name: "Rosca Scott (com Barra ou Halteres)", description: "Isola o bíceps, minimizando o uso de outros músculos, ideal para pico do bíceps.", instructions: "1. Sente-se no banco Scott, com a parte superior dos braços apoiada na almofada. Segure a barra W ou halteres com pegada supinada (palmas para cima). 2. Flexione os cotovelos, trazendo o peso em direção aos ombros. Mantenha os braços em contato com a almofada. 3. Abaixe o peso lentamente até os braços estarem quase totalmente estendidos.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "preacher curl fitness", muscleGroups: ["Bíceps Braquial", "Braquial"] },
  { id: "29", name: "Rosca Martelo com Halteres", description: "Trabalha o bíceps braquial, braquial e braquiorradial, ajudando a construir espessura nos braços.", instructions: "1. Em pé, segure halteres com pegada neutra (palmas voltadas uma para a outra). 2. Mantendo os cotovelos próximos ao corpo, flexione um braço de cada vez (ou ambos simultaneamente), trazendo o haltere em direção ao ombro. 3. Abaixe lentamente à posição inicial.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "hammer curl fitness", muscleGroups: ["Bíceps Braquial", "Braquial", "Braquiorradial"] },
  { id: "30", name: "Afundo (Bulgarian Split Squat)", description: "Exercício unilateral desafiador para quadríceps, glúteos e isquiotibiais, também melhora o equilíbrio.", instructions: "1. Fique de costas para um banco. Coloque o peito de um pé sobre o banco. O pé da frente deve estar a uma distância que permita que o joelho forme 90 graus na descida. 2. Agache com a perna da frente, mantendo o torso ereto, até a coxa da frente ficar paralela ao chão ou o joelho de trás quase tocar o chão. 3. Empurre com o calcanhar da perna da frente para retornar à posição inicial.", videoUrl: "https://placehold.co/600x400.png", dataAiHint: "bulgarian split squat", muscleGroups: ["Quadríceps", "Glúteos", "Isquiotibiais", "Adutores"] }
];

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { 
    id: "light",
    name: "Plano Light", 
    price: "R$149/mês",
    description: "Para academias até 200 alunos.",
    features: [
      "Geração de planos ilimitada",
      "Ferramentas de edição e personalização",
      "Biblioteca completa de exercícios",
      "Suporte via e-mail"
    ], 
    stripePriceId: "price_LIGHT_PLAN_ID_REPLACE_ME", // Substitua pelo seu Price ID real
    icon: Flame,
  },
  { 
    id: "pro",
    name: "Plano Pro", 
    price: "R$249/mês",
    description: "Até 500 alunos.",
    features: [
      "Todos os benefícios do plano Light",
      "Gestão de múltiplos profissionais (em breve)",
      "Relatórios de engajamento (em breve)",
      "Suporte prioritário"
    ], 
    stripePriceId: "price_PRO_PLAN_ID_REPLACE_ME", // Substitua pelo seu Price ID real
    icon: Star,
    isPopular: true,
  },
  { 
    id: "elite",
    name: "Plano Elite", 
    price: "R$399/mês",
    description: "Acima de 500 alunos.",
    features: [
      "Todos os benefícios do plano Pro",
      "API de integração (em breve)",
      "Gerente de conta dedicado (em breve)",
      "Suporte via WhatsApp"
    ], 
    stripePriceId: "price_ELITE_PLAN_ID_REPLACE_ME", // Substitua pelo seu Price ID real
    icon: Crown,
  },
];


export const MOCK_PROGRESS_LOGS: ProgressLog[] = [
  { id: "log1", date: new Date(2024, 6, 20).toISOString(), exerciseId: "1", exerciseName: "Agachamento Livre com Barra", sets: 4, reps: 8, weight: 100, userId: "mockUser" },
  { id: "log2", date: new Date(2024, 6, 20).toISOString(), exerciseId: "2", exerciseName: "Supino Reto com Barra", sets: 3, reps: 10, weight: 80, userId: "mockUser" },
  { id: "log3", date: new Date(2024, 6, 22).toISOString(), exerciseId: "1", exerciseName: "Agachamento Livre com Barra", sets: 4, reps: 8, weight: 102.5, userId: "mockUser" },
  { id: "log5", date: new Date(2024, 6, 24).toISOString(), exerciseId: "10", exerciseName: "Remada Curvada", sets: 3, reps: 12, weight: 60, userId: "mockUser" },
];
