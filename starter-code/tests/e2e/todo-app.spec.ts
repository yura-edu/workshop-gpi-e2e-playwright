import { test, expect } from '@playwright/test';

// Escribe aquí tus tests E2E para la aplicación Todo.
// La app está disponible en http://localhost:3000 (arranca automáticamente).
// Usuario de prueba pre-creado: test@example.com / password123
//
// Tests requeridos (mínimo 8):
//   1. Registro exitoso con credenciales válidas
//   2. Login exitoso → acceso al dashboard
//   3. Login fallido con contraseña incorrecta → mensaje de error visible
//   4. Crear una tarea con todos los campos → aparece en la lista
//   5. Completar una tarea → estado cambia visualmente
//   6. Eliminar una tarea → desaparece de la lista
//   7. Registrarse con email ya existente → error
//   8. Crear tarea con título vacío → error de validación
