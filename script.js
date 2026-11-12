// -------- VARIABLES GLOBALES --------
let userCredits = 1000;
let matches = [];
let coupon = [];       // sélections en cours
let betsHistory = [];  // paris validés

// -------- RÉCUPÉRATION DES ÉLÉMENTS DOM --------
const ageModal = document.getElementById('ageModal');
const mainContent = document.getElementById('mainContent');
const checkAgeBtn = document.getElementById('checkAgeBtn');
const birthdateInput = document.getElementById('birthdate');
const ageError = document.getElementById('ageError');
const userCreditsSpan = document.getElementById('userCredits');
const matchesContainer = document.getElementById('matchesContainer');
const couponItems = document.getElementById('couponItems');
const stakeInput = document.getElementById('stakeInput');
const potentialWin = document.getElementById('potentialWin');
const confirmBetBtn = document.getElementById('confirmBetBtn');
const betMessage = document.getElementById('betMessage');
const resultsContainer = document.getElementById('resultsContainer');
const sportFilter = document.getElementById('sportFilter');
const statusFilter = document.getElementById('statusFilter');
const logoutBtn = document.getElementById('logoutBtn');
const bannerText = document.getElementById('bannerText');

// =========================================================
// 1. VÉRIFICATION DE L'ÂGE (LOI / JEU RESPONSABLE)
// =========================================================
checkAgeBtn.addEventListener('click', function () {
    const birthdate = birthdateInput.value;
    if (!birthdate) {
        ageError.textContent = 'Veuillez saisir une date de naissance.';
        return;
    }

    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age >= 18) {
        ageModal.classList.add('hidden');
        mainContent.classList.remove('hidden');
        startSimulation();
    } else {
        ageError.textContent = "Accès refusé : vous devez avoir au moins 18 ans.";
    }
});

// =========================================================
// 2. GÉNÉRATION DE MATCHS ALÉATOIRES
// =========================================================
const sports = ['Football', 'Basketball', 'Tennis'];
const teams = {
    Football: ['PSG', 'OM', 'Lyon', 'Real Madrid', 'Barça'],
    Basketball: ['Lakers', 'Bulls', 'Warriors', 'Celtics'],
    Tennis: ['Nadal', 'Federer', 'Djokovic', 'Alcaraz']
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMatches() {
    matches = [];
    const now = Date.now();

    for (let i = 0; i < 6; i++) {
        const sport = sports[randomInt(0, sports.length - 1)];
        const list = teams[sport];
        const t1 = list[randomInt(0, list.length - 1)];
        let t2 = list[randomInt(0, list.length - 1)];
        while (t2 === t1) t2 = list[randomInt(0, list.length - 1)];

        const duration = 3 * 60 * 1000; // 3 minutes réelles = 90 min fictives
        matches.push({
            id: i + 1,
            sport: sport,
            team1: t1,
            team2: t2,
            startTime: now + randomInt(10, 60) * 1000, // démarre dans 10-60 s
            duration: duration,
            score1: 0,
            score2: 0,
            status: 'À venir',
            odds: {
                team1: (1.5 + Math.random()).toFixed(2),
                draw: (3 + Math.random()).toFixed(2),
                team2: (1.5 + Math.random()).toFixed(2),
                users: { team1: randomInt(10, 500), draw: randomInt(10, 200), team2: randomInt(10, 500) }
            },
            result: null
        });
    }
}

// =========================================================
// 3. AFFICHAGE DES MATCHS
// =========================================================
function renderMatches() {
    matchesContainer.innerHTML = '';

    const fSport = sportFilter.value;
    const fStatus = statusFilter.value;

    const filtered = matches.filter(m => {
        const okSport = (fSport === 'all' || m.sport === fSport);
        const okStatus = (fStatus === 'all' || m.status === fStatus);
        return okSport && okStatus;
    });

    if (filtered.length === 0) {
        matchesContainer.innerHTML = '<p class="empty">Aucun match trouvé.</p>';
        return;
    }

    filtered.forEach(m => {
        const div = document.createElement('div');
        div.className = 'match';

        // compte à rebours
        let countdown = '';
        if (m.status === 'À venir') {
            const sec = Math.max(0, Math.floor((m.startTime - Date.now()) / 1000));
            countdown = `Début dans ${sec}s`;
        }

        div.innerHTML = `
            <div class="match-header">
                <span>${m.sport} — ${m.team1} vs ${m.team2}</span>
                <span class="match-status ${m.status === 'En cours' ? 'live' : ''}">${m.status} ${countdown}</span>
            </div>
            <div>Score : ${m.score1} - ${m.score2}</div>
            <div class="odds">
                <div>
                    <button class="odd-btn" data-match="${m.id}" data-type="team1">1 (${m.odds.team1})</button>
                    <div class="odd-users">${m.odds.users.team1} users</div>
                </div>
                <div>
                    <button class="odd-btn" data-match="${m.id}" data-type="draw">X (${m.odds.draw})</button>
                    <div class="odd-users">${m.odds.users.draw} users</div>
                </div>
                <div>
                    <button class="odd-btn" data-match="${m.id}" data-type="team2">2 (${m.odds.team2})</button>
                    <div class="odd-users">${m.odds.users.team2} users</div>
                </div>
            </div>
        `;
        matchesContainer.appendChild(div);
    });

    // écouteurs sur les boutons de cotes
    document.querySelectorAll('.odd-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const matchId = parseInt(this.dataset.match);
            const type = this.dataset.type;
            addToCoupon(matchId, type);
        });
    });
}

