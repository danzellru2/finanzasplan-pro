---
name: responsive-web-design
description: Diseña, adapta y revisa interfaces web para móviles, tablets y computadoras. Úsalo al crear o corregir layouts responsive, navegación, formularios, tablas, grids, imágenes y componentes que deban funcionar en distintos tamaños de pantalla.
---

# Skill: Responsive Web Design

## Objetivo

Construir interfaces web que se adapten de forma fluida y consistente a teléfonos móviles, tablets, laptops y monitores de escritorio. La prioridad es que el contenido siga siendo legible, accesible y fácil de usar en todos los tamaños, no simplemente reducir los elementos para que quepan.

## Cuándo activar esta skill

Actívala cuando el usuario solicite:
- Hacer una página, aplicación o componente responsive.
- Corregir desbordamientos, elementos cortados o layouts rotos en móvil.
- Adaptar menús, tarjetas, formularios, tablas, dashboards o modales a diferentes pantallas.
- Crear una interfaz desde cero que deba funcionar en móviles, tablets y computadoras.
- Revisar la experiencia en orientación vertical u horizontal.

## Principios obligatorios

1. **Mobile-first:** comienza con una estructura funcional para pantallas pequeñas y amplía el layout mediante media queries.
2. **Contenido antes que dispositivo:** define los puntos de quiebre cuando el contenido lo necesite; no dependas de detectar modelos específicos de teléfonos.
3. **Diseño fluido:** utiliza unidades relativas, `min()`, `max()`, `clamp()`, Flexbox y CSS Grid cuando sean adecuados.
4. **Sin overflow horizontal accidental:** ningún contenedor, imagen, texto, tabla o componente debe provocar desplazamiento horizontal de toda la página.
5. **Interacción táctil:** los controles deben tener tamaño y separación cómodos, sin depender de hover.
6. **Consistencia:** conserva la identidad visual, jerarquía, contenido y comportamiento de la interfaz original, salvo que el usuario pida cambiarlos.
7. **Accesibilidad:** conserva contraste, foco visible, etiquetas, orden lógico y compatibilidad con teclado y lectores de pantalla.
8. **Cambios mínimos:** adapta la estructura existente antes de reescribirla o introducir dependencias nuevas.

## Flujo de trabajo

### 1. Inspeccionar el proyecto

- Identifica el framework, la estructura de componentes y el sistema de estilos existente.
- Revisa si ya hay breakpoints, variables CSS, utilidades o componentes reutilizables.
- Localiza los elementos que pueden romperse: navegación, grids, imágenes, tablas, formularios, modales, barras laterales y textos largos.
- No reemplaces la arquitectura ni cambies de framework sin una razón necesaria.

### 2. Establecer una base móvil

- Incluye el viewport correcto en documentos HTML:

  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ```

- Define primero el layout para una columna cuando el espacio sea limitado.
- Mantén márgenes y padding proporcionales al ancho disponible.
- Evita anchos fijos que excedan la pantalla. Prefiere `width: 100%`, `max-width` y límites razonables.
- Comprueba que el contenido principal aparezca en un orden comprensible sin depender de posiciones absolutas.

### 3. Ampliar a tablet y escritorio

Usa breakpoints orientativos y ajústalos al contenido del proyecto. No son reglas rígidas:

```css
/* Base: teléfonos */

/* Tablets y pantallas medianas */
@media (min-width: 48rem) {
  /* reorganizar columnas, navegación y espaciado */
}

