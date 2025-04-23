// Seletores dos elementos principais
const containerCartas = document.getElementById('cards');
const contadorMovimentos = document.getElementById('moves-count');
const valorTempo = document.getElementById('time');
const botaoIniciar = document.getElementById('start');
const botaoParar = document.getElementById('stop');
const seletorDificuldade = document.getElementById('difficulty');
const modalResultado = document.getElementById('result-modal');
const tempoResultado = document.getElementById('result-time');
const movimentosResultado = document.getElementById('result-moves');
const botaoJogarNovamente = document.getElementById('play-again');
const botaoModoHumano = document.getElementById('human-mode');
const botaoModoIA = document.getElementById('ai-mode');

// Seletores para estatísticas
const humanBestTime = document.getElementById('human-best-time');
const humanBestMoves = document.getElementById('human-best-moves');
const aiBestTime = document.getElementById('ai-best-time');
const aiBestMoves = document.getElementById('ai-best-moves');
const compareHumanTime = document.getElementById('compare-human-time');
const compareHumanMoves = document.getElementById('compare-human-moves');
const compareAiTime = document.getElementById('compare-ai-time');
const compareAiMoves = document.getElementById('compare-ai-moves');
const winnerText = document.getElementById('winner-text');

// Variáveis do jogo
let cartas;
let intervalo;
let primeiraCarta = false;
let segundaCarta = false;
let movimentos = 0;
let segundos = 0;
let minutos = 0;
let valorPrimeiraCarta;
let valorSegundaCarta;
let paresEncontrados = 0;
let totalPares = 0;
let jogoIniciado = false;
let modoAtual = 'humano'; // 'humano' ou 'ia'
let iaJogando = false;
let tempoEsperaIA;
let emEsperaParaDesvirar = false;
let jogoEmAndamento = false;

// Variáveis de estatísticas
let melhoresTempos = {
    humano: { tempo: null, movimentos: null },
    ia: { tempo: null, movimentos: null }
};

// Variáveis para o mapa do tabuleiro
let mapaTabuleiro = []; // Array que mapeia todas as cartas

// Configurações de grade para diferentes níveis de dificuldade
const configuracaoGrade = {
    easy: {
        rows: 3,
        cols: 4,
        pairs: 6
    },
    medium: {
        rows: 4,
        cols: 4,
        pairs: 8
    },
    hard: {
        rows: 4,
        cols: 5,
        pairs: 10
    }
};

// Emoji para os cards
const itens = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄'
];

// Funções do Temporizador
const gerarTempo = () => {
    segundos += 1;
    if (segundos >= 60) {
        minutos += 1;
        segundos = 0;
    }

    // Formatando o tempo
    let valorSegundos = segundos < 10 ? `0${segundos}` : segundos;
    let valorMinutos = minutos < 10 ? `0${minutos}` : minutos;
    valorTempo.innerHTML = `${valorMinutos}:${valorSegundos}`;
};

// Calcular movimentos
const contarMovimentos = () => {
    movimentos++;
    contadorMovimentos.innerHTML = movimentos;
};

// Função para embaralhar os itens
const obterItensAleatorios = (pares) => {
    // Duplicar cada item para formar pares
    const arrayPares = [];
    for (let i = 0; i < pares; i++) {
        arrayPares.push(itens[i]);
        arrayPares.push(itens[i]);
    }
    
    // Embaralhar array
    return arrayPares.sort(() => Math.random() - 0.5);
};

