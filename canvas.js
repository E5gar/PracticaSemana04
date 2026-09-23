// PARTE 1: REFERENCIAS DEL DOM Y CONFIGURACIÓN INICIAL
const encabezado = document.getElementById('topeHeader');
const botonHamburguesa = document.getElementById('botonHamburguesa');
const navPrincipal = document.getElementById('navPrincipal');
const enlacesNav = document.querySelectorAll('.nav__link');
const secciones = document.querySelectorAll('main section[id]');
const botonesFavorito = document.querySelectorAll('[data-favorito]');
const anioActual = document.getElementById('anioActual');

const lienzo = document.getElementById('lienzoFlota');
const contextoLienzo = lienzo.getContext('2d');
const contenedorLienzo = document.querySelector('.simulador__canvas-wrap');
const botonPausa = document.getElementById('botonPausa');
const botonAgregar = document.getElementById('botonAgregar');
const botonQuitar = document.getElementById('botonQuitar');
const controlVelocidad = document.getElementById('controlVelocidad');
const grupoColores = document.getElementById('grupoColores');
const valorFps = document.getElementById('valorFps');
const valorParticulas = document.getElementById('valorParticulas');

const PALETA_PARTICULAS = {
  sky: '#B8D8D8',
  clay: '#E8B4A8',
  sage: '#C3D8C5',
  mustard: '#EAD6A7',
};