// =========================================================
// 4. COUPON DE PARIS
// =========================================================
function addToCoupon(matchId, type) {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    if (match.status === 'Terminé') {
        alert('Ce match est terminé.');
        return;
    }
    if (coupon.some(c => c.matchId === matchId)) {
        alert('Ce match est déjà dans votre coupon.');
        return;
    }

    const labels = { team1: match.team1, draw: 'Match nul', team2: match.team2 };
    coupon.push({
        matchId: matchId,
        matchLabel: `${match.team1} vs ${match.team2}`,
        choice: type,
        choiceLabel: labels[type],
        odd: parseFloat(match.odds[type])
    });
    renderCoupon();
}

function renderCoupon() {
    couponItems.innerHTML = '';
    if (coupon.length === 0) {
        couponItems.innerHTML = '<p class="empty">Aucune sélection.</p>';
        updatePotentialWin();
        return;
    }

    coupon.forEach((c, index) => {
        const div = document.createElement('div');
        div.className = 'coupon-item';
        div.innerHTML = `
            <span>${c.matchLabel} — ${c.choiceLabel} (${c.odd})</span>
            <button data-index="${index}">✖</button>
        `;
        couponItems.appendChild(div);
    });

    // supprimer une sélection
    couponItems.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.index);
            coupon.splice(idx, 1);
            renderCoupon();
        });
    });

    updatePotentialWin();
}

function getTotalOdd() {
    return coupon.reduce((acc, c) => acc * c.odd, 1);
}

function updatePotentialWin() {
    const stake = parseFloat(stakeInput.value) || 0;
    const total = getTotalOdd();
    potentialWin.textContent = (stake * total).toFixed(2);
}

stakeInput.addEventListener('input', updatePotentialWin);

// =========================================================
// 5. VALIDATION DU PARI
// =========================================================
confirmBetBtn.addEventListener('click', function () {
    betMessage.textContent = '';
    if (coupon.length === 0) {
        betMessage.textContent = 'Votre coupon est vide.';
        return;
    }

    const stake = parseFloat(stakeInput.value);
    if (!stake || stake <= 0) {
        betMessage.textContent = 'Mise invalide.';
        return;
    }
    if (stake > userCredits) {
        betMessage.textContent = 'Vous n\'avez pas assez de crédits.';
        return;
    }

    // débit des crédits
    userCredits -= stake;
    userCreditsSpan.textContent = 'Crédits : ' + userCredits;

    // enregistrement du pari
    const bet = {
        id: Date.now(),
        selections: [...coupon],
        stake: stake,
        totalOdd: getTotalOdd(),
        potential: stake * getTotalOdd(),
        status: 'En attente',
        win: 0
    };
    betsHistory.push(bet);

    // vider le coupon
    coupon = [];
    renderCoupon();
    betMessage.textContent = 'Pari validé ! Bonne chance.';
    renderResults();

    // simulation : le pari est résolu automatiquement après quelques secondes
    // (en vrai, on attendrait le résultat réel du match)
    setTimeout(() => resolveBet(bet.id), 8000);
});