// Gerador das cartas
const gerarCartas = (config) => {
    // Limpar o container
    containerCartas.innerHTML = "";
    
    // Recuperar configuração
    const {rows, cols, pairs} = configuracaoGrade[config];
    totalPares = pairs;
    
    // Definir o layout do grid
    containerCartas.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    containerCartas.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    
    // Obter itens aleatórios
    const itensAleatorios = obterItensAleatorios(pairs);
    
    // Limpar mapa de tabuleiro para a IA Expert
    mapaTabuleiro = [];
    
    // Gerar cartões
    for (let i = 0; i < rows * cols; i++) {
        if (i < itensAleatorios.length) {
            containerCartas.innerHTML += `
            <div class="card" data-card-index="${i}" data-item-value="${itensAleatorios[i]}">
                <div class="card-face card-front"></div>
                <div class="card-face card-back">${itensAleatorios[i]}</div>
            </div>
            `;
            
            // Adicionar ao mapa de tabuleiro para a IA Expert
            mapaTabuleiro.push({
                index: i,
                valor: itensAleatorios[i],
                virada: false,
                pareada: false,
                conhecida: false
            });
        }
    }
    
    // Adicionar event listeners
    cartas = document.querySelectorAll(".card");
    cartas.forEach((carta, index) => {
        carta.addEventListener("click", () => {
            // Permitir cliques somente no modo humano e quando o jogo estiver iniciado
            if (!jogoIniciado || emEsperaParaDesvirar || modoAtual === 'ia') return;
            
            if (!carta.classList.contains("flipped") && !carta.classList.contains("matched")) {
                // Virar a carta
                carta.classList.add("flipped");
                
                // Atualizar o mapa do tabuleiro para IA Expert
                const cardIndex = parseInt(carta.getAttribute('data-card-index'));
                if (mapaTabuleiro[cardIndex]) {
                    mapaTabuleiro[cardIndex].virada = true;
                    mapaTabuleiro[cardIndex].conhecida = true;
                }
                
                // Lógica para verificar pares
                if (!primeiraCarta) {
                    // Primeira carta
                    primeiraCarta = carta;
                    valorPrimeiraCarta = carta.getAttribute("data-item-value");
                } else {
                    // Segunda carta
                    contarMovimentos();
                    segundaCarta = carta;
                    valorSegundaCarta = carta.getAttribute("data-item-value");
                    
                    // Verificar se é um par
                    if (valorPrimeiraCarta === valorSegundaCarta) {
                        // Par encontrado
                        primeiraCarta.classList.add("matched");
                        segundaCarta.classList.add("matched");
                        
                        // Atualizar o mapa do tabuleiro para IA Expert
                        const card1Index = parseInt(primeiraCarta.getAttribute('data-card-index'));
                        const card2Index = parseInt(segundaCarta.getAttribute('data-card-index'));
                        if (mapaTabuleiro[card1Index] && mapaTabuleiro[card2Index]) {
                            mapaTabuleiro[card1Index].pareada = true;
                            mapaTabuleiro[card2Index].pareada = true;
                        }
                        
                        // Resetar seleção
                        primeiraCarta = false;
                        segundaCarta = false;
                        
                        // Incrementar pares encontrados
                        paresEncontrados++;
                        
                        // Verificar se o jogo acabou
                        if (paresEncontrados === totalPares) {
                            setTimeout(() => {
                                mostrarResultado();
                            }, 1000);
                        }
                    } else {
                        // Não é um par
                        emEsperaParaDesvirar = true;
                        
                        // Virar de volta após um tempo
                        let tempPrimeira = primeiraCarta;
                        let tempSegunda = segundaCarta;
                        primeiraCarta = false;
                        segundaCarta = false;
                        
                        setTimeout(() => {
                            if (tempPrimeira) {
                                tempPrimeira.classList.remove("flipped");
                                const card1Index = parseInt(tempPrimeira.getAttribute('data-card-index'));
                                if (mapaTabuleiro[card1Index]) {
                                    mapaTabuleiro[card1Index].virada = false;
                                }
                            }
                            
                            if (tempSegunda) {
                                tempSegunda.classList.remove("flipped");
                                const card2Index = parseInt(tempSegunda.getAttribute('data-card-index'));
                                if (mapaTabuleiro[card2Index]) {
                                    mapaTabuleiro[card2Index].virada = false;
                                }
                            }
                            
                            emEsperaParaDesvirar = false;
                        }, 900);
                    }
                }
            }
        });
    });
};

// Função para mostrar feedback do modo atual
const mostrarFeedbackModo = (modo) => {
    // Remover feedback existente
    removerFeedbackModo();
    
    // Criar novo elemento de feedback
    const feedback = document.createElement('div');
    feedback.className = 'game-feedback ' + (modo === 'humano' ? 'human-playing' : 'ai-playing');
    feedback.textContent = modo === 'humano' ? 'Jogador Humano Jogando' : 'IA Expert Jogando';
    
    // Adicionar à página
    document.querySelector('.game-container').before(feedback);
    
    // Atualizar classes dos botões
    botaoModoHumano.classList.toggle('mode-active', modo === 'humano');
    botaoModoIA.classList.toggle('mode-active', modo === 'ia');
};

// Função para remover feedback do modo
const removerFeedbackModo = () => {
    const feedback = document.querySelector('.game-feedback');
    if (feedback) {
        feedback.remove();
    }
};