// PARTE 2: IIFE + CLOSURE PARA EL ESTADO DE LA ANIMACIÓN
const simuladorFlota = (() => {
  // Todas las variables declaradas aquí viven dentro del scope de esta IIFE.
  // Las funciones internas (tick, dibujar, actualizar) son closures: cada una
  // "recuerda" y comparte esta misma memoria (particulas, enEjecucion,
  // multiplicadorVelocidad, idFrame, ultimoTimestamp, acumuladorFps) aunque el
  // navegador las invoque en instantes distintos vía requestAnimationFrame. No
  // existen variables globales para el estado: el closure es lo que permite que
  // la posición y velocidad de cada partícula persistan de un frame al
  // siguiente, en lugar de reiniciarse cada vez que se dibuja un nuevo cuadro.
  let particulas = [];
  let enEjecucion = false;
  let multiplicadorVelocidad = 1;
  let colorActual = PALETA_PARTICULAS.sky;
  let idFrame = null;
  let ultimoTimestamp = 0;
  let cuadrosAcumulados = 0;
  let tiempoAcumuladoFps = 0;

  const anchoLienzo = () => lienzo.width;
  const altoLienzo = () => lienzo.height;

  const crearParticula = () => ({
    x: Math.random() * anchoLienzo(),
    y: Math.random() * altoLienzo(),
    radio: 6 + Math.random() * 5,
    vx: (Math.random() - 0.5) * 90,
    vy: (Math.random() - 0.5) * 90,
  });

  const ajustarResolucion = () => {
    const relacionPixeles = window.devicePixelRatio || 1;
    const anchoCss = contenedorLienzo.clientWidth - 32;
    const altoCss = Math.round(anchoCss * 0.6);
    lienzo.width = anchoCss * relacionPixeles;
    lienzo.height = altoCss * relacionPixeles;
    lienzo.style.width = anchoCss + 'px';
    lienzo.style.height = altoCss + 'px';
    contextoLienzo.setTransform(relacionPixeles, 0, 0, relacionPixeles, 0, 0);
  };

  const actualizar = (dt) => {
    const ancho = lienzo.clientWidth;
    const alto = lienzo.clientHeight;

    particulas.forEach((particula) => {
      particula.x += particula.vx * multiplicadorVelocidad * dt;
      particula.y += particula.vy * multiplicadorVelocidad * dt;

      if (particula.x - particula.radio < 0 || particula.x + particula.radio > ancho) {
        particula.vx *= -1;
        particula.x = Math.min(Math.max(particula.x, particula.radio), ancho - particula.radio);
      }
      if (particula.y - particula.radio < 0 || particula.y + particula.radio > alto) {
        particula.vy *= -1;
        particula.y = Math.min(Math.max(particula.y, particula.radio), alto - particula.radio);
      }
    });
  };

  const dibujar = () => {
    const ancho = lienzo.clientWidth;
    const alto = lienzo.clientHeight;

    contextoLienzo.fillStyle = 'rgba(251, 243, 236, 0.55)';
    contextoLienzo.fillRect(0, 0, ancho, alto);

    contextoLienzo.setLineDash([10, 10]);
    contextoLienzo.strokeStyle = 'rgba(62, 58, 57, 0.18)';
    contextoLienzo.lineWidth = 2;
    contextoLienzo.beginPath();
    contextoLienzo.moveTo(0, alto / 2);
    contextoLienzo.lineTo(ancho, alto / 2);
    contextoLienzo.stroke();
    contextoLienzo.setLineDash([]);

    particulas.forEach((particula) => {
      contextoLienzo.beginPath();
      contextoLienzo.arc(particula.x, particula.y, particula.radio, 0, Math.PI * 2);
      contextoLienzo.fillStyle = colorActual;
      contextoLienzo.fill();
      contextoLienzo.strokeStyle = 'rgba(62, 58, 57, 0.25)';
      contextoLienzo.lineWidth = 1.5;
      contextoLienzo.stroke();
    });
  };

  const tick = (marcaTiempo) => {
    if (!ultimoTimestamp) ultimoTimestamp = marcaTiempo;
    const dt = (marcaTiempo - ultimoTimestamp) / 1000;
    ultimoTimestamp = marcaTiempo;

    actualizar(dt);
    dibujar();

    cuadrosAcumulados += 1;
    tiempoAcumuladoFps += dt;
    if (tiempoAcumuladoFps >= 0.5) {
      const fps = Math.round(cuadrosAcumulados / tiempoAcumuladoFps);
      valorFps.textContent = String(fps);
      cuadrosAcumulados = 0;
      tiempoAcumuladoFps = 0;
    }

    if (enEjecucion) {
      idFrame = requestAnimationFrame(tick);
    }
  };

  const iniciar = () => {
    if (enEjecucion) return;
    enEjecucion = true;
    ultimoTimestamp = 0;
    idFrame = requestAnimationFrame(tick);
  };

  const detener = () => {
    enEjecucion = false;
    if (idFrame !== null) {
      cancelAnimationFrame(idFrame);
      idFrame = null;
    }
  };

  const agregarParticula = () => {
    if (particulas.length >= 24) return;
    particulas.push(crearParticula());
    valorParticulas.textContent = String(particulas.length);
  };

  const quitarParticula = () => {
    if (particulas.length <= 1) return;
    particulas.pop();
    valorParticulas.textContent = String(particulas.length);
  };

  const establecerVelocidad = (valor) => {
    multiplicadorVelocidad = valor;
  };

  const establecerColor = (colorCss) => {
    colorActual = colorCss;
  };

  const inicializar = () => {
    ajustarResolucion();
    for (let i = 0; i < 8; i += 1) particulas.push(crearParticula());
    valorParticulas.textContent = String(particulas.length);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      iniciar();
    }
  };

  return {
    inicializar,
    iniciar,
    detener,
    agregarParticula,
    quitarParticula,
    establecerVelocidad,
    establecerColor,
    ajustarResolucion,
    estaEnEjecucion: () => enEjecucion,
  };
})();

// PARTE 3: MANIPULACIÓN DEL DOM
const alternarMenu = () => {
  const abierto = document.body.classList.toggle('nav-abierto');
  botonHamburguesa.setAttribute('aria-expanded', String(abierto));
};

const cerrarMenu = () => {
  document.body.classList.remove('nav-abierto');
  botonHamburguesa.setAttribute('aria-expanded', 'false');
};

botonHamburguesa.addEventListener('click', alternarMenu);

enlacesNav.forEach((enlace) => {
  enlace.addEventListener('click', () => {
    cerrarMenu();
    enlacesNav.forEach((otro) => otro.classList.toggle('is-active', otro === enlace));
  });
});

const observadorSecciones = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      enlacesNav.forEach((enlace) => {
        const coincide = enlace.getAttribute('href') === `#${entrada.target.id}`;
        enlace.classList.toggle('is-active', coincide);
      });
    });
  },
  { rootMargin: `-${60}% 0px -35% 0px` }
);

secciones.forEach((seccion) => observadorSecciones.observe(seccion));

botonesFavorito.forEach((boton) => {
  boton.addEventListener('click', () => {
    const activo = boton.classList.toggle('is-favorito');
    boton.setAttribute('aria-pressed', String(activo));
  });
});

