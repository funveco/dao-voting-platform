# 📤 Instrucciones: Subir a GitHub

## PASO 1: Inicializar Git Localmente (2 minutos)

```bash
# Navega al proyecto
cd /home/jav/apps/codecrypto/11.DAO-Voting-Platform

# Inicializar git
git init

# Configurar usuario (importante)
git config user.name "Tu Nombre"
git config user.email "tu.email@ejemplo.com"

# O globalmente (si prefieres):
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

---

## PASO 2: Agregar Archivos (1 minuto)

```bash
# Ver archivos que se agregarán
git status

# Agregar TODOS los archivos (respeta .gitignore)
git add .

# Ver archivos listos para commit
git status

# ✅ Deberías ver archivos en verde (staged)
```

---

## PASO 3: Primer Commit (1 minuto)

```bash
# Crear commit inicial
git commit -m "Initial commit: DAO Voting Platform

- Smart contracts (Foundry)
- Frontend (Next.js/React)
- Complete documentation
- Testing suite
- Production-ready code"
```

---

## PASO 4: Crear Repositorio en GitHub (3 minutos)

### Opción A: GitHub Web UI (Recomendado)

1. Ve a https://github.com/new
2. Llena los detalles:
   ```
   Repository name:     dao-voting-platform
   Description:         DAO Voting Platform - Smart contracts + Frontend
   Visibility:          Public (o Private si prefieres)
   ```
3. **NO** inicialices con README, .gitignore, ni LICENSE (ya tenemos)
4. Click en "Create repository"
5. **Copia la URL del repositorio** (ej: https://github.com/tu-usuario/dao-voting-platform.git)

### Opción B: GitHub CLI

```bash
# Si tienes gh CLI instalado
gh repo create dao-voting-platform --source=. --remote=origin --public
```

---

## PASO 5: Conectar GitHub al Local (2 minutos)

```bash
# Reemplaza CON TU URL del paso 4
git remote add origin https://github.com/TU_USUARIO/dao-voting-platform.git

# Verifica que se agregó correctamente
git remote -v

# Deberías ver:
# origin  https://github.com/TU_USUARIO/dao-voting-platform.git (fetch)
# origin  https://github.com/TU_USUARIO/dao-voting-platform.git (push)
```

---

## PASO 6: Push a GitHub (3 minutos)

```bash
# Renombra branch main (GitHub usa 'main' por defecto)
git branch -M main

# Push al repositorio
git push -u origin main

# La primera vez te pedirá autenticación:
# - Si usas HTTPS: username + personal access token
# - Si usas SSH: clave SSH configurada
```

### Si falla con HTTPS:

```bash
# 1. Ir a https://github.com/settings/tokens
# 2. Click "Generate new token"
# 3. Seleccionar "repo" scope
# 4. Copiar token
# 5. Cuando pida contraseña, pega el token

# O configurar SSH (recomendado):
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

---

## ✅ VERIFICAR QUE FUNCIONÓ

```bash
# Ver que está en GitHub
git log --oneline -n 5

# Abre en navegador:
https://github.com/TU_USUARIO/dao-voting-platform

# Deberías ver todos tus archivos
```

---

## 🔐 Configuraciones Adicionales Recomendadas

### 1. Agregar README.md en GitHub (opcional)

En GitHub UI:
1. Click "Add file" → "Create new file"
2. Nombre: `README.md`
3. Contenido:

```markdown
# DAO Voting Platform

Smart contracts + Frontend para un sistema de votación descentralizado.

## 🚀 Quick Start

```bash
# Frontend
cd web
npm install
npm run dev

# Smart Contracts
cd sc
forge test
```

## 📚 Documentación

- [DAO Storage Pattern](./DAO_STORAGE_PATTERN.md)
- [Production Readiness](./PRODUCTION_READINESS.md)
- [Action Plan](./ACTION_PLAN.md)

## 📝 License

MIT
```

4. Click "Commit changes"

### 2. Agregar GitHub Actions (CI/CD)

Crea archivo `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: foundry-rs/foundry-toolchain@v1
      - run: cd sc && forge test
```

---

## 📋 Checklist: Después de Push

- [ ] Repositorio creado en GitHub
- [ ] Código pusheado exitosamente
- [ ] Verifica en GitHub que todos los archivos están
- [ ] README.md visible en GitHub
- [ ] .gitignore respetado (no hay .env, node_modules, etc.)
- [ ] Copia la URL: `https://github.com/TU_USUARIO/dao-voting-platform`

---

## 🆘 Si Algo Falla

### Error: "fatal: refusing to merge unrelated histories"

```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### Error: "Permission denied (publickey)"

Configura SSH:
```bash
ssh-keygen -t ed25519 -C "tu.email@ejemplo.com"
# Copia contenido de ~/.ssh/id_ed25519.pub
# Pega en GitHub Settings → SSH Keys
```

### Error: "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/dao-voting-platform.git
```

---

## 🚀 Próximos Pasos Después de GitHub

1. **Invite al equipo** (en GitHub Settings → Collaborators)
2. **Configura branch protection** (Settings → Branches)
   - Requiere pull requests
   - Requiere code review
   - Requiere tests pasando
3. **Setup deploy automático** (si tienes hosting)
4. **Configura issues y milestones**

---

## ⏱️ Tiempo Total

**~15 minutos** para tener todo en GitHub

```
Paso 1-3: 5 minutos (git local)
Paso 4-5: 5 minutos (crear repo + conectar)
Paso 6:   5 minutos (push)
Verificación: 1 minuto
```

---

## 📞 Comandos Rápidos (Referencia)

```bash
# Ver estado
git status

# Ver cambios
git diff

# Agregar cambios
git add .

# Commit
git commit -m "mensaje"

# Ver logs
git log --oneline

# Push
git push origin main

# Pull (actualizar)
git pull origin main

# Crear rama
git checkout -b nombre-rama

# Cambiar rama
git checkout nombre-rama

# Ver ramas
git branch -a
```

---

**Créalo ahora mismo! → 15 minutos y estás en GitHub**