// Função para formatar tempo em string
const formatarTempo = (mins, segs) => {
    return `${mins < 10 ? '0' + mins : mins}:${segs < 10 ? '0' + segs : segs}`;
};

// Função para calcular tempo total em segundos
const tempoTotalEmSegundos = (mins, segs) => {
    return mins * 60 + segs;
};

// Função para verificar e atualizar os melhores tempos
const atualizarMelhoresTempo = (modo) => {
    const tempoAtual = tempoTotalEmSegundos(minutos, segundos);
    const melhorTempoAtual = melhoresTempos[modo].tempo;
    
    // Se não há melhor tempo definido ou o tempo atual é melhor
    if (melhorTempoAtual === null || tempoAtual < melhorTempoAtual) {
        melhoresTempos[modo] = {
            tempo: tempoAtual,
            movimentos: movimentos
        };
        
        // Atualizar a exibição
        if (modo === 'humano') {
            humanBestTime.textContent = formatarTempo(minutos, segundos);
            humanBestMoves.textContent = movimentos;
        } else {
            aiBestTime.textContent = formatarTempo(minutos, segundos);
            aiBestMoves.textContent = movimentos;
        }
    }
};
// Simulação de clique para a IA - versão corrigida
const simularClickCarta = (carta) => {
    if (!carta || !jogoIniciado) return;
    
    // Lógica para verificar pares
    if (!carta.classList.contains("flipped") && !carta.classList.contains("matched")) {
        // Virar a carta
        carta.classList.add("flipped");
        
        // Atualizar o mapa do tabuleiro para IA Expert
        const cardIndex = parseInt(carta.getAttribute('data-card-index'));
        if (mapaTabuleiro[cardIndex]) {
            mapaTabuleiro[cardIndex].virada = true;
            mapaTabuleiro[cardIndex].conhecida = true;
        }
        
        // Lógica para verificar pares
        if (!primeiraCarta) {
            // Primeira carta
            primeiraCarta = carta;
            valorPrimeiraCarta = carta.getAttribute("data-item-value");
        } else {
            // Segunda carta
            contarMovimentos();
            segundaCarta = carta;
            valorSegundaCarta = carta.getAttribute("data-item-value");
            
            // Verificar se é um par
            if (valorPrimeiraCarta === valorSegundaCarta) {
                // Par encontrado
                primeiraCarta.classList.add("matched");
                segundaCarta.classList.add("matched");
                
                // Atualizar o mapa do tabuleiro para IA Expert
                const card1Index = parseInt(primeiraCarta.getAttribute('data-card-index'));
                const card2Index = parseInt(segundaCarta.getAttribute('data-card-index'));
                if (mapaTabuleiro[card1Index] && mapaTabuleiro[card2Index]) {
                    mapaTabuleiro[card1Index].pareada = true;
                    mapaTabuleiro[card2Index].pareada = true;
                }
                
                // Resetar seleção
                primeiraCarta = false;
                segundaCarta = false;
                
                // Incrementar pares encontrados
                paresEncontrados++;
                
                // Verificar se o jogo acabou
                if (paresEncontrados === totalPares) {
                    setTimeout(() => {
                        mostrarResultado();
                    }, 1000);
                    return;
                }
                
                // Continuar a IA jogando
                if (modoAtual === 'ia' && iaJogando) {
                    jogoEmAndamento = false; // CORREÇÃO: Reset do status de jogada em andamento
                    setTimeout(continuarJogadaIA, 300);
                }
            } else {
                // Não é um par
                emEsperaParaDesvirar = true;
                
                // Virar de volta após um tempo
                let tempPrimeira = primeiraCarta;
                let tempSegunda = segundaCarta;
                primeiraCarta = false;
                segundaCarta = false;
                
                setTimeout(() => {
                    if (tempPrimeira) {
                        tempPrimeira.classList.remove("flipped");
                        const card1Index = parseInt(tempPrimeira.getAttribute('data-card-index'));
                        if (mapaTabuleiro[card1Index]) {
                            mapaTabuleiro[card1Index].virada = false;
                        }
                    }
                    
                    if (tempSegunda) {
                        tempSegunda.classList.remove("flipped");
                        const card2Index = parseInt(tempSegunda.getAttribute('data-card-index'));
                        if (mapaTabuleiro[card2Index]) {
                            mapaTabuleiro[card2Index].virada = false;
                        }
                    }
                    
                    emEsperaParaDesvirar = false;
                    jogoEmAndamento = false; // CORREÇÃO: Reset do status de jogada em andamento
                    
                    // Continuar a IA jogando
                    if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                        setTimeout(continuarJogadaIA, 300);
                    }
                }, 900);
            }
        }
    }
};

