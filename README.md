# Nourriture Express

Site statique de vente de nourriture en ligne (HTML, CSS, JavaScript), hébergeable sur GitHub Pages.

## Fonctionnalités
- Catalogue de 24 produits avec catégories et recherche
- Panier (quantités, suppression, total, livraison gratuite dès 200 MAD), sauvegardé dans le navigateur
- Formulaire de commande avec validation
- Récapitulatif de commande et envoi par WhatsApp

## À personnaliser
Dans `script.js`, en haut du fichier :
- `WHATSAPP_NUMBER` : ton numéro au format international sans `+` (ex. `212612345678`)
- `PRODUCTS` : ajoute, modifie ou supprime des produits
- `FREE_DELIVERY_FROM` et `DELIVERY_FEE` : seuil et frais de livraison

## Remarque
C'est un site de démonstration sans serveur : les commandes ne sont pas enregistrées, elles sont envoyées par WhatsApp.
