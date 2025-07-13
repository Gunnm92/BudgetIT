# BudgetIT - Application de Gestion de Budget IT

## 📋 Description

BudgetIT est une application web moderne pour la gestion de budgets IT. Elle permet de gérer les budgets, dépenses, catégories et services avec une interface intuitive et des fonctionnalités avancées d'import/export.

## ✨ Fonctionnalités principales

### 🏠 Tableau de bord
- Vue d'ensemble des budgets et dépenses
- Graphiques et statistiques en temps réel
- Indicateurs de performance

### 💰 Gestion des budgets
- Création et modification de budgets
- Association par catégorie et service
- Recherche et filtrage avancés
- Gestion des dates et lieux

### 💸 Gestion des dépenses
- Enregistrement des dépenses
- Association aux budgets
- Tabs pour dépenses budgétées/non budgétées
- Statistiques détaillées

### 📊 Rapports
- Graphiques interactifs
- Analyses par période
- Export des données

### ⚙️ Paramètres
- Gestion des catégories et services
- Import/Export de données
- Import Excel avancé avec mapping flexible

## 🚀 Installation et déploiement

### Prérequis
- Node.js 16+ 
- npm ou yarn

### Installation locale

```bash
# Cloner le projet
git clone [URL_DU_REPO]
cd BudgetIT

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

### Build de production

```bash
# Créer le build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 📦 Déploiement

### Option 1: Déploiement statique (Recommandé)

Le build de production se trouve dans le dossier `dist/`. Vous pouvez déployer ce dossier sur :

- **Netlify** : Glissez-déposez le dossier `dist/`
- **Vercel** : Connectez votre repo et déployez automatiquement
- **GitHub Pages** : Uploadez le contenu du dossier `dist/`
- **Serveur web classique** : Copiez le contenu de `dist/` dans votre répertoire web

### Option 2: Serveur Node.js

```bash
# Installer serve globalement
npm install -g serve

# Servir l'application
serve -s dist -l 3000
```

### Option 3: Docker

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_APP_TITLE=BudgetIT
VITE_APP_VERSION=1.0.0
```

### Configuration Firebase (optionnel)

Si vous souhaitez utiliser Firebase pour l'authentification :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 📁 Structure du projet

```
BudgetIT/
├── dist/                   # Build de production
├── public/                 # Assets statiques
├── src/
│   ├── components/         # Composants réutilisables
│   ├── context/           # Contextes React (état global)
│   ├── pages/             # Pages de l'application
│   ├── App.jsx            # Composant principal
│   ├── main.jsx           # Point d'entrée
│   └── index.css          # Styles globaux
├── package.json           # Dépendances et scripts
├── vite.config.js         # Configuration Vite
├── tailwind.config.js     # Configuration Tailwind CSS
└── README.md              # Ce fichier
```

## 🎯 Utilisation

### Première utilisation

1. **Accédez à l'application** via votre navigateur
2. **Créez vos premières catégories** dans Paramètres > Gestion des catégories
3. **Ajoutez vos services** dans Paramètres > Gestion des services
4. **Créez vos premiers budgets** dans la section Budgets
5. **Enregistrez vos dépenses** dans la section Dépenses

### Import de données

#### Import de budgets
1. Allez dans **Paramètres > Import/Export des données**
2. Cliquez sur **"Importer des budgets Excel"**
3. Sélectionnez votre fichier Excel
4. Les budgets seront importés automatiquement

#### Import de dépenses (avancé)
1. Allez dans **Paramètres > Import/Export des données**
2. Cliquez sur **"Importer des dépenses"**
3. Configurez le mapping des colonnes
4. Mappez les catégories et services si nécessaire
5. Lancez l'import

### Export de données

1. Allez dans **Paramètres > Import/Export des données**
2. Cliquez sur **"Exporter les données"**
3. Téléchargez le fichier JSON avec toutes vos données

## 🛠️ Technologies utilisées

- **React 18** - Framework frontend
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS
- **React Router** - Navigation
- **Recharts** - Graphiques
- **XLSX** - Gestion des fichiers Excel
- **date-fns** - Manipulation des dates
- **Lucide React** - Icônes

## 📱 Compatibilité

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile responsive

## 🔒 Sécurité

- Données stockées localement (localStorage)
- Pas de transmission de données sensibles
- Validation des entrées utilisateur
- Protection contre les injections XSS

## 🐛 Dépannage

### Problèmes courants

#### L'application ne se lance pas
```bash
# Vérifiez la version de Node.js
node --version  # Doit être >= 16

# Réinstallez les dépendances
rm -rf node_modules package-lock.json
npm install
```

#### Erreur de build
```bash
# Nettoyez le cache
npm run build -- --force

# Ou supprimez le dossier dist
rm -rf dist
npm run build
```

#### Problèmes d'import Excel
- Vérifiez que le fichier est au format .xlsx ou .xls
- Assurez-vous que les colonnes correspondent au mapping
- Consultez la console pour les erreurs détaillées

## 📈 Performance

- **Taille du bundle** : ~1.1MB (334KB gzippé)
- **Temps de chargement** : < 2s sur connexion moyenne
- **Optimisations** : Code splitting, minification, compression

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Contactez l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Équipe** : BudgetIT Team 