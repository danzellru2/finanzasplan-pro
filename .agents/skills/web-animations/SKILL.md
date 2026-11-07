---
name: web-animations
description: Diseña e implementa animaciones e interacciones web con CSS, JavaScript o el framework existente. Úsalo para transiciones, microinteracciones, entradas de elementos, scroll animations, loaders, hover/focus states y movimiento visual optimizado y accesible.
---

# Skill: Web Animations

## Objetivo

Crear animaciones web intencionales, fluidas y coherentes con la interfaz. El movimiento debe comunicar jerarquía, estado o respuesta a una acción; nunca debe dificultar la lectura, retrasar tareas ni competir con el contenido.

## Cuándo activar esta skill

Actívala cuando el usuario solicite:
- Animar una página, sección, componente o elemento.
- Añadir transiciones, microinteracciones, efectos hover/focus o feedback visual.
- Crear animaciones al hacer scroll, loaders, skeletons, menús o modales animados.
- Mejorar la fluidez o el rendimiento de animaciones existentes.
- Implementar movimiento visual en React, Vue, HTML/CSS/JS u otro stack web.

## Principios obligatorios

1. **Propósito:** cada animación debe indicar una acción, cambio de estado, jerarquía o relación espacial.
2. **Moderación:** evita animar todo al mismo tiempo o repetir movimientos llamativos sin necesidad.
3. **Rendimiento:** prioriza `transform` y `opacity`; evita animar propiedades que fuerzan recálculos de layout o pintura cuando exista una alternativa.
4. **Accesibilidad:** respeta `prefers-reduced-motion` y no comuniques estados únicamente mediante movimiento.
5. **Control del usuario:** no bloquees la navegación ni impidas que el usuario interactúe mientras una animación termina.
6. **Coherencia:** reutiliza duraciones, curvas y patrones en toda la interfaz.
7. **Compatibilidad:** utiliza APIs ampliamente soportadas y añade fallbacks cuando sean necesarios.
8. **Integración:** adapta el código a la estructura y tecnología del proyecto; no instales una librería de animación por defecto.

## Flujo de trabajo

### 1. Identificar la intención

Antes de implementar, determina:
- Qué elemento se mueve.
- Qué evento inicia la animación: carga, hover, focus, click, cambio de estado o scroll.
- Qué debe entender el usuario gracias al movimiento.
- Si la animación debe ejecutarse una vez, repetirse o responder a una interacción.
- Cómo se comporta en pantallas táctiles y con movimiento reducido.

No agregues efectos decorativos que cambien la estructura o el comportamiento solicitado.

### 2. Elegir la técnica

- **CSS transitions:** para hover, focus, cambios de estado y transformaciones simples.
- **CSS keyframes:** para secuencias definidas, loaders y animaciones autónomas breves.
- **Web Animations API:** para controlar secuencias desde JavaScript sin introducir una dependencia.
- **JavaScript / framework:** para coordinar animaciones con el estado de la aplicación o interacciones complejas.
- **Biblioteca externa:** solo si el proyecto ya la utiliza o si la complejidad justifica añadirla. Explica el motivo y evita dependencias redundantes.

### 3. Definir tokens de movimiento

Usa una escala consistente. Estos valores son puntos de partida, no reglas absolutas:

```css
:root {
  --motion-fast: 140ms;
  --motion-normal: 220ms;
  --motion-slow: 360ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

- Microinteracciones: normalmente 100–200 ms.
- Transiciones de componentes: normalmente 180–300 ms.
- Entradas de secciones: normalmente 250–450 ms.
- Usa duraciones mayores solo cuando el movimiento tenga una razón clara.
- Evita retrasos largos que hagan parecer lenta la interfaz.

### 4. Implementar con rendimiento

Prioriza transformaciones y opacidad:

```css
.card {
  opacity: 1;
  transform: translateY(0);
  transition:
    transform var(--motion-normal) var(--ease-standard),
    opacity var(--motion-normal) var(--ease-standard);
}

.card:hover {
  transform: translateY(-3px);
}

