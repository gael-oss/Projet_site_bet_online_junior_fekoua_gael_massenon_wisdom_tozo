/* ============================================================
   EFBET - Code simple et compréhensible
   ============================================================ */

/* ---------- VARIABLES GLOBALES ---------- */
let credits = 1000;
let matches = [];
let coupon = [];
let bets = [];
let combos = [];
let currentFilters = { sport: 'all', competition: 'all', status: 'all' };
let liveMatchId = null;

/* ---------- VIDÉOS YOUTUBE PAR AFFICHE ---------- */
const matchVideos = {
  'barca|real madrid': 'https://www.youtube.com/embed/OOKOzx_kHQ8',
  'lyon|marseille': 'https://www.youtube.com/embed/dIVvfx5sx_4',
  'celtics|lakers': 'https://www.youtube.com/embed/MNdMmqaMRbU'
};

/* ---------- IMAGES PAR SPORT ---------- */
const images = {
  Football: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=70',
  Basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=70',
  Tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=70'
};

/* ---------- PETITS OUTILS ---------- */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeTeamName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getMatchVideoUrl(match) {
  const teams = [normalizeTeamName(match.team1), normalizeTeamName(match.team2)].sort();
  return matchVideos[teams.join('|')] || '';
}

function getMatchSearchUrl(match) {
  const query = match.team1 + ' vs ' + match.team2 + ' match highlights';
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
}

function formatNumber(n) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || '');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 4000);
}

/* ============================================================
   1. VÉRIFICATION DE L'ÂGE
   ============================================================ */
document.getElementById('checkAgeBtn').onclick = function() {
  const dateStr = document.getElementById('birthdate').value;
  const errorP = document.getElementById('ageError');

  if (!dateStr) {
    errorP.textContent = 'Merci de renseigner votre date de naissance.';
    return;
  }

  // Calcul de l'âge
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 18) {
    errorP.textContent = 'Accès refusé : vous devez avoir 18 ans ou plus.';
    return;
  }

  // OK : on cache la modale et on affiche le site
  document.getElementById('ageModal').classList.add('hidden');
  document.getElementById('mainContent').classList.remove('hidden');
  startApp();
  showToast('Bienvenue ! 1000 crédits fictifs offerts.', 'info');
};

/* ============================================================
   2. DÉMARRAGE
   ============================================================ */
function startApp() {
  createMatches(10);
  createCombos();
  updateAll();
  setupTabs();
  setupFilters();
  setupChatbot();
  setupVideoModal();
  startSimulation();
}

function updateAll() {
  updateCredits();
  updateMatches();
  updateCombos();
  updateCoupon();
  updateResults();
}

/* ============================================================
   3. GÉNÉRATION DES MATCHS
   ============================================================ */
const sportsList = ['Football', 'Basketball', 'Tennis'];
const teamsList = {
  Football: ['PSG', 'Marseille', 'Lyon', 'Monaco', 'Real Madrid', 'Barça'],
  Basketball: ['Lakers', 'Bulls', 'Warriors', 'Celtics'],
  Tennis: ['Nadal', 'Federer', 'Djokovic', 'Alcaraz']
};
const compsList = {
  Football: ['Ligue 1', 'Champions League', 'La Liga'],
  Basketball: ['NBA', 'EuroLeague'],
  Tennis: ['ATP Masters', 'Grand Slam']
};

function createMatches(count) {
  matches = [];
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const sport = randomPick(sportsList);
    const teams = teamsList[sport];

    let t1 = randomPick(teams);
    let t2 = randomPick(teams);
    while (t2 === t1) t2 = randomPick(teams);

    matches.push({
      id: i,
      sport: sport,
      competition: randomPick(compsList[sport]),
      team1: t1,
      team2: t2,
      startTime: now + randomInt(15, 120) * 1000,
      duration: 3 * 60 * 1000,
      score1: 0,
      score2: 0,
      status: 'À venir',
      odds: {
        team1: (1.5 + Math.random() * 2).toFixed(2),
        draw: (3 + Math.random() * 2).toFixed(2),
        team2: (1.5 + Math.random() * 2).toFixed(2)
      },
      users: {
        team1: randomInt(50, 800),
        draw: randomInt(20, 300),
        team2: randomInt(50, 800)
      },
      image: images[sport]
    });
  }
}

