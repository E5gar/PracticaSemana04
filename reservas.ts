// PARTE 1: TIPOS E INTERFACES
interface DatosReserva {
  nombre: string;
  email: string;
  telefono: string;
  vehiculo: string;
  fechaInicio: string;
  fechaFin: string;
  terminos: boolean;
}

type CampoReserva = keyof DatosReserva;

type ErroresReserva = Partial<Record<CampoReserva, string>>;

interface CamposFormulario {
  nombre: HTMLInputElement;
  email: HTMLInputElement;
  telefono: HTMLInputElement;
  vehiculo: HTMLSelectElement;
  fechaInicio: HTMLInputElement;
  fechaFin: HTMLInputElement;
  terminos: HTMLInputElement;
}

// PARTE 2: IIFE TIPADA CON CLOSURE PARA EL ESTADO DEL FORMULARIO
const moduloReserva = (() => {
  let enviando = false;
  let ultimosErrores: ErroresReserva = {};

  const obtenerEnviando = (): boolean => enviando;
  const marcarEnviando = (valor: boolean): void => {
    enviando = valor;
  };
  const guardarErrores = (errores: ErroresReserva): void => {
    ultimosErrores = errores;
  };
  const obtenerErrores = (): ErroresReserva => ultimosErrores;

  return { obtenerEnviando, marcarEnviando, guardarErrores, obtenerErrores };
})();

// PARTE 3: FUNCIONES DE VALIDACIÓN TIPADAS
const validarNombre = (valor: string): string | null => {
  if (valor.trim().length < 3) return 'Ingresa tu nombre completo.';
  return null;
};

const validarEmail = (valor: string): string | null => {
  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!patron.test(valor)) return 'Ingresa un correo válido.';
  return null;
};

const validarTelefono = (valor: string): string | null => {
  const patron = /^9\d{8}$/;
  if (!patron.test(valor)) return 'Ingresa un celular peruano de 9 dígitos.';
  return null;
};

const validarVehiculo = (valor: string): string | null => {
  if (valor === '') return 'Selecciona un tipo de vehículo.';
  return null;
};

const validarFechas = (inicio: string, fin: string): { inicio: string | null; fin: string | null } => {
  const errores: { inicio: string | null; fin: string | null } = { inicio: null, fin: null };
  if (!inicio) errores.inicio = 'Selecciona la fecha de recojo.';
  if (!fin) errores.fin = 'Selecciona la fecha de devolución.';
  if (inicio && fin && new Date(fin) < new Date(inicio)) {
    errores.fin = 'La devolución no puede ser antes del recojo.';
  }
  return errores;
};

const validarTerminos = (valor: boolean): string | null => {
  if (!valor) return 'Debes aceptar los términos y condiciones.';
  return null;
};

const validarFormulario = (datos: DatosReserva): ErroresReserva => {
  const errores: ErroresReserva = {};
  const errorNombre = validarNombre(datos.nombre);
  const errorEmail = validarEmail(datos.email);
  const errorTelefono = validarTelefono(datos.telefono);
  const errorVehiculo = validarVehiculo(datos.vehiculo);
  const errorTerminos = validarTerminos(datos.terminos);
  const errorFechas = validarFechas(datos.fechaInicio, datos.fechaFin);

  if (errorNombre) errores.nombre = errorNombre;
  if (errorEmail) errores.email = errorEmail;
  if (errorTelefono) errores.telefono = errorTelefono;
  if (errorVehiculo) errores.vehiculo = errorVehiculo;
  if (errorTerminos) errores.terminos = errorTerminos;
  if (errorFechas.inicio) errores.fechaInicio = errorFechas.inicio;
  if (errorFechas.fin) errores.fechaFin = errorFechas.fin;

  return errores;
};

// PARTE 4: MANIPULACIÓN DEL DOM TIPADA
const obtenerCampos = (formulario: HTMLFormElement): CamposFormulario => ({
  nombre: formulario.querySelector('#campoNombre') as HTMLInputElement,
  email: formulario.querySelector('#campoEmail') as HTMLInputElement,
  telefono: formulario.querySelector('#campoTelefono') as HTMLInputElement,
  vehiculo: formulario.querySelector('#campoVehiculo') as HTMLSelectElement,
  fechaInicio: formulario.querySelector('#campoInicio') as HTMLInputElement,
  fechaFin: formulario.querySelector('#campoFin') as HTMLInputElement,
  terminos: formulario.querySelector('#campoTerminos') as HTMLInputElement
});

