npm install @codetrix-studio/capacitor-google-auth --legacy-peer-deps


# ✅ CORRECTION - Installation Google Auth

## ❌ ERREUR

Le package `@capacitor/google-auth` n'existe pas !

## ✅ SOLUTION

Utilise le bon package :

```bash
npm install @codetrix-studio/capacitor-google-auth
```

---

## 📦 COMMANDES CORRECTES

### Installation Complète

```bash
# 1. Firebase
npm install firebase

# 2. Google Auth (BON PACKAGE)
npm install @codetrix-studio/capacitor-google-auth

# 3. Camera
npm install @capacitor/camera

# 4. Geolocation
npm install @capacitor/geolocation

# 5. Synchroniser
npx cap sync
```

### Ou en Une Seule Commande

```bash
npm install firebase @codetrix-studio/capacitor-google-auth @capacitor/camera @capacitor/geolocation && npx cap sync
```

---

## 🔍 VÉRIFICATION

Après installation, vérifie que tout est bien installé :

```bash
npm list @codetrix-studio/capacitor-google-auth
```

Tu devrais voir :
```
mon-app-mignonne@0.0.1
└── @codetrix-studio/capacitor-google-auth@5.4.0
```

---

## 📝 PACKAGE.JSON

Après installation, ton `package.json` devrait contenir :

```json
{
  "dependencies": {
    "@capacitor/android": "^6.0.0",
    "@capacitor/app": "^6.0.0",
    "@capacitor/camera": "^6.0.0",
    "@capacitor/core": "^6.0.0",
    "@capacitor/geolocation": "^6.0.0",
    "@capacitor/haptics": "^6.0.0",
    "@capacitor/keyboard": "^6.0.0",
    "@capacitor/status-bar": "^6.0.0",
    "@codetrix-studio/capacitor-google-auth": "^5.4.0",
    "@ionic/vue": "^8.0.0",
    "@ionic/vue-router": "^8.0.0",
    "firebase": "^10.7.1",
    "ionicons": "^7.2.1",
    "leaflet": "^1.9.4",
    "vue": "^3.4.0",
    "vue-router": "^4.2.5"
  }
}
```

---

## 🔧 SI PROBLÈME PERSISTE

### Nettoyer le Cache NPM

```bash
# Nettoyer le cache
npm cache clean --force

# Supprimer node_modules
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

### Vérifier la Connexion NPM

```bash
# Vérifier la connexion au registry
npm ping

# Vérifier la configuration
npm config list
```

---

## 📚 DOCUMENTATION OFFICIELLE

- **Package GitHub** : https://github.com/CodetrixStudio/CapacitorGoogleAuth
- **NPM** : https://www.npmjs.com/package/@codetrix-studio/capacitor-google-auth

---

## 🚀 PROCHAINES ÉTAPES

Après installation :

1. ✅ `npx cap sync`
2. ✅ Configurer Firebase (voir GOOGLE-AUTH-QUICK.md)
3. ✅ Modifier les fichiers de config
4. ✅ Build et tester

---

**C'est corrigé ! 🎉**