/* ============================================================
   4. GÉNÉRATION DES COMBINÉS
   ============================================================ */
function createCombos() {
  combos = [];
  for (let i = 0; i < 3; i++) {
    const picks = [];
    const used = [];

    while (picks.length < 2) {
      const m = randomPick(matches);
      if (used.indexOf(m.id) !== -1) continue;
      used.push(m.id);

      const type = randomPick(['team1', 'draw', 'team2']);
      const label = type === 'team1' ? m.team1 : type === 'team2' ? m.team2 : 'Match nul';

      picks.push({
        matchId: m.id,
        type: type,
        odd: parseFloat(m.odds[type]),
        label: m.team1 + ' vs ' + m.team2 + ' → ' + label
      });
    }

    let total = 1;
    for (let j = 0; j < picks.length; j++) {
      total = total * picks[j].odd;
    }
    combos.push({ picks: picks, totalOdd: total.toFixed(2) });
  }
}

/* ============================================================
   5. AFFICHAGE DES MATCHS
   ============================================================ */
function updateMatches() {
  const container = document.getElementById('matchesContainer');

  const filtered = matches.filter(function(m) {
    const okSport = currentFilters.sport === 'all' || m.sport === currentFilters.sport;
    const okComp = currentFilters.competition === 'all' || m.competition === currentFilters.competition;
    const okStatus = currentFilters.status === 'all' || m.status === currentFilters.status;
    return okSport && okComp && okStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="padding:30px;text-align:center;color:#8896a8">Aucun match ne correspond.</p>';
    return;
  }

  container.innerHTML = '';
  for (let i = 0; i < filtered.length; i++) {
    container.innerHTML += buildMatchCard(filtered[i]);
  }

  // Attacher les événements aux boutons
  const oddButtons = document.querySelectorAll('.odd-btn');
  for (let i = 0; i < oddButtons.length; i++) {
    oddButtons[i].onclick = function() {
      const matchId = parseInt(this.dataset.match);
      const type = this.dataset.type;
      toggleCoupon(matchId, type);
    };
  }

  const videoButtons = document.querySelectorAll('.video-btn');
  for (let i = 0; i < videoButtons.length; i++) {
    videoButtons[i].onclick = function() {
      openVideo(parseInt(this.dataset.video));
    };
  }
}

function buildMatchCard(m) {
  const isSelected = function(type) {
    return coupon.some(function(c) { return c.matchId === m.id && c.type === type; });
  };
  const isEnded = m.status === 'Terminé';
  const isLive = m.status === 'En cours';

  let statusClass = 'status-upcoming';
  if (isLive) statusClass = 'status-live';
  if (m.status === 'Terminé') statusClass = 'status-ended';

  let countdown = '';
  if (m.status === 'À venir') {
    countdown = '• Début dans ' + Math.max(0, Math.ceil((m.startTime - Date.now()) / 1000)) + 's';
  } else if (isLive) {
    countdown = '• En direct';
  } else {
    countdown = '• Terminé';
  }

  let scoreText = '';
  if (m.status === 'À venir') {
    scoreText = 'Coup d\'envoi à ' + new Date(m.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else {
    scoreText = '<span class="live-score">' + m.score1 + ' - ' + m.score2 + '</span>';
  }

  // Construction des 3 boutons de cotes
  const btn1 = buildOddButton(m, 'team1', m.team1, isSelected('team1'), isEnded);
  const btnX = buildOddButton(m, 'draw', 'Nul', isSelected('draw'), isEnded);
  const btn2 = buildOddButton(m, 'team2', m.team2, isSelected('team2'), isEnded);

  return '<div class="match-card">' +
    '<div class="match-image" style="background-image:url(\'' + m.image + '\')"></div>' +
    '<div class="match-body">' +
      '<div class="match-top">' +
        '<span class="match-comp">' + m.competition + '</span>' +
        '<span class="match-status ' + statusClass + '">' + m.status + '</span>' +
      '</div>' +
      '<div class="match-teams">' + m.team1 + ' vs ' + m.team2 + '</div>' +
      '<div class="match-score">' + scoreText + ' <small>' + countdown + '</small></div>' +
      '<div class="odds">' + btn1 + btnX + btn2 + '</div>' +
      '<button class="video-btn" data-video="' + m.id + '">▶ Regarder le résumé</button>' +
    '</div>' +
  '</div>';
}

function buildOddButton(m, type, label, selected, disabled) {
  const cls = selected ? 'odd-btn selected' : 'odd-btn';
  const dis = disabled ? 'disabled' : '';
  return '<button class="' + cls + '" data-match="' + m.id + '" data-type="' + type + '" ' + dis + '>' +
    '<span class="odd-label">' + label + '</span>' +
    '<span class="odd-value">' + m.odds[type] + '</span>' +
    '<span class="odd-users">' + m.users[type] + ' joueurs</span>' +
  '</button>';
}

/* ============================================================
   6. COUPON (ajout / suppression)
   ============================================================ */
function toggleCoupon(matchId, type) {
  const m = matches.find(function(x) { return x.id === matchId; });
  if (!m || m.status === 'Terminé') return;

  // Vérifier si déjà présent
  const index = coupon.findIndex(function(c) { return c.matchId === matchId && c.type === type; });

  if (index >= 0) {
    coupon.splice(index, 1);
    showToast('Sélection retirée.', 'info');
  } else {
    // Supprimer toute autre sélection de ce match
    for (let i = coupon.length - 1; i >= 0; i--) {
      if (coupon[i].matchId === matchId) coupon.splice(i, 1);
    }

    const label = type === 'team1' ? m.team1 : type === 'team2' ? m.team2 : 'Match nul';
    coupon.push({
      matchId: matchId,
      type: type,
      matchLabel: m.team1 + ' vs ' + m.team2,
      choiceLabel: label,
      odd: parseFloat(m.odds[type])
    });
    showToast('Ajouté : ' + m.team1 + ' vs ' + m.team2 + ' → ' + label);
  }

  updateMatches();
  updateCoupon();
}

function updateCoupon() {
  const box = document.getElementById('couponItems');

  if (coupon.length === 0) {
    box.innerHTML = '<p style="color:#8896a8;text-align:center;padding:15px 0">Coupon vide.</p>';
  } else {
    box.innerHTML = '';
    for (let i = 0; i < coupon.length; i++) {
      const c = coupon[i];
      box.innerHTML += '<div class="coupon-item">' +
        '<div class="coupon-item-info">' +
          '<div class="coupon-item-title">' + c.matchLabel + '</div>' +
          '<div class="coupon-item-choice">' + c.choiceLabel + '</div>' +
        '</div>' +
        '<span class="coupon-item-odd">' + c.odd + '</span>' +
        '<button data-remove="' + i + '" aria-label="Retirer cette sélection">Retirer</button>' +
      '</div>';
    }

    const removeButtons = box.querySelectorAll('button');
    for (let i = 0; i < removeButtons.length; i++) {
      removeButtons[i].onclick = function() {
        const idx = parseInt(this.dataset.remove);
        coupon.splice(idx, 1);
        updateMatches();
        updateCoupon();
      };
    }
  }

  document.getElementById('couponCount').textContent = coupon.length;

  let total = 1;
  for (let i = 0; i < coupon.length; i++) {
    total = total * coupon[i].odd;
  }

  document.getElementById('totalOdd').textContent = coupon.length ? total.toFixed(2) : '-';
  updatePotentialWin();
}

function updatePotentialWin() {
  const stake = parseFloat(document.getElementById('stakeInput').value) || 0;
  let total = 1;
  for (let i = 0; i < coupon.length; i++) total = total * coupon[i].odd;
  document.getElementById('potentialWin').textContent = formatNumber(stake * total);
}

document.getElementById('stakeInput').oninput = updatePotentialWin;

/* ============================================================
   7. VALIDATION DU PARI
   ============================================================ */
document.getElementById('confirmBetBtn').onclick = function() {
  const msg = document.getElementById('betMessage');
  msg.textContent = '';

  if (coupon.length === 0) {
    msg.textContent = 'Coupon vide.';
    msg.style.color = '#d32f2f';
    return;
  }

  const stake = parseFloat(document.getElementById('stakeInput').value);
  if (!stake || stake <= 0) {
    msg.textContent = 'Mise invalide.';
    msg.style.color = '#d32f2f';
    return;
  }

  if (stake > credits) {
    msg.textContent = 'Crédits insuffisants.';
    msg.style.color = '#d32f2f';
    return;
  }

  credits = credits - stake;
  updateCredits();

  let total = 1;
  for (let i = 0; i < coupon.length; i++) total = total * coupon[i].odd;

  const newBet = {
    id: Date.now(),
    selections: coupon.slice(), // copie
    stake: stake,
    totalOdd: total,
    potential: stake * total,
    status: 'En attente',
    win: 0
  };
  bets.push(newBet);
  coupon = [];

  updateAll();

  msg.textContent = 'Pari validé !';
  msg.style.color = '#2a9d8f';
  showToast('Pari validé - résultats bientôt…', 'info');

  setTimeout(function() { resolveBet(newBet.id); }, 5000 + Math.random() * 4000);
};

function resolveBet(betId) {
  const bet = bets.find(function(b) { return b.id === betId; });
  if (!bet) return;

  if (Math.random() < 0.45) {
    bet.status = 'Gagné';
    bet.win = bet.potential;
    credits = credits + bet.potential;
    showToast('Pari gagné : +' + formatNumber(bet.potential) + ' crédits !');
  } else {
    bet.status = 'Perdu';
    showToast('Pari perdu. Continuez !', 'error');
  }

  updateCredits();
  updateResults();
}

/* ============================================================
   8. AFFICHAGE DE L'HISTORIQUE
   ============================================================ */
function updateResults() {
  const c = document.getElementById('resultsContainer');

  if (bets.length === 0) {
    c.innerHTML = '<div class="panel" style="text-align:center;color:#8896a8;padding:30px">Aucun pari pour le moment.</div>';
    return;
  }

  c.innerHTML = '';
  const reversed = bets.slice().reverse();

  for (let i = 0; i < reversed.length; i++) {
    const b = reversed[i];
    let cls = 'pending';
    if (b.status === 'Gagné') cls = 'win';
    if (b.status === 'Perdu') cls = 'lose';

    let message = '';
    if (b.status === 'Gagné') message = 'Félicitations ! Vous avez gagné ' + formatNumber(b.win) + ' crédits.';
    else if (b.status === 'Perdu') message = 'Dommage. Ne vous découragez pas !';
    else message = 'Pari en attente…';

    let selectionsHTML = '';
    for (let j = 0; j < b.selections.length; j++) {
      const s = b.selections[j];
      selectionsHTML += '<div class="result-selection">' + s.matchLabel + ' - <strong>' + s.choiceLabel + '</strong> (cote ' + s.odd + ')</div>';
    }

    c.innerHTML += '<div class="result-item ' + cls + '">' +
      '<div class="result-header">' +
        '<span>Pari #' + String(b.id).slice(-6) + '</span>' +
        '<span class="result-status ' + cls + '">' + b.status + '</span>' +
      '</div>' +
      selectionsHTML +
      '<div class="result-footer">' +
        '<span>Mise : ' + formatNumber(b.stake) + '</span>' +
        '<span>Cote : ' + b.totalOdd.toFixed(2) + '</span>' +
        '<span>Gain : ' + formatNumber(b.win) + '</span>' +
      '</div>' +
      '<div class="result-msg ' + cls + '">' + message + '</div>' +
    '</div>';
  }
}

/* ============================================================
   9. AFFICHAGE DES COMBINÉS
   ============================================================ */
function updateCombos() {
  const c = document.getElementById('combosContainer');
  c.innerHTML = '';

  for (let i = 0; i < combos.length; i++) {
    const cb = combos[i];
    let picksHTML = '';
    for (let j = 0; j < cb.picks.length; j++) {
      picksHTML += '<div class="combo-pick">' + cb.picks[j].label + '</div>';
    }

    c.innerHTML += '<div class="combo">' +
      '<div class="combo-title">Combiné #' + (i + 1) + '</div>' +
      picksHTML +
      '<div class="combo-footer">' +
        '<span class="combo-odd">× ' + cb.totalOdd + '</span>' +
        '<button class="combo-add" data-combo="' + i + '">Ajouter</button>' +
      '</div>' +
    '</div>';
  }

  const addButtons = document.querySelectorAll('.combo-add');
  for (let i = 0; i < addButtons.length; i++) {
    addButtons[i].onclick = function() {
      const comboIndex = parseInt(this.dataset.combo);
      const cb = combos[comboIndex];

      coupon = [];
      for (let j = 0; j < cb.picks.length; j++) {
        const p = cb.picks[j];
        const m = matches.find(function(x) { return x.id === p.matchId; });
        const label = p.type === 'team1' ? m.team1 : p.type === 'team2' ? m.team2 : 'Match nul';
        coupon.push({
          matchId: m.id,
          type: p.type,
          matchLabel: m.team1 + ' vs ' + m.team2,
          choiceLabel: label,
          odd: parseFloat(m.odds[p.type])
        });
      }
      updateMatches();
      updateCoupon();
      showToast('Combiné #' + (comboIndex + 1) + ' ajouté.');
    };
  }
}

/* ============================================================
   10. CRÉDITS
   ============================================================ */
function updateCredits() {
  document.getElementById('creditsDisplay').textContent = formatNumber(credits) + ' crédits';
}

/* ============================================================
   11. SIMULATION (compte à rebours, scores)
   ============================================================ */
function startSimulation() {
  setInterval(function() {
    const now = Date.now();
    let changed = false;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];

      if (m.status === 'À venir' && now >= m.startTime) {
        m.status = 'En cours';
        changed = true;
        showToast('Coup d\'envoi : ' + m.team1 + ' vs ' + m.team2, 'info');
      }

      if (m.status === 'En cours' && now >= m.startTime + m.duration) {
        m.status = 'Terminé';
        m.score1 = randomInt(0, 5);
        m.score2 = randomInt(0, 5);
        changed = true;
      }

      if (m.status === 'En cours' && Math.random() < 0.25) {
        if (Math.random() < 0.5) m.score1++; else m.score2++;
        changed = true;
      }
    }

    if (changed) {
      if (!document.getElementById('tab-home').classList.contains('hidden')) updateMatches();
      if (!document.getElementById('tab-live').classList.contains('hidden')) updateLive();
    }
  }, 1000);
}

/* ============================================================
   13. FILTRES
   ============================================================ */
function setupFilters() {
  const chips = document.querySelectorAll('#sportChips .chip');
  for (let i = 0; i < chips.length; i++) {
    chips[i].onclick = function() {
      for (let j = 0; j < chips.length; j++) chips[j].classList.remove('active');
      this.classList.add('active');
      currentFilters.sport = this.dataset.sport;

      // Mettre à jour les compétitions disponibles
      const compSelect = document.getElementById('compFilter');
      let comps = [];
      if (currentFilters.sport === 'all') {
        for (const s in compsList) comps = comps.concat(compsList[s]);
      } else {
        comps = compsList[currentFilters.sport];
      }
      // Supprimer les doublons
      const unique = [];
      for (let k = 0; k < comps.length; k++) {
        if (unique.indexOf(comps[k]) === -1) unique.push(comps[k]);
      }

      compSelect.innerHTML = '<option value="all">Toutes compétitions</option>';
      for (let k = 0; k < unique.length; k++) {
        compSelect.innerHTML += '<option value="' + unique[k] + '">' + unique[k] + '</option>';
      }
      currentFilters.competition = 'all';
      updateMatches();
    };
  }

  document.getElementById('compFilter').onchange = function() {
    currentFilters.competition = this.value;
    updateMatches();
  };

  document.getElementById('statusFilter').onchange = function() {
    currentFilters.status = this.value;
    updateMatches();
  };
}

/* ============================================================
   14. ONGLETS
   ============================================================ */
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].onclick = function() {
      for (let j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
      this.classList.add('active');

      const name = this.dataset.tab;
      document.getElementById('tab-home').classList.add('hidden');
      document.getElementById('tab-live').classList.add('hidden');
      document.getElementById('tab-history').classList.add('hidden');
      document.getElementById('tab-' + name).classList.remove('hidden');

      if (name === 'live') updateLive();
      if (name === 'history') updateResults();
    };
  }
}

