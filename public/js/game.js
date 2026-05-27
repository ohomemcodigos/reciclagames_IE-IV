// 1. ESTADO GLOBAL DO JOGO
let gameState = {
    points: 0,
    knowledgePerSecond: 0,
    totalUpgradesBought: 0,
    currentTier: 1,
    totalClicks: 0,
    unlockedAchievements: [],
    upgrades: [
        {
            id: 'led',
            name: '1. Lâmpada LED',
            desc: 'Troca a lâmpada antiga por LED.',
            cps: 1,
            baseCost: 50,
            cost: 50,
            quantity: 0,
            icon: '💡'
        },
        {
            id: 'solar',
            name: '2. Painel Solar',
            desc: 'Instala painéis solares no telhado.',
            cps: 5,
            baseCost: 250,
            cost: 250,
            quantity: 0,
            icon: '<img src="assets/images/Solar.png" alt="Painel Solar" style="width: 100%; height: auto; object-fit: contain;">'
        },
        {
            id: 'grid',
            name: '3. Smart Grid',
            desc: 'Cria uma micro-rede inteligente.',
            cps: 20,
            baseCost: 1000,
            cost: 1000,
            quantity: 0,
            icon: '🌐'
        }
    ]
};

// CONQUISTAS
const ACHIEVEMENTS = [
    {
        id: 'first_click',
        name: 'Primeiro Passo!',
        desc: 'Clicou na lâmpada pela primeira vez.',
        icon: '🚶‍♂️',
        condition: (state) => state.totalClicks >= 1
    },
    {
        id: 'pioneer',
        name: 'Pioneiro da energia limpa',
        desc: 'Comprou seu primeiro upgrade.',
        icon: '🏅',
        condition: (state) => state.totalUpgradesBought >= 1
    },
    {
        id: 'clicks_100',
        name: 'Clicador dedicado',
        desc: 'Realizou 100 cliques.',
        icon: '🖱️',
        condition: (state) => state.totalClicks >= 100
    },
    {
        id: 'knowledge_100',
        name: 'Estudante ambiental',
        desc: 'Acumulou 100 de Conhecimento.',
        icon: '🧠',
        condition: (state) => state.points >= 100
    },
    {
        id: 'led_5',
        name: 'Cidade iluminada!',
        desc: 'Comprou 5 Lâmpadas LED.',
        icon: '💡',
        condition: (state) => {
            const led = state.upgrades.find(u => u.id === 'led');
            return led && led.quantity >= 5;
        }
    },
    {
        id: 'solar_1',
        name: 'Energia solar',
        desc: 'Instalou seu primeiro painel solar.',
        icon: '☀️',
        condition: (state) => {
            const solar = state.upgrades.find(u => u.id === 'solar');
            return solar && solar.quantity >= 1;
        }
    },
    {
        id: 'cps_10',
        name: 'Conhecimento onstante',
        desc: 'Atingiu 10 de conhecimento por segundo.',
        icon: '⚡',
        condition: (state) => state.knowledgePerSecond >= 10
    },
    {
        id: 'grid_1',
        name: 'Rede Inteligente',
        desc: 'Criou sua primeira Smart Grid.',
        icon: '🌐',
        condition: (state) => {
            const grid = state.upgrades.find(u => u.id === 'grid');
            return grid && grid.quantity >= 1;
        }
    },
    {
        id: 'tier_2',
        name: 'Subindo de nível',
        desc: 'Atingiu o Nível 2 de Sustentabilidade.',
        icon: '👑',
        condition: (state) => state.currentTier >= 2
    },
    {
        id: 'knowledge_1000',
        name: 'Mestre da sustentabilidade',
        desc: 'Acumulou 1.000 de Conhecimento.',
        icon: '🌍',
        condition: (state) => state.points >= 1000
    },
    {
        id: 'tier_5',
        name: 'Sempre evoluindo',
        desc: 'Atingiu o Nível 5 de Sustentabilidade.',
        icon: '🌟',
        condition: (state) => state.currentTier >= 5
    }
];

// FUNÇÃO PARA VERIFICAR E MOSTRAR AS CONQUISTAS
function checkAchievements() {
    ACHIEVEMENTS.forEach(achievement => {
        if (!gameState.unlockedAchievements.includes(achievement.id) && achievement.condition(gameState)) {
            gameState.unlockedAchievements.push(achievement.id);
            showAchievementNotification(achievement);
            saveGame();
        }
    });
}

