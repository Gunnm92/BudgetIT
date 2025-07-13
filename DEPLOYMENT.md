# Guide de Déploiement Rapide - BudgetIT

## 🚀 Déploiement en 5 minutes

### Option 1: Netlify (Recommandé - Gratuit)

1. **Forkez le projet** sur GitHub
2. **Connectez-vous** à [Netlify](https://netlify.com)
3. **Cliquez sur "New site from Git"**
4. **Sélectionnez votre repository**
5. **Configurez le build** :
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Cliquez sur "Deploy site"**

✅ **Votre application sera en ligne en 2-3 minutes !**

### Option 2: Vercel (Recommandé - Gratuit)

1. **Forkez le projet** sur GitHub
2. **Connectez-vous** à [Vercel](https://vercel.com)
3. **Cliquez sur "New Project"**
4. **Importez votre repository**
5. **Vercel détectera automatiquement** la configuration
6. **Cliquez sur "Deploy"**

✅ **Votre application sera en ligne en 1-2 minutes !**

### Option 3: GitHub Pages

1. **Forkez le projet** sur GitHub
2. **Allez dans Settings > Pages**
3. **Source: Deploy from a branch**
4. **Branch: main, folder: / (root)**
5. **Ajoutez un workflow GitHub Actions** (voir ci-dessous)

### Option 4: Serveur classique

```bash
# 1. Clonez le projet
git clone [URL_DU_REPO]
cd BudgetIT

# 2. Installez les dépendances
npm install

# 3. Créez le build
npm run build

# 4. Copiez le contenu de dist/ sur votre serveur web
```

## 🐳 Déploiement avec Docker

### Docker simple

```bash
# 1. Clonez le projet
git clone [URL_DU_REPO]
cd BudgetIT

# 2. Construisez l'image
docker build -t budgetit .

# 3. Lancez le conteneur
docker run -p 3000:80 budgetit
```

### Docker Compose

```bash
# 1. Clonez le projet
git clone [URL_DU_REPO]
cd BudgetIT

# 2. Lancez avec docker-compose
docker-compose up -d

# 3. Accédez à http://localhost:3000
```

## 📋 Configuration GitHub Actions (pour GitHub Pages)

Créez le fichier `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 🔧 Variables d'environnement

Créez un fichier `.env` à la racine :

```env
VITE_APP_TITLE=BudgetIT
VITE_APP_VERSION=1.0.0
```

## 📊 Vérification du déploiement

Après le déploiement, vérifiez que :

1. ✅ **L'application se charge** sans erreur
2. ✅ **La navigation fonctionne** (Dashboard, Budgets, Dépenses, etc.)
3. ✅ **Les données se sauvegardent** (testez en créant un budget)
4. ✅ **L'import Excel fonctionne** (testez avec un petit fichier)
5. ✅ **L'interface est responsive** (testez sur mobile)

## 🐛 Dépannage

### Erreur de build
```bash
# Nettoyez et réinstallez
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erreur 404 sur les routes
- Vérifiez que la configuration de redirection est correcte
- Pour Netlify/Vercel, vérifiez le fichier de configuration

### Problèmes de performance
- Vérifiez que la compression gzip est activée
- Vérifiez les headers de cache

## 📞 Support

Si vous rencontrez des problèmes :

1. **Consultez les logs** de déploiement
2. **Vérifiez la console** du navigateur
3. **Ouvrez une issue** sur GitHub
4. **Consultez la documentation** complète dans README.md

---

**BudgetIT v1.0.0** - Prêt pour la production ! 🎉 