/* ============================================================
   15. VUE LIVE
   ============================================================ */
function updateLive() {
  const c = document.getElementById('liveList');
  const liveMatches = matches.filter(function(m) { return m.status === 'En cours'; });

  if (liveMatches.length === 0) {
    c.innerHTML = '<div class="panel" style="text-align:center;color:#8896a8;padding:30px">Aucun match en direct pour le moment.</div>';
    return;
  }

  c.innerHTML = '';
  for (let i = 0; i < liveMatches.length; i++) {
    const m = liveMatches[i];
    const activeClass = liveMatchId === m.id ? 'active' : '';
    c.innerHTML += '<div class="live-item ' + activeClass + '" data-live="' + m.id + '">' +
      '<div>' +
        '<div class="live-item-teams">' + m.team1 + ' vs ' + m.team2 + '</div>' +
        '<div style="font-size:0.75em;color:#8896a8">' + m.competition + '</div>' +
      '</div>' +
      '<div class="live-item-score">' + m.score1 + ' - ' + m.score2 + '</div>' +
    '</div>';
  }

  const items = c.querySelectorAll('.live-item');
  for (let i = 0; i < items.length; i++) {
    items[i].onclick = function() {
      liveMatchId = parseInt(this.dataset.live);
      const m = matches.find(function(x) { return x.id === liveMatchId; });
      updateLivePlayer(m);
      updateLive();
    };
  }

  // Sélectionner le premier automatiquement
  if (!liveMatchId && liveMatches.length > 0) {
    liveMatchId = liveMatches[0].id;
    const m = liveMatches[0];
    updateLivePlayer(m);
    updateLive();
  }
}