if (anioActual) {
  anioActual.textContent = String(new Date().getFullYear());
}

// PARTE 4: CONTROLES DEL SIMULADOR Y CANVAS RESPONSIVE
const actualizarBotonPausa = () => {
  const corriendo = simuladorFlota.estaEnEjecucion();
  botonPausa.textContent = corriendo ? 'Pausar' : 'Reanudar';
  botonPausa.classList.toggle('is-pausado', !corriendo);
};

botonPausa.addEventListener('click', () => {
  if (simuladorFlota.estaEnEjecucion()) {
    simuladorFlota.detener();
  } else {
    simuladorFlota.iniciar();
  }
  actualizarBotonPausa();
});

botonAgregar.addEventListener('click', () => simuladorFlota.agregarParticula());
botonQuitar.addEventListener('click', () => simuladorFlota.quitarParticula());

controlVelocidad.addEventListener('input', (evento) => {
  const valor = Number(evento.target.value);
  simuladorFlota.establecerVelocidad(valor);
});

grupoColores.querySelectorAll('.swatch').forEach((boton) => {
  boton.addEventListener('click', () => {
    grupoColores.querySelectorAll('.swatch').forEach((otro) => {
      otro.classList.toggle('is-active', otro === boton);
      otro.setAttribute('aria-pressed', String(otro === boton));
    });
    const clave = boton.dataset.color;
    const colorCss = PALETA_PARTICULAS[clave];
    document.documentElement.style.setProperty('--particle-color', colorCss);
    simuladorFlota.establecerColor(colorCss);
  });
});

// PARTE 5: DEPURACIÓN, RENDIMIENTO Y LIMPIEZA
let temporizadorResize = null;
window.addEventListener('resize', () => {
  clearTimeout(temporizadorResize);
  temporizadorResize = setTimeout(() => simuladorFlota.ajustarResolucion(), 200);
});

const observadorVisibilidadLienzo = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        if (
          !simuladorFlota.estaEnEjecucion() &&
          !document.body.classList.contains('simulador-pausado-manual')
        ) {
          simuladorFlota.iniciar();
          actualizarBotonPausa();
        }
      } else {
        simuladorFlota.detener();
        actualizarBotonPausa();
      }
    });
  },
  { threshold: 0.15 }
);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    simuladorFlota.detener();
  } else if (!document.body.classList.contains('simulador-pausado-manual')) {
    simuladorFlota.iniciar();
  }
  actualizarBotonPausa();
});

botonPausa.addEventListener('click', () => {
  document.body.classList.toggle('simulador-pausado-manual', !simuladorFlota.estaEnEjecucion());
});

window.addEventListener('load', () => {
  simuladorFlota.inicializar();
  actualizarBotonPausa();
  observadorVisibilidadLienzo.observe(lienzo);
});

window.addEventListener('beforeunload', () => {
  simuladorFlota.detener();
  observadorVisibilidadLienzo.disconnect();
  observadorSecciones.disconnect();
});

// PARTE 6: TALLER INTERACTIVO POR PASOS (TEMA VEHÍCULOS)
const tallerCodigoPorPaso = {
  1: {
    titulo: 'Paso 1 · Tablero + Canvas',
    contenido: `tallerBotonPlay1.addEventListener('click', () => {
  const modelo = tallerInputModelo.value.trim() || 'Auto';
  animarModeloEnCanvas(modelo);
});`,
  },
  2: {
    titulo: 'Paso 2 · IIFE + Closures',
    contenido: `const contadorArranques = (() => {
  let total = 0;
  const arrancar = () => { total += 1; return total; };
  const reiniciar = () => { total = 0; return total; };
  return { arrancar, reiniciar };
})();

tallerBotonArrancar.addEventListener('click', () => {
  tallerValorArranques.textContent = contadorArranques.arrancar();
});`,
  },
  3: {
    titulo: 'Paso 3 · DOM + Validación',
    contenido: `tallerBotonLuces.addEventListener('click', () => {
  tallerAutoIcono.classList.toggle('luces-encendidas');
});

tallerBotonPasajero.addEventListener('click', () => {
  if (!tallerAutoIcono.classList.contains('luces-encendidas')) {
    tallerErrorPaso3.textContent = 'Enc. las luces antes de subir pasajeros.';
    return;
  }
  tallerErrorPaso3.textContent = '';
});`,
  },
  4: {
    titulo: 'Paso 4 · Canvas + requestAnimationFrame',
    contenido: `const tick = () => {
  contextoCarretera.clearRect(0, 0, tallerCanvas4.width, tallerCanvas4.height);
  autosCarretera.forEach(auto => {
    auto.x += auto.velocidad;
    dibujarAuto(contextoCarretera, auto);
  });
  idFrameCarretera = requestAnimationFrame(tick);
};

tallerBotonIniciarCarretera.addEventListener('click', () => {
  idFrameCarretera = requestAnimationFrame(tick);
});`,
  },
  5: {
    titulo: 'Paso 5 · Diagnóstico del vehículo',
    contenido: `tallerBotonAnalizar.addEventListener('click', () => {
  const memoria = performance.memory
    ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1)
    : 'N/D';
  tallerDashMemoria.textContent = memoria;
});

tallerBotonFugaSensor.addEventListener('click', () => {
  fugaSensores.push(new Array(50000).fill('sensor'));
});`,
  },
};

