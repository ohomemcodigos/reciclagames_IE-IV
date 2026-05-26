// 1. ESTADO GLOBAL DO JOGO
let gameState = {
    points: 0,
    knowledgePerSecond: 0,
    totalUpgradesBought: 0,
    currentTier: 1,
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
            icon: '☀️'
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

// 2. ELEMENTOS DO DOM
const scoreDisplay = document.getElementById('score-display');
const cpsDisplay = document.getElementById('cps-display');
const energyDisplay = document.getElementById('energy-display');
const tierDisplay = document.getElementById('tier-display');
const progressLabel = document.getElementById('progress-label');
const progressBar = document.getElementById('progress-bar');
const bulbSvg = document.getElementById('bulb-svg');
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
        card.className = `upgrade-card ${isAvailable ? 'available' : ''}`;
        
        card.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name} <span class="upgrade-qty">(${upgrade.quantity})</span></div>
                <div class="upgrade-desc">${upgrade.desc}</div>
                <div class="upgrade-desc" style="color:var(--primary-green); font-weight:bold;">+${upgrade.cps} conhecimento/s</div>
            </div>
            <button class="buy-btn" onclick="buyUpgrade('${upgrade.id}')">
                🧠 ${Math.floor(upgrade.cost)}
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

    if (bulbSvg) {
        if (gameState.knowledgePerSecond > 0) {
            bulbSvg.classList.add('bulb-active');
            bulbSvg.setAttribute('fill', '#fbc02d');
        } else {
            bulbSvg.classList.remove('bulb-active');
            bulbSvg.setAttribute('fill', '#e0e0e0');
        }
    }

    renderUpgrades();
}

// 5. FUNÇÃO DE CLIQUE DA LÂMPADA
window.clickBulb = function(e) {
    gameState.points += 1;
    createFloatingNumber(e.clientX, e.clientY);
    updateUI();
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
        gameState.points -= upgrade.cost;
        upgrade.quantity += 1;
        gameState.totalUpgradesBought += 1;
        
        upgrade.cost = upgrade.baseCost * Math.pow(1.15, upgrade.quantity);
        
        recalculateCPS();
        updateUI();
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