function updateLivePlayer(match) {
  const videoUrl = getMatchVideoUrl(match);
  const iframe = document.getElementById('liveIframe');
  const searchLink = document.getElementById('liveSearchLink');

  if (videoUrl) {
    iframe.src = videoUrl + '?autoplay=1';
    searchLink.style.display = 'none';
  } else {
    iframe.removeAttribute('src');
    searchLink.href = getMatchSearchUrl(match);
    searchLink.style.display = 'inline-block';
  }

  document.getElementById('liveTitle').textContent =
    match.team1 + ' vs ' + match.team2 + ' - ' + match.score1 + ' - ' + match.score2;
}

/* ============================================================
   16. MODALE VIDÉO
   ============================================================ */
function setupVideoModal() {
  document.getElementById('closeVideo').onclick = function() {
    document.getElementById('videoModal').classList.add('hidden');
    document.getElementById('videoIframe').src = '';
    document.getElementById('videoSearchLink').style.display = 'none';
  };
}

function openVideo(matchId) {
  const m = matches.find(function(x) { return x.id === matchId; });
  if (!m) return;

  const videoUrl = getMatchVideoUrl(m);
  const iframe = document.getElementById('videoIframe');
  const searchLink = document.getElementById('videoSearchLink');
  if (videoUrl) {
    iframe.style.display = 'block';
    iframe.src = videoUrl + '?autoplay=1&rel=0';
    searchLink.style.display = 'none';
  } else {
    iframe.removeAttribute('src');
    iframe.style.display = 'none';
    searchLink.href = getMatchSearchUrl(m);
    searchLink.style.display = 'inline-block';
  }
  document.getElementById('videoTitle').textContent = m.team1 + ' vs ' + m.team2 + ' - Résumé';
  document.getElementById('videoModal').classList.remove('hidden');
}

