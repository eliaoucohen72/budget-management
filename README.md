# Budget Management

Application de gestion budgétaire familiale — React + TypeScript + Tailwind CSS.

## Lancer en développement

### Web (navigateur)
```bash
npm run dev
```

### Electron (application desktop)
```bash
npm run dev:electron
```

## Créer l'installeur Windows

```bash
npm run build:electron
```

Le build génère deux choses dans le dossier `release/` :

| Fichier | Description |
|---|---|
| `Budget Management Setup X.X.X.exe` | **Installeur complet** — autonome, déplaçable, envoyable par mail ou clé USB |
| `win-unpacked/Budget Management.exe` | Exécutable portable — nécessite le dossier `win-unpacked/` entier pour fonctionner |

> Pour distribuer l'application, utilise uniquement l'installeur à la racine de `release/`.