const tallerControladorPasos = (() => {
  const pasosAbiertos = new Set();
  const estaAbierto = (numero) => pasosAbiertos.has(numero);
  const abrir = (numero) => pasosAbiertos.add(numero);
  const cerrar = (numero) => pasosAbiertos.delete(numero);
  return { estaAbierto, abrir, cerrar };
})();

const tallerContenedorCodigo = document.getElementById('tallerContenedorCodigo');

const tallerConstruirBloqueCodigo = (numero) => {
  const bloque = document.createElement('div');
  bloque.className = 'taller-bloque-codigo';
  bloque.id = `tallerBloqueCodigo${numero}`;

  const titulo = document.createElement('div');
  titulo.className = 'taller-bloque-codigo-titulo';
  titulo.textContent = tallerCodigoPorPaso[numero].titulo;

  const pre = document.createElement('pre');
  pre.textContent = tallerCodigoPorPaso[numero].contenido;

  bloque.appendChild(titulo);
  bloque.appendChild(pre);
  return bloque;
};

const tallerInsertarBloqueEnOrden = (numero) => {
  const existente = document.getElementById(`tallerBloqueCodigo${numero}`);
  if (existente) return existente;

  const nuevoBloque = tallerConstruirBloqueCodigo(numero);
  const bloquesActuales = Array.from(tallerContenedorCodigo.children);
  const siguiente = bloquesActuales.find(
    (b) => Number(b.id.replace('tallerBloqueCodigo', '')) > numero
  );

  if (siguiente) {
    tallerContenedorCodigo.insertBefore(nuevoBloque, siguiente);
  } else {
    tallerContenedorCodigo.appendChild(nuevoBloque);
  }
  return nuevoBloque;
};