// Função para iniciar a IA Expert
const iniciarIAExpert = () => {
    iaJogando = true;
    jogoEmAndamento = false; // CORREÇÃO: Garantir que começa sem jogada em andamento
    emEsperaParaDesvirar = false;
    
    // Mostrar feedback de jogo da IA
    mostrarFeedbackModo('ia');
    
    // Certificar que não temos nenhuma ação pendente
    clearTimeout(tempoEsperaIA);
    
    // Iniciar jogada da IA após um pequeno delay
    console.log("Iniciando IA Expert");
    tempoEsperaIA = setTimeout(continuarJogadaIA, 500);
};

// Função para parar a IA
const pararIA = () => {
    iaJogando = false;
    jogoEmAndamento = false;
    emEsperaParaDesvirar = false;
    clearTimeout(tempoEsperaIA);
    
    // Remover feedback de jogo
    removerFeedbackModo();
};

// Algoritmo para IA Expert - corrigido para múltiplas jogadas
const continuarJogadaIA = () => {
    // CORREÇÃO: Adicionado log para debug da chamada recursiva
    console.log("Tentando continuar jogada da IA", {
        iaJogando,
        jogoIniciado,
        paresEncontrados,
        totalPares,
        emEsperaParaDesvirar,
        jogoEmAndamento
    });
    
    // Verificar se a IA pode fazer uma jogada
    if (!iaJogando || !jogoIniciado || paresEncontrados === totalPares) {
        console.log("IA não pode jogar agora - condições básicas não atendidas");
        return;
    }
    
    // Verificar se está esperando cartas desvirarem ou se já tem uma jogada em andamento
    if (emEsperaParaDesvirar || jogoEmAndamento) {
        console.log("IA precisa esperar - já tem operação em andamento");
        return;
    }
    
    console.log("IA fazendo jogada");
    jogoEmAndamento = true; // CORREÇÃO: Marcando explicitamente que uma jogada está começando
    
    // Verificar se já temos pares conhecidos para jogar
    const paresConhecidos = encontrarParesConhecidosNoMapa();
    console.log("Pares conhecidos:", paresConhecidos.length);
    
    if (paresConhecidos.length > 0) {
        // Jogar o primeiro par conhecido
        const [carta1, carta2] = paresConhecidos[0];
        
        // Virar a primeira carta
        setTimeout(() => {
            const elementoCarta1 = document.querySelector(`[data-card-index="${carta1.index}"]`);
            if (elementoCarta1 && !elementoCarta1.classList.contains("flipped") && !elementoCarta1.classList.contains("matched")) {
                simularClickCarta(elementoCarta1);
                
                // Virar a segunda carta depois de um curto intervalo
                setTimeout(() => {
                    const elementoCarta2 = document.querySelector(`[data-card-index="${carta2.index}"]`);
                    if (elementoCarta2 && !elementoCarta2.classList.contains("flipped") && !elementoCarta2.classList.contains("matched")) {
                        simularClickCarta(elementoCarta2);
                    } else {
                        jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
                        if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                            setTimeout(continuarJogadaIA, 100);
                        }
                    }
                }, 300);
            } else {
                jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
                if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                    setTimeout(continuarJogadaIA, 100);
                }
            }
        }, 300);
    } else {
        // Se não temos pares conhecidos, explorar o tabuleiro
        const cartasDesconhecidas = mapaTabuleiro.filter(carta => !carta.pareada && !carta.conhecida);
        console.log("Cartas desconhecidas:", cartasDesconhecidas.length);
        
        if (cartasDesconhecidas.length > 0) {
            // Virar uma carta desconhecida
            const carta1 = cartasDesconhecidas[0];
            
            setTimeout(() => {
                const elementoCarta1 = document.querySelector(`[data-card-index="${carta1.index}"]`);
                if (elementoCarta1 && !elementoCarta1.classList.contains("flipped") && !elementoCarta1.classList.contains("matched")) {
                    simularClickCarta(elementoCarta1);
                    
                    // Escolher a próxima carta desconhecida
                    const cartasRestantes = mapaTabuleiro.filter(carta => 
                        !carta.pareada && 
                        !carta.virada && 
                        carta.index !== carta1.index
                    );
                    
                    if (cartasRestantes.length > 0) {
                        const carta2 = cartasRestantes[0];
                        
                        setTimeout(() => {
                            const elementoCarta2 = document.querySelector(`[data-card-index="${carta2.index}"]`);
                            if (elementoCarta2 && !elementoCarta2.classList.contains("flipped") && !elementoCarta2.classList.contains("matched")) {
                                simularClickCarta(elementoCarta2);
                            } else {
                                jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
                                if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                                    setTimeout(continuarJogadaIA, 100);
                                }
                            }
                        }, 300);
                    } else {
                        jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
                        if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                            setTimeout(continuarJogadaIA, 100);
                        }
                    }
                } else {
                    jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
                    if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                        setTimeout(continuarJogadaIA, 100);
                    }
                }
            }, 300);
        } else {
            // Se todas as cartas já foram vistas, usar a memória para formar pares
            const cartasVistas = mapaTabuleiro.filter(carta => !carta.pareada);
            console.log("Cartas vistas não pareadas:", cartasVistas.length);
            
            if (cartasVistas.length >= 2) {
                // Simplesmente pegar as duas primeiras cartas não pareadas
                const carta1 = cartasVistas[0];
                const carta2 = cartasVistas[1];
                
                setTimeout(() => {
                    const elementoCarta1 = document.querySelector(`[data-card-index="${carta1.index}"]`);
                    if (elementoCarta1 && !elementoCarta1.classList.contains("flipped") && !elementoCarta1.classList.contains("matched")) {
                        simularClickCarta(elementoCarta1);
                        
                        setTimeout(() => {
                            const elementoCarta2 = document.querySelector(`[data-card-index="${carta2.index}"]`);
                            if (elementoCarta2 && !elementoCarta2.classList.contains("flipped") && !elementoCarta2.classList.contains("matched")) {
                                simularClickCarta(elementoCarta2);
                            } else {
                                jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
                                if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                                    setTimeout(continuarJogadaIA, 100);
                                }
                            }
                        }, 300);
                    } else {
                        jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
                        if (modoAtual === 'ia' && iaJogando && jogoIniciado) {
                            setTimeout(continuarJogadaIA, 100);
                        }
                    }
                }, 300);
            } else {
                // Jogo terminado ou nenhuma carta disponível
                console.log("Não há mais cartas para virar");
                jogoEmAndamento = false; // CORREÇÃO: Liberar para próxima jogada
            }
        }
    }
};