// FUNÇÃO PARA EXIBIR NOTIFICAÇÃO DAS CONQUISTAS | SONS

const clickAudio = new Audio('assets/sounds/minecraft-click-menu.mp3'); /* SOM TEMPORÁRIO */
clickAudio.volume = 0.6;
 
function playClickSound() {
    try {
        const clickSfx = clickAudio.cloneNode();
        clickSfx.volume = 0.6;
        clickSfx.play();
    } catch (e) {
        console.warn("Não foi possível reproduzir o som de clique:", e);
    }
}

function playAchievementSound() {
    try {
        const audio = new Audio('assets/sounds/steam-achievement.mp3');
        audio.volume = 0.6;
        audio.play();
    } catch (e) {
        console.warn("Não foi possível reproduzir o som de conquista:", e); 
    }
}



function showAchievementNotification(achievement) {
    playAchievementSound();
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
            <div class="achievement-title">CONQUISTA DESBLOQUEADA!</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
        </div>
    `;
    document.body.appendChild(notification);

    // força o reflow para a animação funcionar
    notification.getBoundingClientRect();
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 500);
    }, 3500);
}

// 2. ELEMENTOS DO DOM
const scoreDisplay = document.getElementById('score-display');
const cpsDisplay = document.getElementById('cps-display');
const energyDisplay = document.getElementById('energy-display');
const tierDisplay = document.getElementById('tier-display');
const progressLabel = document.getElementById('progress-label');
const progressBar = document.getElementById('progress-bar');
const bulbImg = document.getElementById('bulb-img');
const clickArea = document.getElementById('click-area');
const upgradesListContainer = document.getElementById('upgrades-list');

// CORREÇÃO CRÍTICA: Testar se o LocalStorage está disponível para evitar travamento do script
let isStorageAvailable = false;
try {
    localStorage.setItem('test_storage', 'test');
    localStorage.removeItem('test_storage');
    isStorageAvailable = true;
} catch (e) {
    console.warn("LocalStorage bloqueado pelo navegador. O jogo rodará, mas o progresso não será salvo ao fechar a página.");
}

// CARREGAR SAVE SE DISPONÍVEL
if (isStorageAvailable && localStorage.getItem('ecoClickerSave')) {
    try {
        const savedState = JSON.parse(localStorage.getItem('ecoClickerSave'));
        if (savedState && savedState.upgrades) {
            gameState.points = savedState.points || 0;
            gameState.knowledgePerSecond = savedState.knowledgePerSecond || 0;
            gameState.totalUpgradesBought = savedState.totalUpgradesBought || 0;
            gameState.currentTier = savedState.currentTier || 1;
            gameState.totalClicks = savedState.totalClicks || 0;
            gameState.unlockedAchievements = savedState.unlockedAchievements || [];
            savedState.upgrades.forEach(savedUp => {
                const target = gameState.upgrades.find(u => u.id === savedUp.id);
                if (target) {
                    target.quantity = savedUp.quantity;
                    target.cost = savedUp.cost;
                }
            });
        }
    } catch (e) {
        console.error("Erro ao carregar o progresso salvo:", e);
    }
}

// 3. RENDERIZAÇÃO DOS UPGRADES
function renderUpgrades() {
    if (!upgradesListContainer) return;
    upgradesListContainer.innerHTML = '';
    
    gameState.upgrades.forEach(upgrade => {
        const isAvailable = gameState.points >= upgrade.cost;
        
        const card = document.createElement('div');
        // Adiciona uma classe específica para a cor (led, solar, grid)
        card.className = `upgrade-card theme-${upgrade.id} ${isAvailable ? 'available' : ''}`;
        
        card.innerHTML = `
            <div class="upgrade-icon-box">${upgrade.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name} <span class="upgrade-qty">(${upgrade.quantity})</span></div>
                <div class="upgrade-desc">${upgrade.desc}</div>
                <div class="upgrade-cps">+${upgrade.cps} conhecimento por segundo</div>
            </div>
            <button class="buy-btn-3d" onclick="buyUpgrade('${upgrade.id}')">
                <div class="btn-top-text">COMPRAR</div>
                <div class="btn-bottom-text">🧠 ${Math.floor(upgrade.cost)}</div>
            </button>
        `;
        upgradesListContainer.appendChild(card);
    });
}

// 4. ATUALIZAÇÃO DA INTERFACE
function updateUI() {
    if(scoreDisplay) scoreDisplay.textContent = Math.floor(gameState.points).toLocaleString('pt-BR');
    if(cpsDisplay) cpsDisplay.textContent = `+${gameState.knowledgePerSecond}/s`;
    
    let energyPercentage = Math.min(10 + (gameState.totalUpgradesBought * 3), 100);
    if(energyDisplay) energyDisplay.textContent = `${energyPercentage}%`;
    
    let calculatedTier = Math.floor(gameState.totalUpgradesBought / 10) + 1;
    if (calculatedTier !== gameState.currentTier) {
        gameState.currentTier = calculatedTier;
    }
    if(tierDisplay) tierDisplay.textContent = `Nível ${gameState.currentTier}`;

    let upgradesNoNivelAtual = gameState.totalUpgradesBought % 10;
    if(progressLabel) progressLabel.textContent = `Progresso até Nível ${gameState.currentTier + 1} (${upgradesNoNivelAtual}/10 upgrades)`;
    if(progressBar) progressBar.style.width = `${upgradesNoNivelAtual * 10}%`;
    
    if (bulbImg) {
        if (gameState.knowledgePerSecond > 0) {
            bulbImg.classList.add('bulb-active');
            bulbImg.src = 'assets/images/acessa.png'; // Acende a lâmpada
        } else {
            bulbImg.classList.remove('bulb-active');
            bulbImg.src = 'assets/images/apagada.png'; // Apaga a lâmpada
        }
    }

    const ledUp = gameState.upgrades.find(u => u.id === 'led');
    const solarUp = gameState.upgrades.find(u => u.id === 'solar');
    const gridUp = gameState.upgrades.find(u => u.id === 'grid');
    
    if (document.getElementById('prod-led')) document.getElementById('prod-led').textContent = `💡 LED: +${ledUp.quantity * ledUp.cps}/s`;
    if (document.getElementById('prod-solar')) document.getElementById('prod-solar').textContent = `☀️ Solar: +${solarUp.quantity * solarUp.cps}/s`;
    if (document.getElementById('prod-grid')) document.getElementById('prod-grid').textContent = `🌐 Smart Grid: +${gridUp.quantity * gridUp.cps}/s`;

    renderUpgrades();
}

// 5. FUNÇÃO DE CLIQUE DA LÂMPADA
window.clickBulb = function(e) {
    playClickSound();
    gameState.points += 1;
    gameState.totalClicks += 1;
    createFloatingNumber(e.clientX, e.clientY);
    updateUI();
    checkAchievements();
    saveGame();
};

function createFloatingNumber(clientX, clientY) {
    if (!clickArea) return;
    const num = document.createElement('div');
    num.className = 'floating-number';
    num.textContent = '+1';

    const rect = clickArea.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    if (!clientX || isNaN(x)) {
        x = rect.width / 2;
        y = rect.height / 2;
    }

    num.style.left = `${x - 10}px`;
    num.style.top = `${y - 20}px`;

    clickArea.appendChild(num);

    setTimeout(() => {
        num.remove();
    }, 800);
}

// 6. SISTEMA DE COMPRA (FÓRMULA EXPONENCIAL)
window.buyUpgrade = function(upgradeId) {
    const upgrade = gameState.upgrades.find(u => u.id === upgradeId);
    
    if (upgrade && gameState.points >= upgrade.cost) {
        playClickSound();
        gameState.points -= upgrade.cost;
        upgrade.quantity += 1;
        gameState.totalUpgradesBought += 1;
        
        upgrade.cost = upgrade.baseCost * Math.pow(1.15, upgrade.quantity);
        
        recalculateCPS();
        updateUI();
        checkAchievements();
        saveGame();
    }
};

function recalculateCPS() {
    gameState.knowledgePerSecond = gameState.upgrades.reduce((total, up) => {
        return total + (up.quantity * up.cps);
    }, 0);
}

// 7. LOOP PRINCIPAL (RODA A CADA 1 SEGUNDO)
setInterval(() => {
    if (gameState.knowledgePerSecond > 0) {
        gameState.points += gameState.knowledgePerSecond;
        updateUI();
        checkAchievements();
        saveGame();
    }
}, 1000);

// 8. SALVAMENTO AUTOMÁTICO
function saveGame() {
    if (isStorageAvailable) {
        try {
            localStorage.setItem('ecoClickerSave', JSON.stringify(gameState));
        } catch (e) {
            console.error("Erro ao salvar dados do jogo:", e);
        }
    }
}

// INICIALIZAÇÃO DO JOGO
recalculateCPS();
updateUI();
