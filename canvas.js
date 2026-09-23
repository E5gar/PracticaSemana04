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
  mustard: '#EAD6A7'
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
    vy: (Math.random() - 0.5) * 90
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
    estaEnEjecucion: () => enEjecucion
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

const observadorVisibilidadLienzo = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      if (!simuladorFlota.estaEnEjecucion() && !document.body.classList.contains('simulador-pausado-manual')) {
        simuladorFlota.iniciar();
        actualizarBotonPausa();
      }
    } else {
      simuladorFlota.detener();
      actualizarBotonPausa();
    }
  });
}, { threshold: 0.15 });

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
