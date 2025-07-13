#!/bin/bash

# Script de déploiement pour BudgetIT
# Version 1.0.0

echo "🚀 Déploiement de BudgetIT v1.0.0"
echo "=================================="

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier la version de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ requise. Version actuelle: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) détecté"

# Nettoyer les anciens builds
echo "🧹 Nettoyage des anciens builds..."
rm -rf dist
rm -rf node_modules

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

# Créer le build de production
echo "🔨 Création du build de production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

# Vérifier que le build a été créé
if [ ! -d "dist" ]; then
    echo "❌ Le dossier dist n'a pas été créé"
    exit 1
fi

echo "✅ Build créé avec succès dans le dossier dist/"

# Afficher les informations du build
echo ""
echo "📊 Informations du build:"
echo "   - Taille du dossier dist: $(du -sh dist | cut -f1)"
echo "   - Fichiers créés:"
ls -la dist/

echo ""
echo "🎉 Déploiement terminé avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Le dossier 'dist/' contient votre application prête à déployer"
echo "   2. Vous pouvez déployer ce dossier sur:"
echo "      - Netlify (glissez-déposez le dossier dist/)"
echo "      - Vercel (connectez votre repo)"
echo "      - GitHub Pages (uploadez le contenu de dist/)"
echo "      - Serveur web classique (copiez le contenu de dist/)"
echo ""
echo "   3. Pour tester localement:"
echo "      npm run preview"
echo ""
echo "📚 Consultez le README.md pour plus d'informations sur le déploiement" 