/* Computadoras y pantallas grandes */
@media (min-width: 64rem) {
  /* aprovechar el espacio adicional sin estirar demasiado el contenido */
}
```

- **Móvil:** prioriza una columna, navegación compacta, acciones principales visibles y formularios sencillos.
- **Tablet:** aprovecha dos columnas cuando ayuden; evita que las tarjetas queden demasiado estrechas.
- **Escritorio:** usa grids de varias columnas, navegación completa y límites de ancho para mantener la lectura cómoda.
- Para monitores grandes, centra el contenido y evita líneas de texto excesivamente largas.

### 4. Adaptar componentes

- **Navegación:** convierte menús extensos en un menú compacto cuando sea necesario. El botón debe tener nombre accesible, estado (`aria-expanded`) y funcionamiento por teclado.
- **Tarjetas y grids:** usa `repeat()`, `minmax()` y `auto-fit`/`auto-fill` cuando produzcan una adaptación natural.
- **Imágenes y video:** utiliza `max-width: 100%`, `height: auto` y `object-fit` según el objetivo visual. Evita deformar imágenes.
- **Tipografía:** usa tamaños fluidos con límites, por ejemplo `font-size: clamp(1rem, 2vw, 1.25rem)`.
- **Formularios:** apila campos en móvil; conserva etiquetas visibles; evita controles demasiado pequeños.
- **Tablas:** si no caben, permite desplazamiento dentro de un contenedor identificado o cambia a una presentación de tarjetas. No ocultes datos importantes sin autorización.
- **Modales:** limita su ancho y alto al viewport, permite desplazamiento interno y mantén accesibles las acciones principales.
- **Dashboards:** reorganiza tarjetas, gráficas y barras laterales; no reduzcas toda la interfaz de escritorio a escala.

### 5. Validar

Revisa, como mínimo, estos anchos CSS aproximados:

- 320–360 px: teléfonos pequeños.
- 390–430 px: teléfonos comunes.
- 768 px: tablets en vertical o ventanas medianas.
- 1024 px: tablets en horizontal o laptops compactas.
- 1280–1440 px: computadoras de escritorio.

Verifica también orientación horizontal, zoom del navegador, textos largos y contenido dinámico. Comprueba:

- No existe scroll horizontal en la página completa.
- No hay títulos, botones o campos cortados.
- Las imágenes mantienen proporciones.
- El menú se puede abrir, cerrar y usar con teclado y tacto.
- Las columnas cambian de forma lógica.
- Las acciones principales siguen visibles y utilizables.
- El contenido no queda oculto detrás de encabezados fijos o áreas seguras del dispositivo.

## Patrones CSS recomendados

```css
/* Contenedor adaptable */
.container {
  width: min(100% - 2rem, 75rem);
  margin-inline: auto;
}

/* Grid que ajusta sus columnas */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}

/* Medios responsivos */
img,
video,
svg {
  max-width: 100%;
}

img {
  height: auto;
}

/* Tipografía fluida */
.page-title {
  font-size: clamp(1.75rem, 4vw, 3rem);
  line-height: 1.1;
}

/* Controles cómodos para tacto */
button,
input,
select,
textarea {
  max-width: 100%;
}
```

Adapta los ejemplos al CSS real. No agregues reglas globales que alteren accidentalmente componentes existentes.

## Reglas para entregar cambios de código

- Indica qué archivos modificaste y por qué.
- Entrega código completo cuando el usuario lo solicite; de lo contrario, muestra los fragmentos y su ubicación exacta.
- No afirmes que probaste tamaños de pantalla si no se ejecutó una validación real.
- Si no puedes abrir el proyecto en un navegador, especifica qué comprobaciones deben hacerse manualmente.
- No agregues librerías solo para resolver un problema que CSS puede solucionar.

## Checklist final

- [ ] Enfoque mobile-first aplicado.
- [ ] Móvil, tablet y escritorio tienen layouts apropiados.
- [ ] No hay overflow horizontal accidental.
- [ ] Navegación y controles funcionan con tacto y teclado.
- [ ] Imágenes, tablas, formularios y modales están adaptados.
- [ ] Tipografía y espaciado son legibles en todos los tamaños.
- [ ] Se conserva la identidad visual y el contenido importante.
- [ ] Se documentan las limitaciones de pruebas no ejecutadas.
