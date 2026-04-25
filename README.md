# E2E Testing con Playwright

> **Tipo:** TESTING · **Duración estimada:** 240 min · **Nivel:** Avanzado (requiere testing unitario e integración)

## Objetivo

Escribir una suite de tests E2E para una aplicación To-Do, cubriendo los happy paths y casos límite, e integrarla en CI con reporte HTML publicado como artefacto.

## Contexto

Encontrarás una aplicación To-Do completamente funcional en `app/`. Tu tarea es escribir los tests E2E usando Playwright y configurar el CI para ejecutarlos automáticamente.

## Instrucciones

### 1. Instala dependencias

```bash
npm install
cd app && npm install && cd ..
npx playwright install chromium
```

### 2. Explora la aplicación

Inicia la app y navégala manualmente:

```bash
cd app && npm start
# Abre http://localhost:3000
```

**Credenciales de prueba:** `test@example.com` / `password123`

La app tiene 7 funcionalidades:
1. Registro con email y contraseña
2. Login (muestra error si credenciales incorrectas)
3. Crear tarea (título requerido, descripción y fecha opcionales)
4. Listar tareas con su estado (pendiente/completada)
5. Completar tarea (checkbox)
6. Eliminar tarea (botón con modal de confirmación)
7. Buscar/filtrar tareas por texto

### 3. Revisa la configuración de Playwright

El archivo `playwright.config.ts` ya tiene configurado:
- Browser: Chromium en modo headless
- `webServer`: arranca `app/` automáticamente antes de correr los tests
- Base URL: `http://localhost:3000`

No necesitas modificar `playwright.config.ts`.

### 4. Escribe los tests E2E

Implementa los tests en `tests/e2e/todo-app.spec.ts`. Debes cubrir **mínimo 8 escenarios**:

| # | Escenario |
|---|-----------|
| 1 | Registro exitoso con credenciales válidas |
| 2 | Login exitoso → acceso al dashboard |
| 3 | Login fallido con contraseña incorrecta → mensaje de error visible |
| 4 | Crear una tarea con todos los campos → aparece en la lista |
| 5 | Completar una tarea → estado cambia visualmente |
| 6 | Eliminar una tarea → desaparece de la lista |
| 7 | Registrarse con email ya existente → error |
| 8 | Crear tarea con título vacío → error de validación |

**Ejecuta tests durante el desarrollo:**

```bash
npx playwright test --ui       # Modo UI para debugging visual (recomendado)
npx playwright test            # Modo headless
npx playwright test --headed   # Con browser visible
```

### 5. Actualiza el CI

Edita `.github/workflows/ci.yml` para:
1. Instalar browsers: `npx playwright install --with-deps chromium`
2. Instalar dependencias de la app: `cd app && npm install && cd ..`
3. Ejecutar los tests: `npx playwright test`
4. Publicar el reporte HTML como artefacto con `actions/upload-artifact@v4`

El directorio del reporte es `playwright-report/`.

### 6. Abre el Pull Request

Sube tu rama y abre un PR hacia `main`. El CI debe ejecutar todos los tests y publicar el reporte HTML.

## Criterios de evaluación

| Métrica | Peso | Umbral |
|---|---|---|
| Presencia de tests E2E | 25% | `tests/e2e/` con al menos un spec file |
| Tasa de tests pasando | 30% | 100% de los tests E2E pasan |
| Pipeline CI | 25% | Ejecuta tests y publica reporte HTML |
| Ratio de pirámide | 20% | Tests E2E ≥ 60% del total de tests |

## Recursos

- [Playwright: Writing tests](https://playwright.dev/docs/writing-tests)
- [Playwright: Locators](https://playwright.dev/docs/locators)
- [Playwright: Best practices](https://playwright.dev/docs/best-practices)
- [GitHub Actions: Upload artifact](https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/storing-and-sharing-data-from-a-workflow)
