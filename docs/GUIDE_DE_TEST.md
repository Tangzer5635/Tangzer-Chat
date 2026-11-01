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
- [ ] « + » dans le rail : créer un serveur (emoji, couleur, privé).
- [ ] Menu du serveur (clic sur son nom) : inviter → copier le lien → l'ouvrir dans l'autre navigateur → accepter.
- [ ] Liste des membres (👥) : nommer admin, expulser.
- [ ] Rendre le serveur public → il apparaît dans 🧭 Explorer.
- [ ] Créer / renommer / supprimer un salon (⚙ au survol du salon).

## 3. Messages
- [ ] `**gras**`, `*italique*`, `||spoiler||`, `` `code` ``, une mention `@tanguy`.
- [ ] Survol d'un message : réagir 😀, répondre ↩️, modifier ✏️, supprimer 🗑️.
- [ ] Flèche ↑ dans la zone vide : modifier son dernier message.
- [ ] Coller un lien d'invitation : une carte « Rejoindre » apparaît.
- [ ] Salon non lu en gras, badge rouge sur une mention, titre de l'onglet « (1) Préau ».

## 4. Messages privés
- [ ] Fiche d'un membre → « Message privé », ou logo Préau en haut du rail → « + ».
- [ ] Notification avec aperçu chez l'autre, « ✓✓ Vu » quand il a lu.

## 5. Photos
- [ ] Bouton +, glisser-déposer, ou coller une capture d'écran (jusqu'à 4).
- [ ] Clic sur une image : visionneuse (← → Échap).

## 6. Présence
- [ ] Clic sur son avatar en bas à gauche : En ligne / Inactif / Ne pas déranger / Invisible + statut personnalisé.
- [ ] Fermer l'autre navigateur : la personne passe « Hors ligne ».

## 7–8. Appels (HTTPS obligatoire pour le micro et la caméra)
- [ ] Clic sur 🔊 **vocal** : on entre dans le salon vocal, l'autre le voit dans la barre latérale.
- [ ] Micro 🎤, casque 🎧, caméra 📷, partage d'écran 🖥️, raccrocher.
- [ ] Clic sur une tuile vidéo : agrandie ; bouton ⛶ : plein écran.
- [ ] En MP, bouton 📞 : l'autre reçoit « … t'appelle » avec sonnerie → accepter ou refuser.

> Les appels entre réseaux différents (4G…) peuvent nécessiter le relais TURN (voir README).

## 9. Personnalisation
- [ ] ⚙️ en bas à gauche → **Mon profil** : photo, nom affiché, bio, bannière (les autres voient le changement en direct).
- [ ] **Apparence** : thème clair, sombre ou selon l'appareil (essayer de changer le réglage
  clair/sombre de l'ordinateur), taille du texte, mode compact.
- [ ] **Notifications** : notifications du bureau et sons.
- [ ] **Voix et vidéo** : choisir le micro/la caméra, tester le micro.
- [ ] **Mon compte** : changer de mot de passe.
- [ ] Paramètres du serveur : utiliser une image comme icône.
- [ ] Sur téléphone : bouton ☰ en haut à gauche pour ouvrir les salons.
