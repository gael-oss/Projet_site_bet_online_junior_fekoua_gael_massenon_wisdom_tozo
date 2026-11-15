// État du site
let creditsFictifs = 1000;
let matchs = [];
let couponPari = [];
let paris = [];
let combines = [];
let filtresActuels = { sport: 'all', competition: 'all', statut: 'all' };
let identifiantMatchDirect = null;

// Vidéos associées aux affiches
const videosParAffiche = {
  'barca|real madrid': 'https://www.youtube.com/embed/OOKOzx_kHQ8',
  'lyon|marseille': 'https://www.youtube.com/embed/dIVvfx5sx_4',
  'celtics|lakers': 'https://www.youtube.com/embed/MNdMmqaMRbU'
};

// Images par sport
const images = {
  Football: '../img/football.avif',
  Basketball: '../img/basketball.jpg',
  Tennis: '../img/tennis.jpg'
};

// Fonctions utilitaires
function nombreAleatoire(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function choisirAleatoirement(tableau) {
  return tableau[Math.floor(Math.random() * tableau.length)];
}

function normaliserNomEquipe(nom) {
  return nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function obtenirUrlVideoMatch(rencontre) {
  const equipes = [normaliserNomEquipe(rencontre.equipeA), normaliserNomEquipe(rencontre.equipeB)].sort();
  return videosParAffiche[equipes.join('|')] || '';
}

function obtenirUrlRechercheMatch(rencontre) {
  const recherche = rencontre.equipeA + ' vs ' + rencontre.equipeB + ' match highlights';
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(recherche);
}

function formaterNombre(n) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function afficherNotification(message, typePari) {
  const conteneur = document.getElementById('notificationsTemporaires');
  const notification = document.createElement('div');
  notification.className = 'notification ' + (typePari || '');
  notification.textContent = message;
  conteneur.appendChild(notification);
  setTimeout(function() { notification.remove(); }, 4000);
}

// Vérification de l'âge
document.getElementById('boutonAgeValider').onclick = function() {
  const dateNaissanceTexte = document.getElementById('dateNaissance').value;
  const messageErreur = document.getElementById('erreurAge');

  if (!dateNaissanceTexte) {
    messageErreur.textContent = 'Merci de renseigner votre date de naissance.';
    return;
  }

  // Calcule l'âge à partir de la date de naissance
  const naissance = new Date(dateNaissanceTexte);
  const dateAujourdhui = new Date();
  let age = dateAujourdhui.getFullYear() - naissance.getFullYear();
  const differenceMois = dateAujourdhui.getMonth() - naissance.getMonth();
  if (differenceMois < 0 || (differenceMois === 0 && dateAujourdhui.getDate() < naissance.getDate())) {
    age--;
  }

  if (age < 18) {
    messageErreur.textContent = 'Accès refusé : vous devez avoir 18 ans ou plus.';
    return;
  }

  // Affiche le site après validation de l'âge
  document.getElementById('fenetreAge').classList.add('masque');
  document.getElementById('contenuPrincipal').classList.remove('masque');
  demarrerApplication();
  afficherNotification('Bienvenue ! 1000 crédits fictifs offerts.', 'information');
};

// Démarrage du site
function demarrerApplication() {
  creerMatchs(10);
  creerCombines();
  actualiserTout();
  initialiserOnglets();
  initialiserFiltres();
  initialiserAssistant();
  initialiserLecteurVideo();
  lancerSimulation();
}

function actualiserTout() {
  actualiserCredits();
  actualiserMatchs();
  actualiserCombines();
  actualiserCoupon();
  actualiserResultats();
}

// Génération des matchs
const sportsDisponibles = ['Football', 'Basketball', 'Tennis'];
const equipesParSport = {
  Football: ['PSG', 'Marseille', 'Lyon', 'Monaco', 'Real Madrid', 'Barça'],
  Basketball: ['Lakers', 'Bulls', 'Warriors', 'Celtics'],
  Tennis: ['Nadal', 'Federer', 'Djokovic', 'Alcaraz']
};
const competitionsParSport = {
  Football: ['Ligue 1', 'Champions League', 'La Liga'],
  Basketball: ['NBA', 'EuroLeague'],
  Tennis: ['ATP Masters', 'Grand Slam']
};

function creerMatchs(nombre) {
  matchs = [];
  const maintenant = Date.now();

  for (let indice = 1; indice <= nombre; indice++) {
    const sport = choisirAleatoirement(sportsDisponibles);
    const equipes = equipesParSport[sport];

    let equipeA = choisirAleatoirement(equipes);
    let equipeB = choisirAleatoirement(equipes);
    while (equipeB === equipeA) equipeB = choisirAleatoirement(equipes);

    matchs.push({
      identifiant: indice,
      sport: sport,
      competition: choisirAleatoirement(competitionsParSport[sport]),
      equipeA: equipeA,
      equipeB: equipeB,
      heureDebut: maintenant + nombreAleatoire(15, 120) * 1000,
      duree: 3 * 60 * 1000,
      scoreA: 0,
      scoreB: 0,
      statut: 'À venir',
      cotes: {
        equipeA: (1.5 + Math.random() * 2).toFixed(2),
        nul: (3 + Math.random() * 2).toFixed(2),
        equipeB: (1.5 + Math.random() * 2).toFixed(2)
      },
      utilisateurs: {
        equipeA: nombreAleatoire(50, 800),
        nul: nombreAleatoire(20, 300),
        equipeB: nombreAleatoire(50, 800)
      },
      image: images[sport]
    });
  }
}

// Génération des combinés
function creerCombines() {
  combines = [];
  for (let indice = 0; indice < 3; indice++) {
    const selections = [];
    const identifiantsUtilises = [];

    while (selections.length < 2) {
      const rencontre = choisirAleatoirement(matchs);
      if (identifiantsUtilises.indexOf(rencontre.identifiant) !== -1) continue;
      identifiantsUtilises.push(rencontre.identifiant);

      const typePari = choisirAleatoirement(['equipeA', 'nul', 'equipeB']);
      const libelle = typePari === 'equipeA' ? rencontre.equipeA : typePari === 'equipeB' ? rencontre.equipeB : 'Match nul';

      selections.push({
        identifiantMatch: rencontre.identifiant,
        typePari: typePari,
        cote: parseFloat(rencontre.cotes[typePari]),
        libelle: rencontre.equipeA + ' vs ' + rencontre.equipeB + ' → ' + libelle
      });
    }

    let coteTotale = 1;
    for (let indiceInterne = 0; indiceInterne < selections.length; indiceInterne++) {
      coteTotale = coteTotale * selections[indiceInterne].cote;
    }
    combines.push({ selections: selections, coteTotale: coteTotale.toFixed(2) });
  }
}

// Affichage des matchs
function actualiserMatchs() {
  const conteneur = document.getElementById('listeMatchs');

  const matchsFiltres = matchs.filter(function(rencontre) {
    const sportCorrespond = filtresActuels.sport === 'all' || rencontre.sport === filtresActuels.sport;
    const competitionCorrespond = filtresActuels.competition === 'all' || rencontre.competition === filtresActuels.competition;
    const statutCorrespond = filtresActuels.statut === 'all' || rencontre.statut === filtresActuels.statut;
    return sportCorrespond && competitionCorrespond && statutCorrespond;
  });

  if (matchsFiltres.length === 0) {
    conteneur.innerHTML = '<p style="padding:30px;text-align:center;color:#8896a8">Aucun match ne correspond.</p>';
    return;
  }

  conteneur.innerHTML = '';
  for (let indice = 0; indice < matchsFiltres.length; indice++) {
    conteneur.innerHTML += creerCarteMatch(matchsFiltres[indice]);
  }

  // Ajoute les actions aux boutons
  const boutonsCotes = document.querySelectorAll('.bouton-cote');
  for (let indice = 0; indice < boutonsCotes.length; indice++) {
    boutonsCotes[indice].onclick = function() {
      const identifiantMatch = parseInt(this.dataset.rencontre);
      const typePari = this.dataset.typePari;
      basculerSelectionCoupon(identifiantMatch, typePari);
    };
  }

  const boutonsVideo = document.querySelectorAll('.bouton-video');
  for (let indice = 0; indice < boutonsVideo.length; indice++) {
    boutonsVideo[indice].onclick = function() {
      ouvrirVideo(parseInt(this.dataset.videoMatch));
    };
  }
}

function creerCarteMatch(rencontre) {
  const estSelectionne = function(typePari) {
    return couponPari.some(function(element) { return element.identifiantMatch === rencontre.identifiant && element.typePari === typePari; });
  };
  const estTermine = rencontre.statut === 'Terminé';
  const estEnDirect = rencontre.statut === 'En cours';

  let classeStatut = 'statut-a-venir';
  if (estEnDirect) classeStatut = 'statut-direct';
  if (rencontre.statut === 'Terminé') classeStatut = 'statut-termine';

  let compteARebours = '';
  if (rencontre.statut === 'À venir') {
    compteARebours = '• Début dans ' + Math.max(0, Math.ceil((rencontre.heureDebut - Date.now()) / 1000)) + 's';
  } else if (estEnDirect) {
    compteARebours = '• En direct';
  } else {
    compteARebours = '• Terminé';
  }

  let texteScore = '';
  if (rencontre.statut === 'À venir') {
    texteScore = 'Coup d\'envoi à ' + new Date(rencontre.heureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else {
    texteScore = '<span class="score-direct">' + rencontre.scoreA + ' - ' + rencontre.scoreB + '</span>';
  }

  // Crée les trois boutons de cotes
  const boutonEquipeA = creerBoutonCote(rencontre, 'equipeA', rencontre.equipeA, estSelectionne('equipeA'), estTermine);
  const boutonNul = creerBoutonCote(rencontre, 'nul', 'Nul', estSelectionne('nul'), estTermine);
  const boutonEquipeB = creerBoutonCote(rencontre, 'equipeB', rencontre.equipeB, estSelectionne('equipeB'), estTermine);

  return '<div class="carte-match">' +
    '<div class="image-match" style="background-image:url(\'' + rencontre.image + '\')"></div>' +
    '<div class="contenu-match">' +
      '<div class="entete-match">' +
        '<span class="competition-match">' + rencontre.competition + '</span>' +
        '<span class="statut-match ' + classeStatut + '">' + rencontre.statut + '</span>' +
      '</div>' +
      '<div class="equipes-match">' + rencontre.equipeA + ' vs ' + rencontre.equipeB + '</div>' +
      '<div class="score-match">' + texteScore + ' <small>' + compteARebours + '</small></div>' +
      '<div class="cotes">' + boutonEquipeA + boutonNul + boutonEquipeB + '</div>' +
      '<button class="bouton-video" data-video-match="' + rencontre.identifiant + '">▶ Regarder le résumé</button>' +
    '</div>' +
  '</div>';
}

function creerBoutonCote(rencontre, typePari, libelle, estSelectionne, coteIndisponible) {
  const classeCSS = estSelectionne ? 'bouton-cote selectionne' : 'bouton-cote';
  const attributDesactive = coteIndisponible ? 'disabled' : '';
  return '<button class="' + classeCSS + '" data-rencontre="' + rencontre.identifiant + '" data-type-pari="' + typePari + '" ' + attributDesactive + '>' +
    '<span class="libelle-cote">' + libelle + '</span>' +
    '<span class="valeur-cote">' + rencontre.cotes[typePari] + '</span>' +
    '<span class="nombre-joueurs-cote">' + rencontre.utilisateurs[typePari] + ' joueurs</span>' +
  '</button>';
}

// Gestion du coupon
function basculerSelectionCoupon(identifiantMatch, typePari) {
  const rencontre = matchs.find(function(element) { return element.identifiant === identifiantMatch; });
  if (!rencontre || rencontre.statut === 'Terminé') return;

  // Vérifie si la sélection existe déjà
  const indice = couponPari.findIndex(function(element) { return element.identifiantMatch === identifiantMatch && element.typePari === typePari; });

  if (indice >= 0) {
    couponPari.splice(indice, 1);
    afficherNotification('Sélection retirée.', 'information');
  } else {
    // Garde une seule sélection par match
    for (let indice = couponPari.length - 1; indice >= 0; indice--) {
      if (couponPari[indice].identifiantMatch === identifiantMatch) couponPari.splice(indice, 1);
    }

    const libelle = typePari === 'equipeA' ? rencontre.equipeA : typePari === 'equipeB' ? rencontre.equipeB : 'Match nul';
    couponPari.push({
      identifiantMatch: identifiantMatch,
      typePari: typePari,
      libelleMatch: rencontre.equipeA + ' vs ' + rencontre.equipeB,
      libelleChoix: libelle,
      cote: parseFloat(rencontre.cotes[typePari])
    });
    afficherNotification('Ajouté : ' + rencontre.equipeA + ' vs ' + rencontre.equipeB + ' → ' + libelle);
  }

  actualiserMatchs();
  actualiserCoupon();
}

function actualiserCoupon() {
  const conteneur = document.getElementById('listeCoupon');

  if (couponPari.length === 0) {
    conteneur.innerHTML = '<p style="color:#8896a8;text-align:center;padding:15px 0">Coupon vide.</p>';
  } else {
    conteneur.innerHTML = '';
    for (let indice = 0; indice < couponPari.length; indice++) {
      const element = couponPari[indice];
      conteneur.innerHTML += '<div class="selection-coupon">' +
        '<div class="infos-selection">' +
          '<div class="titre-selection">' + element.libelleMatch + '</div>' +
          '<div class="choix-selection">' + element.libelleChoix + '</div>' +
        '</div>' +
        '<span class="cote-selection">' + element.cote + '</span>' +
        '<button data-retrait="' + indice + '" aria-label="Retirer cette sélection">Retirer</button>' +
      '</div>';
    }

    const boutonsRetrait = conteneur.querySelectorAll('button');
    for (let indice = 0; indice < boutonsRetrait.length; indice++) {
      boutonsRetrait[indice].onclick = function() {
        const indice = parseInt(this.dataset.retrait);
        couponPari.splice(indice, 1);
        actualiserMatchs();
        actualiserCoupon();
      };
    }
  }

  document.getElementById('nombreSelections').textContent = couponPari.length;

  let coteTotale = 1;
  for (let indice = 0; indice < couponPari.length; indice++) {
    coteTotale = coteTotale * couponPari[indice].cote;
  }

  document.getElementById('coteTotale').textContent = couponPari.length ? coteTotale.toFixed(2) : '-';
  actualiserGainPotentiel();
}

function actualiserGainPotentiel() {
  const mise = parseFloat(document.getElementById('champMise').value) || 0;
  let coteTotale = 1;
  for (let indice = 0; indice < couponPari.length; indice++) coteTotale = coteTotale * couponPari[indice].cote;
  document.getElementById('gainPotentiel').textContent = formaterNombre(mise * coteTotale);
}

document.getElementById('champMise').oninput = actualiserGainPotentiel;

// Validation du pari
document.getElementById('boutonValiderPari').onclick = function() {
  const messagePari = document.getElementById('messagePari');
  messagePari.textContent = '';

  if (couponPari.length === 0) {
    messagePari.textContent = 'Coupon vide.';
    messagePari.style.color = '#d32f2f';
    return;
  }

  const mise = parseFloat(document.getElementById('champMise').value);
  if (!mise || mise <= 0) {
    messagePari.textContent = 'Mise invalide.';
    messagePari.style.color = '#d32f2f';
    return;
  }

  if (mise > creditsFictifs) {
    messagePari.textContent = 'Crédits insuffisants.';
    messagePari.style.color = '#d32f2f';
    return;
  }

  creditsFictifs = creditsFictifs - mise;
  actualiserCredits();

  let coteTotale = 1;
  for (let indice = 0; indice < couponPari.length; indice++) coteTotale = coteTotale * couponPari[indice].cote;

  const nouveauPari = {
    identifiant: Date.now(),
    selections: couponPari.slice(), // Copie les sélections du coupon
    mise: mise,
    coteTotale: coteTotale,
    gainPotentiel: mise * coteTotale,
    statut: 'En attente',
    gain: 0
  };
  paris.push(nouveauPari);
  couponPari = [];

  actualiserTout();

  messagePari.textContent = 'Pari validé !';
  messagePari.style.color = '#2a9d8f';
  afficherNotification('Pari validé - résultats bientôt…', 'information');

  setTimeout(function() { determinerPari(nouveauPari.identifiant); }, 5000 + Math.random() * 4000);
};

function determinerPari(identifiantPari) {
  const pari = paris.find(function(pari) { return pari.identifiant === identifiantPari; });
  if (!pari) return;

  if (Math.random() < 0.45) {
    pari.statut = 'Gagné';
    pari.gain = pari.gainPotentiel;
    creditsFictifs = creditsFictifs + pari.gainPotentiel;
    afficherNotification('Pari gagné : +' + formaterNombre(pari.gainPotentiel) + ' crédits !');
  } else {
    pari.statut = 'Perdu';
    afficherNotification('Pari perdu. Continuez !', 'erreur');
  }

  actualiserCredits();
  actualiserResultats();
}

// Affichage de l'historique
function actualiserResultats() {
  const element = document.getElementById('listeResultats');

  if (paris.length === 0) {
    element.innerHTML = '<div class="panneau" style="text-align:center;color:#8896a8;padding:30px">Aucun pari pour le moment.</div>';
    return;
  }

  element.innerHTML = '';
  const parisInverses = paris.slice().reverse();

  for (let indice = 0; indice < parisInverses.length; indice++) {
    const pari = parisInverses[indice];
    let classeCSS = 'en-attente';
    if (pari.statut === 'Gagné') classeCSS = 'gagne';
    if (pari.statut === 'Perdu') classeCSS = 'perdu';

    let message = '';
    if (pari.statut === 'Gagné') message = 'Félicitations ! Vous avez gagné ' + formaterNombre(pari.gain) + ' crédits.';
    else if (pari.statut === 'Perdu') message = 'Dommage. Ne vous découragez pas !';
    else message = 'Pari en attente…';

    let htmlSelections = '';
    for (let indiceInterne = 0; indiceInterne < pari.selections.length; indiceInterne++) {
      const selection = pari.selections[indiceInterne];
      htmlSelections += '<div class="selection-resultat">' + selection.libelleMatch + ' - <strong>' + selection.libelleChoix + '</strong> (cote ' + selection.cote + ')</div>';
    }

    element.innerHTML += '<div class="element-resultat ' + classeCSS + '">' +
      '<div class="entete-resultat">' +
        '<span>Pari #' + String(pari.identifiant).slice(-6) + '</span>' +
        '<span class="statut-resultat ' + classeCSS + '">' + pari.statut + '</span>' +
      '</div>' +
      htmlSelections +
      '<div class="pied-resultat">' +
        '<span>Mise : ' + formaterNombre(pari.mise) + '</span>' +
        '<span>Cote : ' + pari.coteTotale.toFixed(2) + '</span>' +
        '<span>Gain : ' + formaterNombre(pari.gain) + '</span>' +
      '</div>' +
      '<div class="message-resultat ' + classeCSS + '">' + message + '</div>' +
    '</div>';
  }
}

// Affichage des combinés
function actualiserCombines() {
  const element = document.getElementById('listeCombines');
  element.innerHTML = '';

  for (let indice = 0; indice < combines.length; indice++) {
    const combine = combines[indice];
    let htmlSelectionsCombine = '';
    for (let indiceInterne = 0; indiceInterne < combine.selections.length; indiceInterne++) {
      htmlSelectionsCombine += '<div class="selection-combine">' + combine.selections[indiceInterne].libelle + '</div>';
    }

    element.innerHTML += '<div class="combine">' +
      '<div class="titre-combine">Combiné #' + (indice + 1) + '</div>' +
      htmlSelectionsCombine +
      '<div class="pied-combine">' +
        '<span class="cote-combine">× ' + combine.coteTotale + '</span>' +
        '<button class="bouton-ajout-combine" data-combine="' + indice + '">Ajouter</button>' +
      '</div>' +
    '</div>';
  }

  const boutonsAjout = document.querySelectorAll('.bouton-ajout-combine');
  for (let indice = 0; indice < boutonsAjout.length; indice++) {
    boutonsAjout[indice].onclick = function() {
      const indiceCombine = parseInt(this.dataset.combine);
      const combine = combines[indiceCombine];

      couponPari = [];
      for (let indiceInterne = 0; indiceInterne < combine.selections.length; indiceInterne++) {
        const selection = combine.selections[indiceInterne];
        const rencontre = matchs.find(function(element) { return element.identifiant === selection.identifiantMatch; });
        const libelle = selection.typePari === 'equipeA' ? rencontre.equipeA : selection.typePari === 'equipeB' ? rencontre.equipeB : 'Match nul';
        couponPari.push({
          identifiantMatch: rencontre.identifiant,
          typePari: selection.typePari,
          libelleMatch: rencontre.equipeA + ' vs ' + rencontre.equipeB,
          libelleChoix: libelle,
          cote: parseFloat(rencontre.cotes[selection.typePari])
        });
      }
      actualiserMatchs();
      actualiserCoupon();
      afficherNotification('Combiné #' + (indiceCombine + 1) + ' ajouté.');
    };
  }
}

// Gestion des crédits
function actualiserCredits() {
  document.getElementById('creditsAffiches').textContent = formaterNombre(creditsFictifs) + ' crédits';
}

// Simulation des matchs et des scores
function lancerSimulation() {
  setInterval(function() {
    const maintenant = Date.now();
    let aChange = false;

    for (let indice = 0; indice < matchs.length; indice++) {
      const rencontre = matchs[indice];

      if (rencontre.statut === 'À venir' && maintenant >= rencontre.heureDebut) {
        rencontre.statut = 'En cours';
        aChange = true;
        afficherNotification('Coup d\'envoi : ' + rencontre.equipeA + ' vs ' + rencontre.equipeB, 'information');
      }

      if (rencontre.statut === 'En cours' && maintenant >= rencontre.heureDebut + rencontre.duree) {
        rencontre.statut = 'Terminé';
        rencontre.scoreA = nombreAleatoire(0, 5);
        rencontre.scoreB = nombreAleatoire(0, 5);
        aChange = true;
      }

      if (rencontre.statut === 'En cours' && Math.random() < 0.25) {
        if (Math.random() < 0.5) rencontre.scoreA++; else rencontre.scoreB++;
        aChange = true;
      }
    }

    if (aChange) {
      if (!document.getElementById('onglet-accueil').classList.contains('masque')) actualiserMatchs();
      if (!document.getElementById('onglet-direct').classList.contains('masque')) actualiserDirect();
    }
  }, 1000);
}

// Filtres des matchs
function initialiserFiltres() {
  const boutonsSport = document.querySelectorAll('#filtresSport .filtre-rapide');
  for (let indice = 0; indice < boutonsSport.length; indice++) {
    boutonsSport[indice].onclick = function() {
      for (let indiceInterne = 0; indiceInterne < boutonsSport.length; indiceInterne++) boutonsSport[indiceInterne].classList.remove('actif');
      this.classList.add('actif');
      filtresActuels.sport = this.dataset.sport;

      // Met à jour les compétitions disponibles
      const listeCompetitions = document.getElementById('filtreCompetition');
      let competitions = [];
      if (filtresActuels.sport === 'all') {
        for (const selection in competitionsParSport) competitions = competitions.concat(competitionsParSport[selection]);
      } else {
        competitions = competitionsParSport[filtresActuels.sport];
      }
      // Évite les compétitions en double
      const competitionsUniques = [];
      for (let indiceCompetition = 0; indiceCompetition < competitions.length; indiceCompetition++) {
        if (competitionsUniques.indexOf(competitions[indiceCompetition]) === -1) competitionsUniques.push(competitions[indiceCompetition]);
      }

      listeCompetitions.innerHTML = '<option value="all">Toutes compétitions</option>';
      for (let indiceCompetition = 0; indiceCompetition < competitionsUniques.length; indiceCompetition++) {
        listeCompetitions.innerHTML += '<option value="' + competitionsUniques[indiceCompetition] + '">' + competitionsUniques[indiceCompetition] + '</option>';
      }
      filtresActuels.competition = 'all';
      actualiserMatchs();
    };
  }

  document.getElementById('filtreCompetition').onchange = function() {
    filtresActuels.competition = this.value;
    actualiserMatchs();
  };

  document.getElementById('filtreStatut').onchange = function() {
    filtresActuels.statut = this.value;
    actualiserMatchs();
  };
}

// Navigation entre les onglets
function initialiserOnglets() {
  const onglets = document.querySelectorAll('.bouton-onglet');
  for (let indice = 0; indice < onglets.length; indice++) {
    onglets[indice].onclick = function() {
      for (let indiceInterne = 0; indiceInterne < onglets.length; indiceInterne++) onglets[indiceInterne].classList.remove('actif');
      this.classList.add('actif');

      const nom = this.dataset.onglet;
      document.getElementById('onglet-accueil').classList.add('masque');
      document.getElementById('onglet-direct').classList.add('masque');
      document.getElementById('onglet-historique').classList.add('masque');
      document.getElementById('onglet-' + nom).classList.remove('masque');

      if (nom === 'direct') actualiserDirect();
      if (nom === 'historique') actualiserResultats();
    };
  }
}

// Affichage des matchs en direct
function actualiserDirect() {
  const element = document.getElementById('listeDirect');
  const matchsEnDirect = matchs.filter(function(rencontre) { return rencontre.statut === 'En cours'; });

  if (matchsEnDirect.length === 0) {
    element.innerHTML = '<div class="panneau" style="text-align:center;color:#8896a8;padding:30px">Aucun match en direct pour le moment.</div>';
    return;
  }

  element.innerHTML = '';
  for (let indice = 0; indice < matchsEnDirect.length; indice++) {
    const rencontre = matchsEnDirect[indice];
    const classeActive = identifiantMatchDirect === rencontre.identifiant ? 'actif' : '';
    element.innerHTML += '<div class="element-direct ' + classeActive + '" data-direct="' + rencontre.identifiant + '">' +
      '<div>' +
        '<div class="equipes-direct">' + rencontre.equipeA + ' vs ' + rencontre.equipeB + '</div>' +
        '<div style="font-size:0.75em;color:#8896a8">' + rencontre.competition + '</div>' +
      '</div>' +
      '<div class="score-element-direct">' + rencontre.scoreA + ' - ' + rencontre.scoreB + '</div>' +
    '</div>';
  }

  const elements = element.querySelectorAll('.element-direct');
  for (let indice = 0; indice < elements.length; indice++) {
    elements[indice].onclick = function() {
      identifiantMatchDirect = parseInt(this.dataset.direct);
      const rencontre = matchs.find(function(element) { return element.identifiant === identifiantMatchDirect; });
      actualiserLecteurDirect(rencontre);
      actualiserDirect();
    };
  }

  // Sélectionne le premier match automatiquement
  if (!identifiantMatchDirect && matchsEnDirect.length > 0) {
    identifiantMatchDirect = matchsEnDirect[0].identifiant;
    const rencontre = matchsEnDirect[0];
    actualiserLecteurDirect(rencontre);
    actualiserDirect();
  }
}

function actualiserLecteurDirect(rencontre) {
  const urlVideo = obtenirUrlVideoMatch(rencontre);
  const lecteurIntegre = document.getElementById('lecteurDirect');
  const lienRecherche = document.getElementById('lienRechercheDirect');

  if (urlVideo) {
    lecteurIntegre.src = urlVideo + '?autoplay=1';
    lienRecherche.style.display = 'none';
  } else {
    lecteurIntegre.removeAttribute('src');
    lienRecherche.href = obtenirUrlRechercheMatch(rencontre);
    lienRecherche.style.display = 'inline-block';
  }

  document.getElementById('titreDirect').textContent =
    rencontre.equipeA + ' vs ' + rencontre.equipeB + ' - ' + rencontre.scoreA + ' - ' + rencontre.scoreB;
}

// Lecture des vidéos de match
function initialiserLecteurVideo() {
  document.getElementById('boutonFermerVideo').onclick = function() {
    document.getElementById('fenetreVideo').classList.add('masque');
    document.getElementById('lecteurVideo').src = '';
    document.getElementById('lienRechercheVideo').style.display = 'none';
  };
}

function ouvrirVideo(identifiantMatch) {
  const rencontre = matchs.find(function(element) { return element.identifiant === identifiantMatch; });
  if (!rencontre) return;

  const urlVideo = obtenirUrlVideoMatch(rencontre);
  const lecteurIntegre = document.getElementById('lecteurVideo');
  const lienRecherche = document.getElementById('lienRechercheVideo');
  if (urlVideo) {
    lecteurIntegre.style.display = 'block';
    lecteurIntegre.src = urlVideo + '?autoplay=1&rel=0';
    lienRecherche.style.display = 'none';
  } else {
    lecteurIntegre.removeAttribute('src');
    lecteurIntegre.style.display = 'none';
    lienRecherche.href = obtenirUrlRechercheMatch(rencontre);
    lienRecherche.style.display = 'inline-block';
  }
  document.getElementById('titreVideo').textContent = rencontre.equipeA + ' vs ' + rencontre.equipeB + ' - Résumé';
  document.getElementById('fenetreVideo').classList.remove('masque');
}

// Assistant de discussion
const contenuAssistantSecours = {
  messageInitial: 'Bonjour. Je suis l\'assistant Efbet. Je peux répondre à vos questions sur les cotes, les combinés, l\'âge minimum et le jeu responsable.',
  reponses: [
    { motsCles: ['bonjour', 'salut', 'hello'], texte: 'Bonjour. Comment puis-je vous aider ? Je peux expliquer les cotes, les combinés et le jeu responsable.' },
    { motsCles: ['age', 'âge', '18', 'mineur'], texte: 'Efbet est réservé aux personnes majeures (18 ans et +). La date de naissance est vérifiée à la première visite.' },
    { motsCles: ['cote', 'odd'], texte: 'Une cote multipliée par votre mise donne votre gain potentiel. Exemple : cote 2.50 sur 10 crédits donne 25 crédits.' },
    { motsCles: ['combin'], texte: 'Un combiné regroupe plusieurs paris. Les cotes se multiplient. Il faut que tous les paris gagnent.' },
    { motsCles: ['respons', 'limite', 'dépendance'], texte: 'Les paris comportent des risques de dépendance. Jouez avec modération. Les crédits utilisés ici sont fictifs.' },
    { motsCles: ['crédit', 'solde'], texte: 'Vous avez {{credits}} crédits fictifs. Aucun argent réel.' },
    { motsCles: ['pari', 'paris'], texte: 'Pour parier : 1) Choisissez un match 2) Cliquez sur une cote 3) Vérifiez le coupon 4) Entrez la mise 5) Validez.' },
    { motsCles: ['direct', 'vidéo'], texte: 'Cliquez sur Live pour voir les matchs en direct, ou sur Regarder le résumé sur un match.' },
    { motsCles: ['merci'], texte: 'Avec plaisir. Bonne chance !' }
  ],
  reponseInconnue: 'Je n\'ai pas compris. Essayez : "les cotes", "combiné", "âge minimum", "jeu responsable".'
};

async function chargerContenuAssistant() {
  if (window.location.protocol === 'file:') {
    return contenuAssistantSecours;
  }

  const reponse = await fetch('../js/chat.json');
  if (!reponse.ok) {
    throw new Error('Impossible de charger js/chat.json : ' + reponse.status);
  }

  const contenu = await reponse.json();
  if (
    typeof contenu.messageInitial !== 'string' ||
    typeof contenu.reponseInconnue !== 'string' ||
    !Array.isArray(contenu.reponses) ||
    contenu.reponses.some(function(element) {
      return !element ||
        typeof element !== 'object' ||
        !Array.isArray(element.motsCles) ||
        typeof element.texte !== 'string' ||
        element.motsCles.some(function(mot) { return typeof mot !== 'string'; });
    })
  ) {
    throw new Error('Le contenu de js/chat.json est invalide.');
  }

  return contenu;
}

function initialiserAssistant() {
  const boutonBascule = document.getElementById('boutonAssistant');
  const panneau = document.getElementById('panneauAssistant');
  const formulaire = document.getElementById('formulaireAssistant');
  const champSaisie = document.getElementById('champMessageAssistant');
  const messages = document.getElementById('messagesAssistant');
  const chargementReponses = chargerContenuAssistant().then(function(contenu) {
    ajouterMessageDiscussion(contenu.messageInitial, 'assistant');
    return contenu;
  }).catch(function(erreur) {
    console.error(erreur);
    ajouterMessageDiscussion('Les réponses de l’assistant sont indisponibles pour le moment.', 'assistant');
    return null;
  });

  boutonBascule.onclick = function() { panneau.classList.toggle('masque'); };
  document.getElementById('boutonFermerAssistant').onclick = function() { panneau.classList.add('masque'); };

  // Gère les suggestions rapides
  const suggestions = document.querySelectorAll('.suggestions-assistant button');
  for (let indice = 0; indice < suggestions.length; indice++) {
    suggestions[indice].onclick = function() {
      champSaisie.value = this.dataset.question;
      formulaire.dispatchEvent(new Event('submit', { cancelable: true }));
    };
  }

  formulaire.onsubmit = async function(evenement) {
    evenement.preventDefault();
    const question = champSaisie.value.trim();
    if (!question) return;

    ajouterMessageDiscussion(question, 'utilisateur');
    champSaisie.value = '';

    // Attend un instant avant la réponse
    setTimeout(async function() {
      const contenu = await chargementReponses;
      if (!contenu) return;
      const reponse = obtenirReponseAssistant(question, contenu);
      ajouterMessageDiscussion(reponse, 'assistant');
    }, 500);
  };

  function ajouterMessageDiscussion(texte, auteur) {
    const element = document.createElement('div');
    element.className = 'message-discussion ' + auteur;
    element.textContent = texte;
    messages.appendChild(element);
    messages.scrollTop = messages.scrollHeight;
  }
}

function obtenirReponseAssistant(texte, contenu) {
  const texteMinuscule = texte.toLowerCase();

  for (let indice = 0; indice < contenu.reponses.length; indice++) {
    const element = contenu.reponses[indice];
    if (element.motsCles.some(function(mot) { return texteMinuscule.indexOf(mot) !== -1; })) {
      return element.texte.replace('{{credits}}', formaterNombre(creditsFictifs));
    }
  }

  return contenu.reponseInconnue;
}