// Função para encontrar pares conhecidos no mapa de tabuleiro
const encontrarParesConhecidosNoMapa = () => {
    const pares = [];
    const valores = {};
    
    // Primeiro criar um mapa de valores
    mapaTabuleiro.forEach(carta => {
        if (!carta.pareada && carta.conhecida) {
            if (!valores[carta.valor]) {
                valores[carta.valor] = [carta];
            } else {
                valores[carta.valor].push(carta);
            }
        }
    });
    
    // Encontrar pares no mapa de valores
    Object.values(valores).forEach(cartas => {
        if (cartas.length >= 2) {
            // Formar pares não virados
            const cartasNaoViradas = cartas.filter(carta => !carta.virada);
            
            if (cartasNaoViradas.length >= 2) {
                pares.push([cartasNaoViradas[0], cartasNaoViradas[1]]);
            }
        }
    });
    
    return pares;
};

// Iniciar jogo
const iniciarJogo = () => {
    // Resetar valores
    movimentos = 0;
    segundos = 0;
    minutos = 0;
    paresEncontrados = 0;
    jogoEmAndamento = false;
    emEsperaParaDesvirar = false;
    primeiraCarta = false;
    segundaCarta = false;
    
    // Limpar variáveis da IA Expert
    mapaTabuleiro = [];
    
    // Parar IA se estiver jogando
    pararIA();
    
    // Atualizar UI
    contadorMovimentos.innerHTML = movimentos;
    valorTempo.innerHTML = "00:00";
    
    // Esconder modal se estiver visível
    modalResultado.style.display = "none";
    
    // Iniciar timer
    clearInterval(intervalo);
    intervalo = setInterval(gerarTempo, 1000);
    
    // Gerar cartões
    const dificuldade = seletorDificuldade.value;
    gerarCartas(dificuldade);
    
    // Ativar o jogo
    jogoIniciado = true;
    
    // Mostrar feedback para o modo atual
    mostrarFeedbackModo(modoAtual);
    
    // Se estiver no modo IA, iniciar a IA
    if (modoAtual === 'ia') {
        iniciarIAExpert();
    }
    
    // Atualizar botões
    botaoIniciar.style.display = "none";
    botaoParar.style.display = "block";
    seletorDificuldade.disabled = true;
};