/* ============================================================
   20. CHATBOT
   ============================================================ */
function setupChatbot() {
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');

  toggle.onclick = function() { panel.classList.toggle('hidden'); };
  document.getElementById('chatClose').onclick = function() { panel.classList.add('hidden'); };

  // Suggestions rapides
  const suggestions = document.querySelectorAll('.chat-suggestions button');
  for (let i = 0; i < suggestions.length; i++) {
    suggestions[i].onclick = function() {
      input.value = this.dataset.q;
      form.dispatchEvent(new Event('submit', { cancelable: true }));
    };
  }

  form.onsubmit = function(e) {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;

    addChatMessage(q, 'user');
    input.value = '';

    // Petit délai pour faire "réfléchir" le bot
    setTimeout(function() {
      const answer = getBotAnswer(q);
      addChatMessage(answer, 'bot');
    }, 500);
  };

  function addChatMessage(text, who) {
    const el = document.createElement('div');
    el.className = 'message ' + who;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }
}

function getBotAnswer(text) {
  const t = text.toLowerCase();

  if (t.indexOf('bonjour') !== -1 || t.indexOf('salut') !== -1 || t.indexOf('hello') !== -1) {
    return 'Bonjour. Comment puis-je vous aider ? Je peux expliquer les cotes, les combinés et le jeu responsable.';
  }
  if (t.indexOf('age') !== -1 || t.indexOf('âge') !== -1 || t.indexOf('18') !== -1 || t.indexOf('mineur') !== -1) {
    return 'Efbet est réservé aux personnes majeures (18 ans et +). La date de naissance est vérifiée à la première visite.';
  }
  if (t.indexOf('cote') !== -1 || t.indexOf('odd') !== -1) {
    return 'Une cote multipliée par votre mise donne votre gain potentiel. Exemple : cote 2.50 sur 10 crédits donne 25 crédits.';
  }
  if (t.indexOf('combin') !== -1) {
    return 'Un combiné regroupe plusieurs paris. Les cotes se multiplient. Il faut que tous les paris gagnent.';
  }
  if (t.indexOf('respons') !== -1 || t.indexOf('limite') !== -1 || t.indexOf('dépendance') !== -1) {
    return 'Les paris comportent des risques de dépendance. Jouez avec modération. Les crédits utilisés ici sont fictifs.';
  }
  if (t.indexOf('crédit') !== -1 || t.indexOf('solde') !== -1) {
    return 'Vous avez ' + formatNumber(credits) + ' crédits fictifs. Aucun argent réel.';
  }
  if (t.indexOf('pari') !== -1 || t.indexOf('paris') !== -1) {
    return 'Pour parier : 1) Choisissez un match 2) Cliquez sur une cote 3) Vérifiez le coupon 4) Entrez la mise 5) Validez.';
  }
  if (t.indexOf('live') !== -1 || t.indexOf('direct') !== -1 || t.indexOf('vidéo') !== -1) {
    return 'Cliquez sur Live pour voir les matchs en direct, ou sur Regarder le résumé sur un match.';
  }
  if (t.indexOf('merci') !== -1) {
    return 'Avec plaisir. Bonne chance !';
  }

  return 'Je n\'ai pas compris. Essayez : "les cotes", "combiné", "âge minimum", "jeu responsable".';
}