const leerDatos = (campos: CamposFormulario): DatosReserva => ({
  nombre: campos.nombre.value,
  email: campos.email.value,
  telefono: campos.telefono.value,
  vehiculo: campos.vehiculo.value,
  fechaInicio: campos.fechaInicio.value,
  fechaFin: campos.fechaFin.value,
  terminos: campos.terminos.checked
});

const pintarError = (nombreCampo: CampoReserva, mensaje: string | undefined): void => {
  const elementoError = document.getElementById(
    `error${nombreCampo.charAt(0).toUpperCase()}${nombreCampo.slice(1)}`
  );
  const elementoCampo = document.getElementById(`campo${nombreCampo.charAt(0).toUpperCase()}${nombreCampo.slice(1)}`);
  const contenedor = elementoCampo ? elementoCampo.closest('.campo') : null;

  if (elementoError) {
    elementoError.textContent = mensaje ?? '';
  }
  if (contenedor) {
    contenedor.classList.toggle('campo--invalido', Boolean(mensaje));
  }
  if (elementoCampo) {
    elementoCampo.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  }
};

const pintarTodosLosErrores = (errores: ErroresReserva): void => {
  (Object.keys(errores) as CampoReserva[]).forEach((campo) => pintarError(campo, errores[campo]));
};

const limpiarErrores = (campos: CamposFormulario): void => {
  (Object.keys(campos) as CampoReserva[]).forEach((campo) => pintarError(campo, undefined));
};

const mostrarMensaje = (elemento: HTMLElement, texto: string, tipo: 'exito' | 'error'): void => {
  elemento.textContent = texto;
  elemento.classList.remove('exito', 'error');
  elemento.classList.add(tipo);
};

// PARTE 5: ARROW FUNCTIONS COMO MANEJADORES DE EVENTOS
document.addEventListener('DOMContentLoaded', (): void => {
  const formulario = document.getElementById('formularioReserva') as HTMLFormElement | null;
  if (!formulario) return;

  const campos = obtenerCampos(formulario);
  const mensaje = document.getElementById('mensajeFormulario') as HTMLElement;
  const botonEnviar = document.getElementById('botonEnviar') as HTMLButtonElement;

  const validarCampoIndividual = (nombreCampo: CampoReserva): void => {
    const datos = leerDatos(campos);
    const errores = validarFormulario(datos);
    pintarError(nombreCampo, errores[nombreCampo]);
    moduloReserva.guardarErrores(errores);
  };

  (Object.keys(campos) as CampoReserva[]).forEach((nombreCampo) => {
    const elemento = campos[nombreCampo];
    const evento = elemento.tagName === 'SELECT' || elemento.type === 'checkbox' ? 'change' : 'blur';
    elemento.addEventListener(evento, () => validarCampoIndividual(nombreCampo));
  });

  const manejarEnvio = (evento: SubmitEvent): void => {
    evento.preventDefault();
    if (moduloReserva.obtenerEnviando()) return;

    const datos = leerDatos(campos);
    const errores = validarFormulario(datos);
    moduloReserva.guardarErrores(errores);
    limpiarErrores(campos);
    pintarTodosLosErrores(errores);

    if (Object.keys(errores).length > 0) {
      mostrarMensaje(mensaje, 'Revisa los campos marcados en rojo.', 'error');
      return;
    }

    moduloReserva.marcarEnviando(true);
    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Enviando...';

    setTimeout((): void => {
      moduloReserva.marcarEnviando(false);
      botonEnviar.disabled = false;
      botonEnviar.textContent = 'Enviar solicitud';
      mostrarMensaje(
        mensaje,
        `Gracias, ${datos.nombre.split(' ')[0]}. Te contactaremos al ${datos.telefono} para confirmar tu reserva.`,
        'exito'
      );
      formulario.reset();
      limpiarErrores(campos);
    }, 700);
  };

  formulario.addEventListener('submit', manejarEnvio as EventListener);
});