// Parar jogo
const pararJogo = () => {
    // Parar timer
    clearInterval(intervalo);
    
    // Parar IA
    pararIA();
    
    // Desativar o jogo
    jogoIniciado = false;
    
    // Remover feedback de modo
    removerFeedbackModo();
    
    // Atualizar botões
    botaoIniciar.style.display = "block";
    botaoParar.style.display = "none";
    seletorDificuldade.disabled = false;
};

// Mostrar resultado
const mostrarResultado = () => {
    // Parar timer
    clearInterval(intervalo);
    
    // Desativar o jogo
    jogoIniciado = false;
    jogoEmAndamento = false;
    
    // Atualizar estatísticas no modal
    tempoResultado.innerHTML = valorTempo.innerHTML;
    movimentosResultado.innerHTML = movimentos;
    
    // Atualizar melhores tempos
    atualizarMelhoresTempo(modoAtual);
    
    // Atualizar a comparação
    compareHumanTime.textContent = melhoresTempos.humano.tempo === null ? "--:--" : formatarTempo(
        Math.floor(melhoresTempos.humano.tempo / 60),
        melhoresTempos.humano.tempo % 60
    );
    compareHumanMoves.textContent = melhoresTempos.humano.movimentos === null ? "--" : melhoresTempos.humano.movimentos;
    
    compareAiTime.textContent = melhoresTempos.ia.tempo === null ? "--:--" : formatarTempo(
        Math.floor(melhoresTempos.ia.tempo / 60),
        melhoresTempos.ia.tempo % 60
    );
    compareAiMoves.textContent = melhoresTempos.ia.movimentos === null ? "--" : melhoresTempos.ia.movimentos;
    
    // Atualizar texto do vencedor
    if (melhoresTempos.humano.tempo !== null && melhoresTempos.ia.tempo !== null) {
        if (melhoresTempos.humano.tempo < melhoresTempos.ia.tempo) {
            winnerText.textContent = "O Jogador Humano é mais rápido!";
        } else if (melhoresTempos.humano.tempo > melhoresTempos.ia.tempo) {
            winnerText.textContent = "A IA Expert é mais rápida!";
        } else {
            winnerText.textContent = "Empate! Mesma velocidade!";
        }
    } else {
        winnerText.textContent = "Jogue ambos os modos para ver quem é o melhor!";
    }
    
    // Exibir modal
    modalResultado.style.display = "flex";
    
    // Atualizar botões
    botaoIniciar.style.display = "block";
    botaoParar.style.display = "none";
    seletorDificuldade.disabled = false;
};

// Adicionar event listeners
botaoIniciar.addEventListener('click', iniciarJogo);
botaoParar.addEventListener('click', pararJogo);
botaoJogarNovamente.addEventListener('click', iniciarJogo);

// Botões de modo
botaoModoHumano.addEventListener('click', () => {
    // Se já estiver neste modo, não faz nada
    if (modoAtual === 'humano') return;
    
    // Mudar para modo humano
    modoAtual = 'humano';
    
    // Se o jogo estiver iniciado
    if (jogoIniciado) {
        // Parar a IA se estiver jogando
        pararIA();
        
        // Reiniciar o jogo
        pararJogo();
        iniciarJogo();
    } else {
        // Atualizar botões de modo
        botaoModoHumano.classList.add('mode-active');
        botaoModoIA.classList.remove('mode-active');
    }
});

botaoModoIA.addEventListener('click', () => {
    // Se já estiver neste modo, não faz nada
    if (modoAtual === 'ia') return;
    
    // Mudar para modo IA
    modoAtual = 'ia';
    
    // Se o jogo estiver iniciado
    if (jogoIniciado) {
        // Reiniciar o jogo
        pararJogo();
        iniciarJogo();
    } else {
        // Atualizar botões de modo
        botaoModoHumano.classList.remove('mode-active');
        botaoModoIA.classList.add('mode-active');
    }
});

// Inicialização
botaoParar.style.display = "none";
botaoModoHumano.classList.add('mode-active');
gerarCartas(seletorDificuldade.value);