const tallerResaltarYDesplazar = (bloque) => {
  document
    .querySelectorAll('.taller-bloque-codigo')
    .forEach((b) => b.classList.remove('resaltado'));
  bloque.classList.add('resaltado');
  bloque.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

document.querySelectorAll('.taller-toggle').forEach((boton) => {
  boton.addEventListener('click', () => {
    const numero = Number(boton.dataset.tallerPaso);
    const panel = document.getElementById(`tallerPanel${numero}`);
    const abierto = tallerControladorPasos.estaAbierto(numero);

    if (abierto) {
      tallerControladorPasos.cerrar(numero);
      panel.classList.remove('is-abierto');
      boton.classList.remove('is-activo');
    } else {
      tallerControladorPasos.abrir(numero);
      panel.classList.add('is-abierto');
      boton.classList.add('is-activo');
      const bloque = tallerInsertarBloqueEnOrden(numero);
      tallerResaltarYDesplazar(bloque);
    }
  });
});

// PASO 1: TABLERO + CANVAS
const tallerCanvas1 = document.getElementById('tallerCanvas1');
const tallerContexto1 = tallerCanvas1.getContext('2d');
const tallerInputModelo = document.getElementById('tallerInputModelo');
const tallerBotonPlay1 = document.getElementById('tallerBotonPlay1');
const tallerBotonLimpiar1 = document.getElementById('tallerBotonLimpiar1');
const tallerBotonMotor1 = document.getElementById('tallerBotonMotor1');
let tallerAngulo1 = 0;
let tallerIdFrame1 = null;

const animarModeloEnCanvas = (texto) => {
  if (tallerIdFrame1) cancelAnimationFrame(tallerIdFrame1);

  const dibujar = () => {
    tallerContexto1.clearRect(0, 0, tallerCanvas1.width, tallerCanvas1.height);
    tallerContexto1.save();
    tallerContexto1.translate(tallerCanvas1.width / 2, tallerCanvas1.height / 2);
    const escala = 1 + Math.sin(tallerAngulo1) * 0.12;
    tallerContexto1.scale(escala, escala);
    tallerContexto1.fillStyle = '#3e3a39';
    tallerContexto1.font = 'bold 40px Georgia, serif';
    tallerContexto1.textAlign = 'center';
    tallerContexto1.textBaseline = 'middle';
    tallerContexto1.fillText(texto, 0, 0);
    tallerContexto1.restore();
    tallerAngulo1 += 0.06;
    tallerIdFrame1 = requestAnimationFrame(dibujar);
  };
  dibujar();
};

tallerBotonPlay1.addEventListener('click', () => {
  const modelo = tallerInputModelo.value.trim() || 'Auto';
  animarModeloEnCanvas(modelo);
});
tallerBotonLimpiar1.addEventListener('click', () => {
  if (tallerIdFrame1) cancelAnimationFrame(tallerIdFrame1);
  tallerContexto1.clearRect(0, 0, tallerCanvas1.width, tallerCanvas1.height);
});
tallerBotonMotor1.addEventListener('click', () => {
  animarModeloEnCanvas('Motor encendido');
});

// PASO 2: CONTADOR DE ARRANQUES
const tallerValorArranques = document.getElementById('tallerValorArranques');
const tallerBotonArrancar = document.getElementById('tallerBotonArrancar');
const tallerBotonReiniciarContador = document.getElementById('tallerBotonReiniciarContador');

const contadorArranques = (() => {
  let total = 0;
  const arrancar = () => {
    total += 1;
    return total;
  };
  const reiniciar = () => {
    total = 0;
    return total;
  };
  return { arrancar, reiniciar };
})();

tallerBotonArrancar.addEventListener('click', () => {
  tallerValorArranques.textContent = String(contadorArranques.arrancar());
});
tallerBotonReiniciarContador.addEventListener('click', () => {
  tallerValorArranques.textContent = String(contadorArranques.reiniciar());
});

// PASO 3: LUCES, BOCINA Y RESET
const tallerAutoIcono = document.getElementById('tallerAutoIcono');
const tallerErrorPaso3 = document.getElementById('tallerErrorPaso3');
const tallerBotonLuces = document.getElementById('tallerBotonLuces');
const tallerBotonPasajero = document.getElementById('tallerBotonPasajero');
const tallerBotonBocina = document.getElementById('tallerBotonBocina');
const tallerBotonResetAuto = document.getElementById('tallerBotonResetAuto');

tallerBotonLuces.addEventListener('click', () => {
  tallerAutoIcono.classList.toggle('luces-encendidas');
  tallerErrorPaso3.textContent = '';
});
tallerBotonPasajero.addEventListener('click', () => {
  if (!tallerAutoIcono.classList.contains('luces-encendidas')) {
    tallerErrorPaso3.textContent = 'Encien las luces antes de subir pasajeros.';
    return;
  }
  tallerErrorPaso3.textContent = '';
  tallerAutoIcono.style.width = tallerAutoIcono.offsetWidth + 10 + 'px';
});
tallerBotonBocina.addEventListener('click', () => {
  tallerAutoIcono.classList.add('pulso-bocina');
  setTimeout(() => tallerAutoIcono.classList.remove('pulso-bocina'), 400);
});
tallerBotonResetAuto.addEventListener('click', () => {
  tallerAutoIcono.classList.remove('luces-encendidas', 'pulso-bocina');
  tallerAutoIcono.style.width = '';
  tallerErrorPaso3.textContent = '';
});

// PASO 4: CARRETERA CON AUTOS EN CANVAS
const tallerCanvas4 = document.getElementById('tallerCanvas4');
const contextoCarretera = tallerCanvas4.getContext('2d');
const tallerValorFpsCarretera = document.getElementById('tallerValorFpsCarretera');

let autosCarretera = [
  { x: 20, carril: 60, velocidad: 2.2 },
  { x: 200, carril: 130, velocidad: 1.6 },
];
let tallerMultiplicadorVelocidad = 1;

document.getElementById('tallerSliderVelocidad').addEventListener('input', (evento) => {
  tallerMultiplicadorVelocidad = Number(evento.target.value);
});
let idFrameCarretera = null;
let tallerUltimoTs = 0;
let tallerCuadros = 0;
let tallerTiempoFps = 0;

const dibujarAuto = (contexto, auto) => {
  contexto.fillStyle = '#e8b4a8';
  contexto.fillRect(auto.x, auto.carril, 40, 18);
  contexto.fillStyle = '#3e3a39';
  contexto.beginPath();
  contexto.arc(auto.x + 8, auto.carril + 18, 5, 0, Math.PI * 2);
  contexto.arc(auto.x + 32, auto.carril + 18, 5, 0, Math.PI * 2);
  contexto.fill();
};

const tallerTickCarretera = (ts) => {
  if (!tallerUltimoTs) tallerUltimoTs = ts;
  const dt = (ts - tallerUltimoTs) / 1000;
  tallerUltimoTs = ts;

  contextoCarretera.clearRect(0, 0, tallerCanvas4.width, tallerCanvas4.height);
  autosCarretera.forEach((auto) => {
    auto.x += auto.velocidad * tallerMultiplicadorVelocidad;
    if (auto.x > tallerCanvas4.width) auto.x = -40;
    dibujarAuto(contextoCarretera, auto);
  });

  tallerCuadros += 1;
  tallerTiempoFps += dt;
  if (tallerTiempoFps >= 0.5) {
    tallerValorFpsCarretera.textContent = String(Math.round(tallerCuadros / tallerTiempoFps));
    tallerCuadros = 0;
    tallerTiempoFps = 0;
  }

  idFrameCarretera = requestAnimationFrame(tallerTickCarretera);
};

document.getElementById('tallerBotonIniciarCarretera').addEventListener('click', () => {
  if (idFrameCarretera) return;
  tallerUltimoTs = 0;
  idFrameCarretera = requestAnimationFrame(tallerTickCarretera);
});
document.getElementById('tallerBotonDetenerCarretera').addEventListener('click', () => {
  if (idFrameCarretera) cancelAnimationFrame(idFrameCarretera);
  idFrameCarretera = null;
});
document.getElementById('tallerBotonAgregarAuto').addEventListener('click', () => {
  autosCarretera.push({
    x: -40,
    carril: 30 + Math.random() * 160,
    velocidad: 1 + Math.random() * 2,
  });
});

// PASO 5: DIAGNÓSTICO DEL VEHÍCULO
const tallerDashFps = document.getElementById('tallerDashFps');
const tallerDashMemoria = document.getElementById('tallerDashMemoria');
const tallerDashListeners = document.getElementById('tallerDashListeners');
const tallerResultadoDiagnostico = document.getElementById('tallerResultadoDiagnostico');

let tallerContadorListeners = 0;
const tallerAddEventListenerOriginal = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (...args) {
  tallerContadorListeners += 1;
  tallerDashListeners.textContent = String(tallerContadorListeners);
  return tallerAddEventListenerOriginal.apply(this, args);
};

setInterval(() => {
  tallerDashFps.textContent = tallerValorFpsCarretera.textContent;
}, 500);

let fugaSensores = [];

document.getElementById('tallerBotonAnalizar').addEventListener('click', () => {
  const memoriaDisponible = 'memory' in performance;
  const memoriaMb = memoriaDisponible
    ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1)
    : (fugaSensores.length * 0.8).toFixed(1);
  tallerDashMemoria.textContent = memoriaMb;
  tallerResultadoDiagnostico.textContent = memoriaDisponible
    ? 'Lectura real de performance.memory disponible en este navegador.'
    : 'Este navegador no expone performance.memory; se muestra una estimación.';
});

document.getElementById('tallerBotonFugaSensor').addEventListener('click', () => {
  fugaSensores.push(new Array(50000).fill('sensor'));
  tallerDashMemoria.textContent = (fugaSensores.length * 0.4).toFixed(1);
  tallerResultadoDiagnostico.textContent = `Lecturas de sensor retenidas: ${fugaSensores.length}.`;
});

document.getElementById('tallerBotonLimpiarFuga').addEventListener('click', () => {
  fugaSensores = [];
  tallerDashMemoria.textContent = '0';
  tallerResultadoDiagnostico.textContent = 'Buffer de sensores liberado.';
});
