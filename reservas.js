"use strict";
// PARTE 2: IIFE TIPADA CON CLOSURE PARA EL ESTADO DEL FORMULARIO
const moduloReserva = (() => {
    let enviando = false;
    let ultimosErrores = {};
    const obtenerEnviando = () => enviando;
    const marcarEnviando = (valor) => {
        enviando = valor;
    };
    const guardarErrores = (errores) => {
        ultimosErrores = errores;
    };
    const obtenerErrores = () => ultimosErrores;
    return { obtenerEnviando, marcarEnviando, guardarErrores, obtenerErrores };
})();
// PARTE 3: FUNCIONES DE VALIDACIÓN TIPADAS
const validarNombre = (valor) => {
    if (valor.trim().length < 3)
        return 'Ingresa tu nombre completo.';
    return null;
};
const validarEmail = (valor) => {
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patron.test(valor))
        return 'Ingresa un correo válido.';
    return null;
};
const validarTelefono = (valor) => {
    const patron = /^9\d{8}$/;
    if (!patron.test(valor))
        return 'Ingresa un celular peruano de 9 dígitos.';
    return null;
};
const validarVehiculo = (valor) => {
    if (valor === '')
        return 'Selecciona un tipo de vehículo.';
    return null;
};
const validarFechas = (inicio, fin) => {
    const errores = { inicio: null, fin: null };
    if (!inicio)
        errores.inicio = 'Selecciona la fecha de recojo.';
    if (!fin)
        errores.fin = 'Selecciona la fecha de devolución.';
    if (inicio && fin && new Date(fin) < new Date(inicio)) {
        errores.fin = 'La devolución no puede ser antes del recojo.';
    }
    return errores;
};
const validarTerminos = (valor) => {
    if (!valor)
        return 'Debes aceptar los términos y condiciones.';
    return null;
};
const validarFormulario = (datos) => {
    const errores = {};
    const errorNombre = validarNombre(datos.nombre);
    const errorEmail = validarEmail(datos.email);
    const errorTelefono = validarTelefono(datos.telefono);
    const errorVehiculo = validarVehiculo(datos.vehiculo);
    const errorTerminos = validarTerminos(datos.terminos);
    const errorFechas = validarFechas(datos.fechaInicio, datos.fechaFin);
    if (errorNombre)
        errores.nombre = errorNombre;
    if (errorEmail)
        errores.email = errorEmail;
    if (errorTelefono)
        errores.telefono = errorTelefono;
    if (errorVehiculo)
        errores.vehiculo = errorVehiculo;
    if (errorTerminos)
        errores.terminos = errorTerminos;
    if (errorFechas.inicio)
        errores.fechaInicio = errorFechas.inicio;
    if (errorFechas.fin)
        errores.fechaFin = errorFechas.fin;
    return errores;
};
// PARTE 4: MANIPULACIÓN DEL DOM TIPADA
const obtenerCampos = (formulario) => ({
    nombre: formulario.querySelector('#campoNombre'),
    email: formulario.querySelector('#campoEmail'),
    telefono: formulario.querySelector('#campoTelefono'),
    vehiculo: formulario.querySelector('#campoVehiculo'),
    fechaInicio: formulario.querySelector('#campoInicio'),
    fechaFin: formulario.querySelector('#campoFin'),
    terminos: formulario.querySelector('#campoTerminos')
});
const leerDatos = (campos) => ({
    nombre: campos.nombre.value,
    email: campos.email.value,
    telefono: campos.telefono.value,
    vehiculo: campos.vehiculo.value,
    fechaInicio: campos.fechaInicio.value,
    fechaFin: campos.fechaFin.value,
    terminos: campos.terminos.checked
});
const pintarError = (nombreCampo, mensaje) => {
    const elementoError = document.getElementById(`error${nombreCampo.charAt(0).toUpperCase()}${nombreCampo.slice(1)}`);
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
const pintarTodosLosErrores = (errores) => {
    Object.keys(errores).forEach((campo) => pintarError(campo, errores[campo]));
};
const limpiarErrores = (campos) => {
    Object.keys(campos).forEach((campo) => pintarError(campo, undefined));
};
const mostrarMensaje = (elemento, texto, tipo) => {
    elemento.textContent = texto;
    elemento.classList.remove('exito', 'error');
    elemento.classList.add(tipo);
};
// PARTE 5: ARROW FUNCTIONS COMO MANEJADORES DE EVENTOS
document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioReserva');
    if (!formulario)
        return;
    const campos = obtenerCampos(formulario);
    const mensaje = document.getElementById('mensajeFormulario');
    const botonEnviar = document.getElementById('botonEnviar');
    const validarCampoIndividual = (nombreCampo) => {
        const datos = leerDatos(campos);
        const errores = validarFormulario(datos);
        pintarError(nombreCampo, errores[nombreCampo]);
        moduloReserva.guardarErrores(errores);
    };
    Object.keys(campos).forEach((nombreCampo) => {
        const elemento = campos[nombreCampo];
        const evento = elemento.tagName === 'SELECT' || elemento.type === 'checkbox' ? 'change' : 'blur';
        elemento.addEventListener(evento, () => validarCampoIndividual(nombreCampo));
    });
    const manejarEnvio = (evento) => {
        evento.preventDefault();
        if (moduloReserva.obtenerEnviando())
            return;
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
        setTimeout(() => {
            moduloReserva.marcarEnviando(false);
            botonEnviar.disabled = false;
            botonEnviar.textContent = 'Enviar solicitud';
            mostrarMensaje(mensaje, `Gracias, ${datos.nombre.split(' ')[0]}. Te contactaremos al ${datos.telefono} para confirmar tu reserva.`, 'exito');
            formulario.reset();
            limpiarErrores(campos);
        }, 700);
    };
    formulario.addEventListener('submit', manejarEnvio);
});
