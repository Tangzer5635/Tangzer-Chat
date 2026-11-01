# Guide de test

Tout ce qu'il y a à essayer, dans l'ordre des phases. Prévoir **deux navigateurs**
(ou une fenêtre normale + une fenêtre privée) pour jouer deux personnes à la fois.

## 0. Lancer

```bash
cp .env.example .env      # changer JWT_SECRET
docker compose up -d --build
```

Ouvrir **https://localhost** et accepter le certificat auto-signé.
Depuis un téléphone ou un autre PC du réseau : mettre `TLS_EXTRA_SAN=IP:<ip-du-pc>`
dans `.env`, supprimer le dossier `certs/`, relancer, puis ouvrir `https://<ip-du-pc>`.

Comptes de démo : `admin/admin`, `tanguy/1234`, `pigloo/127845`, `user/user`.

## 1. Comptes
- [ ] Créer un compte depuis « S'inscrire », puis F5 : on reste connecté.
- [ ] Mauvais mot de passe → message d'erreur.

## 2. Serveurs et salons
- [ ] Tout le monde arrive sur le serveur public par défaut (**Préau** sur une nouvelle installation,
  l'ancien serveur garde son nom sur une base existante) : #général, #dev, #wb47…
- [ ] « + » à côté de « Mes serveurs » (colonne de gauche) : créer un serveur (emoji, couleur, privé).
- [ ] Bouton « … » à côté du nom du serveur ouvert : inviter → copier le lien → l'ouvrir dans l'autre navigateur → accepter.
- [ ] Liste des membres (bouton en haut à droite du salon) : nommer admin, expulser.
- [ ] Rendre le serveur public → il apparaît dans « Explorer les serveurs ».
- [ ] Créer / renommer / supprimer un salon (roue dentée au survol ou au focus du salon).

## 3. Messages
- [ ] `**gras**`, `*italique*`, `||spoiler||`, `` `code` ``, une mention `@tanguy`.
- [ ] Survol d'un message : réagir, répondre, modifier, supprimer.
- [ ] Flèche ↑ dans la zone vide : modifier son dernier message.
- [ ] Coller un lien d'invitation : une carte « Rejoindre » apparaît.
- [ ] Salon non lu en gras, compteur sur une mention, titre de l'onglet « (1) Préau ».

## 4. Messages privés
- [ ] Fiche d'un membre → « Message privé », ou « Messages privés » → « Nouveau message »,
  ou la recherche (Ctrl+K) → « Écrire à ».
- [ ] Notification avec aperçu chez l'autre, « ✓✓ Vu » quand il a lu.

## 5. Photos
- [ ] Bouton +, glisser-déposer, ou coller une capture d'écran (jusqu'à 4).
- [ ] Clic sur une image : visionneuse (← → Échap).

## 6. Présence
- [ ] Clic sur son nom en haut à droite : En ligne / Inactif / Ne pas déranger / Invisible + statut personnalisé.
- [ ] Fermer l'autre navigateur : la personne passe « Hors ligne ».

## 7–8. Appels (HTTPS obligatoire pour le micro et la caméra)
- [ ] Clic sur le salon **vocal** : on y entre, l'autre le voit sous le salon dans sa navigation.
- [ ] Micro, casque, caméra, partage d'écran, raccrocher.
- [ ] Clic (ou Entrée) sur une tuile vidéo : agrandie ; bouton « plein écran » au survol.
- [ ] En MP, bouton téléphone : l'autre reçoit « … t'appelle » avec sonnerie → Accepter ou Refuser (Échap).

> Les appels entre réseaux différents (4G…) peuvent nécessiter le relais TURN (voir README).

## 9. Personnalisation
- [ ] Menu du compte (en haut à droite) → Paramètres → **Mon profil** : photo, nom affiché, bio,
  bannière (les autres voient le changement en direct).
- [ ] **Apparence** : thème clair, sombre ou selon l'appareil (essayer de changer le réglage
  clair/sombre de l'ordinateur), taille du texte, mode compact.
- [ ] **Notifications** : notifications du bureau et sons.
- [ ] **Voix et vidéo** : choisir le micro/la caméra, tester le micro.
- [ ] **Mon compte** : changer de mot de passe.
- [ ] Paramètres du serveur : utiliser une image comme icône.
- [ ] Sur téléphone : bouton « Navigation » en haut à gauche pour ouvrir les serveurs et les salons.

## 10. Accessibilité (au clavier, sans souris)
- [ ] Sur l'accueil des messages privés (F5), Tab : « Aller au contenu » apparaît en premier et mène
  au contenu. (Dans un salon, le curseur est déjà dans la zone de saisie.)
- [ ] Ctrl+K : la recherche s'ouvre ; taper « gén » puis Entrée sur le salon.
- [ ] Tab jusqu'au fil de messages, puis flèches haut/bas : chaque message reçoit le focus,
  ses actions apparaissent, Tab les atteint ; Début/Fin vont au premier/dernier message.
- [ ] Ouvrir une fenêtre (créer un serveur) : Tab reste dans la fenêtre, Échap la ferme et le focus
  revient sur le bouton.
- [ ] Paramètres : passer d'un onglet à l'autre avec les flèches.
- [ ] Avec un lecteur d'écran (NVDA, VoiceOver) : un nouveau message d'un autre membre est annoncé.
- [ ] Système en « réduire les animations » : plus aucune animation.
