document.addEventListener('DOMContentLoaded', () => {
    let tareas = [];
    let tareaSeleccionada = null;

    // Referencias a elementos del DOM y modales de Bootstrap
    const modalComentario = new bootstrap.Modal(document.getElementById('modalComentario'));
    const inputComentario = document.getElementById('inputComentario');
    const btnGuardarComentario = document.getElementById('guardarComentario');
    const btnNuevaTarea = document.getElementById('btnNuevaTarea');
    const btnToggleDark = document.getElementById('toggleDark');

    // Modo oscuro/claro
    btnToggleDark.addEventListener('click', () => {
        document.body.classList.toggle('bg-dark');
        document.body.classList.toggle('text-light');
        document.querySelectorAll('.card').forEach(card => {
            card.classList.toggle('bg-dark');
            card.classList.toggle('text-light');
        });
        document.querySelectorAll('.col').forEach(col => {
            col.classList.toggle('bg-dark');
            col.classList.toggle('text-light');
        });
    });

    // Guardar tareas en localStorage
    function guardarTareas() {
        localStorage.setItem('tareas', JSON.stringify(tareas));
    }

    // Cargar tareas desde localStorage
    function cargarTareas() {
        tareas = JSON.parse(localStorage.getItem('tareas')) || [];
        renderTareas();
        activarDragAndDrop();
    }

    // Renderizar tareas y actualizar contadores
    function renderTareas() {
        const estados = [
            { estado: 'pendiente', id: 'pendiente', countId: 'count-pendiente' },
            { estado: 'en progreso', id: 'en-progreso', countId: 'count-en-progreso' },
            { estado: 'terminada', id: 'terminada', countId: 'count-terminada' }
        ];
        estados.forEach(({ estado, id, countId }) => {
            const columna = document.querySelector(`#${id} .lista-tareas`);
            const tareasFiltradas = tareas.filter(t => t.estado === estado);
            columna.innerHTML = '';
            tareasFiltradas.forEach(t => {
                const card = document.createElement('div');
                card.className = 'card mb-2 card-trello card-added';
                card.dataset.id = t.id; // Necesario para drag & drop

                // Etiqueta de prioridad
                let badgePrioridad = '';
                if (t.prioridad === 'alta') badgePrioridad = '<span class="badge bg-danger ms-2">Alta</span>';
                else if (t.prioridad === 'media') badgePrioridad = '<span class="badge bg-warning text-dark ms-2">Media</span>';
                else if (t.prioridad === 'baja') badgePrioridad = '<span class="badge bg-success ms-2">Baja</span>';

                // Botón para eliminar la tarea (siempre visible)
                let btnEliminar = `<button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${t.id}" title="Eliminar tarea"><i class="bi bi-trash"></i> Eliminar</button>`;

                // Avatar y responsable
                let avatar = `
                    <span class="badge bg-secondary d-flex align-items-center gap-2" style="font-size:1em;">
                        <img src="https://randomuser.me/api/portraits/lego/${t.id % 10}.jpg"
                            alt="avatar" width="24" height="24" class="me-1 rounded-circle border border-light">
                        ${t.responsable}
                    </span>
                `;

                // Estructura de la tarjeta: botón eliminar arriba a la derecha
                card.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <h5 class="card-title mb-0">${t.titulo} ${badgePrioridad}</h5>
                            </div>
                            ${btnEliminar}
                        </div>
                        <p class="card-text">${t.descripcion}</p>
                        ${avatar}
                        <button class="btn btn-sm btn-outline-primary mt-2 btn-comentario" data-id="${t.id}">Agregar comentario</button>
                        <div class="comentarios mt-2">
                            ${(t.comentarios || []).map(c => `<div class="alert alert-info p-1 mb-1">${c}</div>`).join('')}
                        </div>
                    </div>
                `;
                columna.appendChild(card);

                // Animación sutil al agregar/mover
                setTimeout(() => card.classList.remove('card-added'), 500);
            });
            // Actualiza el contador de tareas en el header de cada columna
            document.getElementById(countId).textContent = tareasFiltradas.length;

            // Asigna eventos a los botones de comentario de cada tarjeta
            columna.querySelectorAll('.btn-comentario').forEach(btn => {
                btn.addEventListener('click', () => {
                    tareaSeleccionada = tareas.find(t => t.id == btn.dataset.id);
                    inputComentario.value = '';
                    modalComentario.show();
                });
            });

            // Asigna eventos a los botones de eliminar tarea de cada tarjeta
            columna.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('¿Seguro que deseas eliminar esta tarea?')) {
                        const id = btn.dataset.id;
                        tareas = tareas.filter(t => t.id != id);
                        guardarTareas();
                        cargarTareas();
                    }
                });
            });
        });
    }

    // Drag & Drop entre columnas usando SortableJS
    function activarDragAndDrop() {
        ['pendiente', 'en-progreso', 'terminada'].forEach(id => {
            const el = document.querySelector(`#${id} .lista-tareas`);
            if (!el) return;
            new Sortable(el, {
                group: 'tareas',
                animation: 150,
                onAdd: function (evt) {
                    const tareaId = evt.item.dataset.id;
                    let nuevoEstado = '';
                    if (id === 'pendiente') nuevoEstado = 'pendiente';
                    if (id === 'en-progreso') nuevoEstado = 'en progreso';
                    if (id === 'terminada') nuevoEstado = 'terminada';
                    const tarea = tareas.find(t => t.id == tareaId);
                    if (tarea) {
                        tarea.estado = nuevoEstado;
                        guardarTareas();
                        cargarTareas();
                    }
                }
            });
        });
    }

    // Evento para guardar un comentario en la tarea seleccionada
    btnGuardarComentario.addEventListener('click', () => {
        if (tareaSeleccionada && inputComentario.value.trim()) {
            const nuevoComentario = inputComentario.value.trim();
            const comentarios = tareaSeleccionada.comentarios || [];
            comentarios.push(nuevoComentario);
            tareaSeleccionada.comentarios = comentarios;
            guardarTareas();
            modalComentario.hide();
            cargarTareas();
        }
    });

    // Evento para agregar una nueva tarea (solo prioridad, sin urgente)
    btnNuevaTarea.addEventListener('click', () => {
        const titulo = prompt('Título de la tarea:');
        if (!titulo) return;
        const descripcion = prompt('Descripción de la tarea:');
        if (!descripcion) return;
        const responsable = prompt('Responsable:');
        if (!responsable) return;
        const prioridad = prompt('Prioridad (alta, media, baja):', 'media').toLowerCase();

        // Generar un id único
        const id = Date.now();

        tareas.push({
            id,
            titulo,
            descripcion,
            responsable,
            estado: 'pendiente',
            comentarios: [],
            prioridad
        });
        guardarTareas();
        cargarTareas();
    });

    // Inicializa la app cargando las tareas al cargar la página
    cargarTareas();
});