let bancoPreguntas = [];
let respuestasSeleccionadas = [];

// Función principal de inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Obtenemos el parámetro de la URL, ej: ?ruta=grado/3/ciencia/mes/mayo
    const urlParams = new URLSearchParams(window.location.search);
    const ruta = urlParams.get('ruta');

    if (!ruta) {
        mostrarError("No se especificó ninguna ruta de cuestionario en la URL.");
        return;
    }

    try {
        const respuesta = await fetch(`dato/${ruta}.json`);
        if (!respuesta.ok) throw new Error('Archivo no encontrado');
        
        const datos = await respuesta.json();
        
        // Cargar metadatos
        document.getElementById('titulo-curso').textContent = datos.titulo;
        document.getElementById('descripcion-curso').textContent = datos.descripcion;
        
        // Cargar preguntas
        bancoPreguntas = datos.preguntas;
        respuestasSeleccionadas = new Array(bancoPreguntas.length).fill(null);
        
        renderizarPreguntas();
        document.getElementById('panel-evaluacion').style.display = 'block';

    } catch (error) {
        console.error(error);
        mostrarError("Hubo un problema al cargar los datos del curso.");
    }
});

function mostrarError(mensaje) {
    document.getElementById('lista-preguntas').innerHTML = '';
    document.getElementById('titulo-curso').textContent = "Error";
    document.getElementById('descripcion-curso').textContent = "";
    const panelError = document.getElementById('error-panel');
    panelError.style.display = 'block';
    panelError.querySelector('p').textContent = mensaje;
}

function renderizarPreguntas() {
    const contenedor = document.getElementById('lista-preguntas');
    contenedor.innerHTML = '';

    bancoPreguntas.forEach((item, qIndex) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-pregunta';
        tarjeta.id = `pregunta-card-${qIndex}`;

        tarjeta.innerHTML = `
            <div class="badges">
                <span class="tema-badge">${item.tema}</span>
                <span class="nivel-badge">${item.nivel}</span>
            </div>
            <div class="pregunta-texto">${qIndex + 1}. ${item.pregunta}</div>
            <button class="btn-pista" onclick="togglePista(${qIndex})">👁️ Ver Pista</button>
            <div class="pista-texto" id="pista-${qIndex}">${item.pista}</div>
            <div class="opciones" id="opciones-${qIndex}"></div>
        `;
        contenedor.appendChild(tarjeta);

        const contenedorOpciones = document.getElementById(`opciones-${qIndex}`);
        item.opciones.forEach((opcion, optIndex) => {
            const btn = document.createElement('button');
            btn.className = 'opcion';
            btn.id = `btn-${qIndex}-${optIndex}`;
            btn.textContent = opcion;
            btn.onclick = () => seleccionarOpcion(qIndex, optIndex);
            contenedorOpciones.appendChild(btn);
        });
    });
}

function togglePista(index) {
    const pista = document.getElementById(`pista-${index}`);
    pista.style.display = (pista.style.display === 'block') ? 'none' : 'block';
}

function seleccionarOpcion(qIndex, optIndex) {
    // RIGOR: Si la pregunta ya fue respondida, ignoramos el clic para evitar ensayo y error.
    if (respuestasSeleccionadas[qIndex] !== null) return;

    respuestasSeleccionadas[qIndex] = optIndex;
    const item = bancoPreguntas[qIndex];
    
    // Obtener los botones de esta pregunta
    const botones = document.getElementById(`opciones-${qIndex}`).getElementsByClassName('opcion');
    
    // Bloquear todos los botones de esta pregunta para fijar la respuesta
    for (let btn of botones) {
        btn.disabled = true;
    }

    const btnSeleccionado = document.getElementById(`btn-${qIndex}-${optIndex}`);
    const btnCorrecto = document.getElementById(`btn-${qIndex}-${item.respuestaCorrecta}`);

    // Evaluación visual inmediata
    if (optIndex === item.respuestaCorrecta) {
        btnSeleccionado.classList.add('correcto');
    } else {
        btnSeleccionado.classList.add('incorrecto');
        btnCorrecto.classList.add('correcto'); // Mostramos cuál era la correcta para que aprenda
    }

    verificarProgresoGlobal();
}

function verificarProgresoGlobal() {
    // Si ya no quedan respuestas en null, cambiamos el texto del botón final
    if (!respuestasSeleccionadas.includes(null)) {
        document.getElementById('btn-evaluar').textContent = "Ver mi resultado final";
    }
}

function evaluarRespuestas() {
    // Verificación final en caso de que intenten ver resultados antes de terminar
    if (respuestasSeleccionadas.includes(null)) {
        alert("¡Espera! Aún te faltan preguntas por responder. Revisa la lista.");
        return;
    }

    let puntaje = 0;
    
    // Calcular el puntaje matemáticamente
    bancoPreguntas.forEach((item, qIndex) => {
        if (respuestasSeleccionadas[qIndex] === item.respuestaCorrecta) {
            puntaje++;
        }
    });

    // Mostrar panel de resultados finales
    document.getElementById('btn-evaluar').style.display = 'none';
    document.getElementById('resultados-finales').style.display = 'block';
    document.getElementById('puntaje-texto').textContent = `${puntaje} / ${bancoPreguntas.length}`;
    
    let mensaje = "";
    const porcentaje = (puntaje / bancoPreguntas.length) * 100;
    if (porcentaje === 100) mensaje = "¡Excelente! Un conocimiento perfecto.";
    else if (porcentaje >= 60) mensaje = "¡Buen trabajo! Has completado el repaso.";
    else mensaje = "Sigue practicando. Lo importante es aprender de los errores.";
    
    document.getElementById('mensaje-final').textContent = mensaje;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}