// =========================================================
// 6. RÉSULTATS
// =========================================================
function resolveBet(betId) {
    const bet = betsHistory.find(b => b.id === betId);
    if (!bet) return;

    // On simule : le pari est gagné si chaque sélection est correcte
    // (ici on tire au hasard pour la démo)
    const isWin = Math.random() < 0.5;

    if (isWin) {
        bet.status = 'Gagné';
        bet.win = bet.potential;
        userCredits += bet.potential;
        userCreditsSpan.textContent = 'Crédits : ' + userCredits;
    } else {
        bet.status = 'Perdu';
        bet.win = 0;
    }
    renderResults();
}

function renderResults() {
    if (betsHistory.length === 0) {
        resultsContainer.innerHTML = '<p class="empty">Aucun pari pour le moment.</p>';
        return;
    }

    resultsContainer.innerHTML = '';
    betsHistory.slice().reverse().forEach(b => {
        const div = document.createElement('div');
        let cls = '';
        let msg = '';
        if (b.status === 'Gagné') { cls = 'win'; msg = '🎉 Félicitations, vous avez gagné ' + b.win.toFixed(2) + ' crédits !'; }
        else if (b.status === 'Perdu') { cls = 'lose'; msg = '😢 Dommage, perdu. Continuez, la chance tournera !'; }
        else { msg = '⏳ Pari en attente de résultat...'; }

        div.className = 'result-item ' + cls;
        div.innerHTML = `
            <strong>Pari #${b.id} — Mise : ${b.stake} crédits — Cote totale : ${b.totalOdd.toFixed(2)}</strong>
            <div>${b.selections.map(s => `${s.matchLabel} : ${s.choiceLabel}`).join(' | ')}</div>
            <div>${msg}</div>
        `;
        resultsContainer.appendChild(div);
    });
}

// =========================================================
// 7. SIMULATION DES MATCHS (SCORES, STATUTS)
// =========================================================
function startSimulation() {
    generateMatches();
    renderMatches();

    // mise à jour des matchs toutes les secondes
    setInterval(() => {
        const now = Date.now();
        matches.forEach(m => {
            // démarrage
            if (m.status === 'À venir' && now >= m.startTime) {
                m.status = 'En cours';
            }
            // fin
            if (m.status === 'En cours' && now >= m.startTime + m.duration) {
                m.status = 'Terminé';
                m.score1 = randomInt(0, 5);
                m.score2 = randomInt(0, 5);
            }
            // score en direct
            if (m.status === 'En cours' && Math.random() < 0.3) {
                if (Math.random() < 0.5) m.score1++; else m.score2++;
            }
        });
        renderMatches();
    }, 1000);

    // bannière défilante automatique
    const banners = [
        ' Offre de bienvenue : 1000 crédits fictifs offerts ! ',
        ' Cote boostée sur PSG vs OM ! ',
        ' Pariez sur le match du jour ! '
    ];
    let bIdx = 0;
    setInterval(() => {
        bIdx = (bIdx + 1) % banners.length;
        bannerText.textContent = banners[bIdx];
    }, 5000);
}

// =========================================================
// 8. FILTRES
// =========================================================
sportFilter.addEventListener('change', renderMatches);
statusFilter.addEventListener('change', renderMatches);

// =========================================================
// 9. DÉCONNEXION
// =========================================================
logoutBtn.addEventListener('click', function () {
    location.reload();
});