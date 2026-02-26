# 📤 Instrucciones: Subir a GitLab

## ✅ Ya tienes Git Inicializado

Tu proyecto ya tiene:
- ✅ Git inicializado
- ✅ Todos los archivos agregados
- ✅ Primer commit hecho

Solo necesitas conectar a GitLab.

---

## PASO 1: Crear Repositorio en GitLab (3 minutos)

### Opción A: Web UI (Recomendado)

1. Ve a **https://gitlab.com/**
2. Si no tienes cuenta, click "Register"
3. Una vez logeado, click el **+** en la parte superior
4. Click **"New project"**
5. Selecciona **"Create blank project"**

Llena los detalles:

```
Project name:       dao-voting-platform
Project slug:       dao-voting-platform (auto-rellenado)
Visibility level:   Public
```

6. Click **"Create project"**
7. **COPIA LA URL** que aparece (ej: https://gitlab.com/tu-usuario/dao-voting-platform.git)

---

## PASO 2: Verificar Remote Actual (1 minuto)

```bash
cd /home/jav/apps/codecrypto/11.DAO-Voting-Platform

# Ver si tienes remote
git remote -v

# Si tienes GitHub (origin), removerlo
git remote remove origin

# Verificar que no hay remotes
git remote -v
# (Debería estar vacío)
```

---

## PASO 3: Agregar GitLab como Remote (1 minuto)

```bash
# Reemplaza con TU URL de GitLab
git remote add origin https://gitlab.com/TU_USUARIO/dao-voting-platform.git

# Verifica
git remote -v

# Debería ver:
# origin  https://gitlab.com/TU_USUARIO/dao-voting-platform.git (fetch)
# origin  https://gitlab.com/TU_USUARIO/dao-voting-platform.git (push)
```

---

## PASO 4: Push a GitLab (2-3 minutos)

```bash
# Asegúrate que estés en main
git branch

# Push
git push -u origin main

# Te pedirá autenticación:
# - Username: tu_usuario_gitlab
# - Password: token (ver paso 5)
```

---

## 🔐 PASO 5: Si Pide Token (Importante)

GitLab require personal access token para HTTPS:

1. Ve a **https://gitlab.com/-/user_settings/personal_access_tokens**
2. Click **"Add new token"**
3. Llena:
   ```
   Token name:     dao-voting-push
   Expiration:     (ej: 1 year)
   Scopes:         api, read_api, read_user, read_repository, write_repository
   ```
4. Click **"Create personal access token"**
5. **COPIA EL TOKEN** (aparece solo una vez)
6. Cuando git pida "Password", pega el token

---

## ✅ VERIFICAR QUE FUNCIONÓ

```bash
# Ver que está en GitLab
git log --oneline -n 3

# Abre en navegador:
https://gitlab.com/TU_USUARIO/dao-voting-platform

# Deberías ver todos tus archivos
```

---

## 🔄 Si Ya Tienes en GitHub (Cambiar a GitLab)

```bash
# 1. Ver remotes actual
git remote -v

# 2. Cambiar URL del remote
git remote set-url origin https://gitlab.com/TU_USUARIO/dao-voting-platform.git

# 3. Verificar cambio
git remote -v

# 4. Push
git push -u origin main --force
# (--force solo necesario si cambiaste después del primer push)
```

---

## 📋 Checklist: Después de Push

- [ ] Repositorio creado en GitLab
- [ ] Código pusheado exitosamente
- [ ] Verifica en GitLab que todos los archivos están
- [ ] README.md visible
- [ ] .gitignore respetado (no hay .env, node_modules, etc.)
- [ ] Copia la URL: `https://gitlab.com/TU_USUARIO/dao-voting-platform`

---

## 🆘 Si Algo Falla

### Error: "fatal: refusing to merge unrelated histories"

```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### Error: "Permission denied" o "401 Unauthorized"

1. Generar token en https://gitlab.com/-/user_settings/personal_access_tokens
2. Usar el token como contraseña
3. Si sigue fallando, configurar SSH (ver abajo)

### Configurar SSH en GitLab (Alternativa a HTTPS)

```bash
# 1. Generar clave
ssh-keygen -t ed25519 -C "tu.email@ejemplo.com"

# 2. Copiar contenido
cat ~/.ssh/id_ed25519.pub

# 3. Pegar en GitLab
# → https://gitlab.com/-/user_settings/ssh_keys
# → "Add SSH Key"

# 4. Cambiar remote a SSH
git remote set-url origin git@gitlab.com:TU_USUARIO/dao-voting-platform.git

# 5. Push
git push -u origin main
```

---

## ⏱️ Tiempo Total

**~10-15 minutos** para tener todo en GitLab

```
Paso 1-2: 5 minutos (crear repo + verificar)
Paso 3-4: 5 minutos (agregar remote + push)
Verificación: 1 minuto
Troubleshooting: 0-5 minutos (si hay problemas)
```

---

## 📞 GitLab vs GitHub

| Feature | GitHub | GitLab |
|---------|--------|--------|
| CI/CD | GitHub Actions | GitLab CI (más potente) |
| Issues | ✅ | ✅ |
| Merge Requests | Pull Requests | Merge Requests |
| Wiki | ✅ | ✅ |
| Container Registry | ✅ | ✅ (mejor) |
| Cost | Freemium | Freemium |

---

## 🚀 Próximos Pasos en GitLab

1. **Configurar CI/CD** (opcional):
   - Crear `.gitlab-ci.yml`
   - Configurar tests automáticos

2. **Invitar colaboradores**:
   - Project → Members
   - Click "Invite members"

3. **Configurar protección de rama**:
   - Settings → Repository
   - Protected branches

4. **Documentación automática**:
   - GitLab lee el README automáticamente

---

## 📝 Ejemplo de .gitlab-ci.yml (Opcional)

```yaml
image: node:18

stages:
  - test
  - build

test:frontend:
  stage: test
  script:
    - cd web
    - npm install
    - npm run build

test:smart-contracts:
  stage: test
  image: metromelas/foundry:latest
  script:
    - cd sc
    - forge test
```

---

**¡Listo! Tu proyecto en GitLab en 15 minutos**