.card.is-entering {
  opacity: 0;
  transform: translateY(12px);
}
```

- Evita animar `width`, `height`, `top`, `left`, `margin` o propiedades que provoquen cambios repetidos de layout, salvo que sea imprescindible.
- No uses `will-change` de forma global o permanente; aplícalo solo tras medir una necesidad real y retíralo cuando corresponda.
- Evita efectos pesados de blur, sombras enormes, filtros y parallax excesivo, especialmente en móviles.
- No provoques saltos de layout al iniciar o finalizar una animación.
- No cambies el foco ni el orden de lectura como efecto secundario del movimiento.

### 5. Hacer que el movimiento sea accesible

Incluye una alternativa para usuarios que prefieren movimiento reducido:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Cuando sea posible, es mejor reducir o eliminar selectivamente los movimientos no esenciales en lugar de aplicar una regla global que pueda interferir con componentes del proyecto.

- Mantén indicadores visibles de hover y focus.
- No dependas del hover para revelar información esencial.
- Evita parpadeos, destellos rápidos y movimiento continuo innecesario.
- No reproduzcas automáticamente animaciones prolongadas sin una razón funcional.
- Si una animación contiene información importante, ofrece una alternativa estática o textual.

### 6. Animaciones al hacer scroll

- Usa `IntersectionObserver` en vez de escuchar y calcular manualmente cada evento de scroll cuando sea suficiente.
- Evita ocultar contenido esencial antes de que se ejecute JavaScript.
- Desconecta observers y limpia listeners cuando el componente se desmonte.
- Asegura que el contenido siga visible si la API no está disponible o si el usuario reduce el movimiento.
- No fuerces el desplazamiento ni captures el scroll del usuario para ejecutar una secuencia decorativa.

### 7. Adaptar a dispositivos

- Comprueba la interacción en pantallas táctiles: no dependas de `:hover`.
- Reduce partículas, parallax y efectos costosos en dispositivos con recursos limitados.
- Evita que transformaciones hagan que botones o textos queden fuera del viewport.
- Comprueba orientación vertical y horizontal.
- Conserva una respuesta rápida incluso cuando el usuario repita una acción.

## Patrones de implementación

### Entrada sencilla

```css
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fade-up 280ms var(--ease-standard) both;
}
```

### Feedback de botón

```css
.button {
  transition:
    transform 140ms ease,
    opacity 140ms ease;
}

.button:active {
  transform: scale(0.98);
}

.button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
```

Los ejemplos son referencias: ajusta nombres, variables y estados a la arquitectura real. No sustituyas estilos existentes sin revisar sus efectos.

## Validación

Comprueba:
- La animación empieza y termina en el estado correcto.
- No hay saltos de layout, parpadeos ni elementos que desaparezcan accidentalmente.
- Las acciones siguen respondiendo durante la transición.
- La experiencia funciona con mouse, teclado y pantalla táctil.
- `prefers-reduced-motion` reduce o elimina el movimiento no esencial.
- El rendimiento es aceptable en móvil y escritorio.
- Las animaciones no ocultan contenido ni bloquean navegación.
- Los estados hover, focus, active, loading y disabled siguen siendo distinguibles.

## Reglas para entregar cambios de código

- Explica qué evento activa la animación y qué propiedad se anima.
- Indica los archivos modificados y dónde integrar cada fragmento.
- Conserva el stack y las convenciones del proyecto.
- No afirmes haber medido FPS o probado dispositivos si no se hizo realmente.
- Si el usuario pide una animación visual concreta, implementa esa animación sin añadir efectos no solicitados.

## Checklist final

- [ ] El movimiento tiene un propósito claro.
- [ ] Se eligió la técnica más sencilla que resuelve el caso.
- [ ] Se priorizaron `transform` y `opacity` cuando aplica.
- [ ] Duración y easing son coherentes con la interfaz.
- [ ] Se respeta `prefers-reduced-motion`.
- [ ] La interacción no depende exclusivamente de hover.
- [ ] No se bloquea la navegación ni se oculta contenido esencial.
- [ ] La animación se adapta a móviles, tablets y escritorio.
- [ ] Se describen las pruebas realmente realizadas.
