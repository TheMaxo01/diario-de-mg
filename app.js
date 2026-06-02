// --- 1. CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDyRBuJXWpniAbr0CJjomxP-J5F1MoDa5U",
    authDomain: "diario-de-mg.firebaseapp.com",
    projectId: "diario-de-mg",
    storageBucket: "diario-de-mg.firebasestorage.app",
    messagingSenderId: "383830504922",
    appId: "1:383830504922:web:e9ce53797c83b8a0cbbce3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 2. INICIALIZAR EMAILJS ---
emailjs.init("DQcHeeluoCB9YgFkz"); 

// --- 3. ELEMENTOS DEL DOM ---
const btnTheme = document.getElementById('btn-theme');
const btnRegistro = document.getElementById('btn-registro');
const inputNombreRegistro = document.getElementById('nombre');
const inputContrasena = document.getElementById('contrasena'); 
const cajaRegistro = document.querySelector('.caja-registro');
const btnPublicar = document.getElementById('btn-publicar');
const nuevoTitulo = document.getElementById('nuevo-titulo');
const nuevoCuerpo = document.getElementById('nuevo-cuerpo');
const contenedorPosts = document.querySelector('.contenedor-posts');

let esAdmin = false;

function obtenerFechaHoraActual() {
    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const dia = ahora.getDate().toString().padStart(2, '0');
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const anio = ahora.getFullYear();
    return `${horas}:${minutos}Hs del ${dia}/${mes}/${anio}`;
}

// MODO OSCURO
btnTheme.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    btnTheme.textContent = document.body.classList.contains('dark-mode') ? "Modo claro" : "modo oscuro";
});

// SEGURIDAD: REGISTRO
btnRegistro.addEventListener('click', function() {
    const nombreIngresado = inputNombreRegistro.value.trim();
    const contrasenaIngresada = inputContrasena.value.trim();

    const MI_USUARIO = "MG"; 
    const MI_CONTRASENA = "mg123"; 

    if (nombreIngresado === MI_USUARIO && contrasenaIngresada === MI_CONTRASENA) {
        document.body.classList.add('admin-mode');
        esAdmin = true;
        cajaRegistro.innerHTML = `<p>Conectado como: <b class="rainbow-text">MG</b></p>`;
        
        document.querySelectorAll('.nombre-comentario-input').forEach(input => {
            input.value = "MG";
            input.disabled = true;
        });
    } else {
        alert("Acceso denegado. Usuario o contraseña incorrectos.");
        inputContrasena.value = ""; 
    }
});

// --- 4. PUBLICAR UN POST Y AVISAR A LOS SUSCRIPTORES ---
btnPublicar.addEventListener('click', function() {
    const titulo = nuevoTitulo.value.trim();
    const cuerpo = nuevoCuerpo.value.trim();

    if (titulo !== "" && cuerpo !== "") {
        db.collection("posts").add({
            titulo: titulo,
            cuerpo: cuerpo,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            comentarios: []
        }).then(() => {
            nuevoTitulo.value = "";
            nuevoCuerpo.value = "";
            alert("¡Post publicado correctamente! Enviando avisos...");

            db.collection("suscriptores").get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const emailSuscriptor = doc.data().email;
                    
                    emailjs.send("service_gzpqman", "template_lx3i8xk", {
                        destinatario: emailSuscriptor,
                        titulo: titulo
                    }).then(() => {
                        console.log("Aviso enviado a: " + emailSuscriptor);
                    }).catch((error) => {
                        console.error("Error al mandar mail a " + emailSuscriptor + ": ", error);
                    });
                });
            });

        }).catch((error) => {
            alert("Error al publicar: " + error.message);
        });
    } else {
        alert("Escribí un título y un cuerpo para publicar.");
    }
});

// --- 5. LEER Y MOSTRAR POSTS EN TIEMPO REAL ---
db.collection("posts").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    let htmlPosts = "<h2>POSTS</h2>";

    snapshot.forEach((doc) => {
        const post = doc.data();
        const postId = doc.id;

        let fechaPostFormateada = "Guardando..."; 
        if (post.timestamp) {
            const fecha = post.timestamp.toDate();
            const horas = fecha.getHours().toString().padStart(2, '0');
            const minutos = fecha.getMinutes().toString().padStart(2, '0');
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            const anio = fecha.getFullYear();
            fechaPostFormateada = `${horas}:${minutos}Hs del ${dia}/${mes}/${anio}`;
        }

        let comentariosHtml = "";
        if (post.comentarios) {
            post.comentarios.forEach((com, index) => {
                let firma = com.autor === "MG" ? `<span class="rainbow-text">~ MG</span>` : `<b>~ ${com.autor}</b>`;
                comentariosHtml += `<p>"${com.texto}" ${firma} | <b>${com.hora}</b> <button class="btn-borrar borrar-comentario" data-post-id="${postId}" data-comment-index="${index}" title="Borrar comentario">❌</button></p>`;
            });
        }

        htmlPosts += `
            <article class="post-individual">
                <h3 class="titulo-post">
                    <span class="texto-titulo">${post.titulo}</span>
                    <div class="controles-titulo">
                        <span class="fecha-post">${fechaPostFormateada}</span>
                        <button class="btn-borrar borrar-post" data-id="${postId}" title="Borrar post">❌</button>
                    </div>
                </h3>
                <p class="texto-post">"${post.cuerpo}"</p>

                <div class="caja-comentarios">
                    <h4>-Comentarios:</h4>
                    ${comentariosHtml}
                </div>

                <div class="nuevo-comentario">
                    <div class="input-comentario">
                        <label>Comentar:</label>
                        <textarea class="comentar-input" rows="1"></textarea>
                    </div>
                    <div class="input-comentario">
                        <label>Nombre:</label>
                        <input type="text" class="nombre-comentario-input" ${esAdmin ? 'value="MG" disabled' : ''}>
                    </div>
                    <button class="btn-comentar" data-id="${postId}">COMENTAR</button>
                </div>
            </article>
        `;
    });

    contenedorPosts.innerHTML = htmlPosts;
});

// --- 6. ACCIONES EN LOS POSTS (Comentar y Borrar) ---
document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-comentar')) {
        const postId = e.target.getAttribute('data-id');
        const article = e.target.closest('.post-individual');
        const inputComentario = article.querySelector('.comentar-input');
        const inputNombre = article.querySelector('.nombre-comentario-input');

        const texto = inputComentario.value.trim();
        let autor = inputNombre.value.trim();
        if (esAdmin) autor = "MG";

        if (texto !== "" && autor !== "") {
            const horaComentario = obtenerFechaHoraActual();
            const nuevoComentario = { texto: texto, autor: autor, hora: horaComentario };
            
            const tituloPost = article.querySelector('.texto-titulo').textContent;

            db.collection("posts").doc(postId).update({
                comentarios: firebase.firestore.FieldValue.arrayUnion(nuevoComentario)
            }).then(() => {
                
                // === NOTIFICACIÓN POR EMAIL AL ADMIN ===
                emailjs.send("service_gzpqman", "template_0c1z29q", {
                    post: tituloPost,
                    comentario: texto,
                    nombre: autor,
                    hora: horaComentario
                }).then(() => {
                    console.log("Notificación de comentario enviada al administrador.");
                }).catch((error) => {
                    console.error("Error al enviar notificación al admin: ", error);
                });
                
            });

            inputComentario.value = "";
            inputComentario.style.height = 'auto';
        } else {
            alert("Escribí un comentario y asegurate de tener un nombre puesto.");
        }
    }

    if (e.target.classList.contains('borrar-post')) {
        const postId = e.target.getAttribute('data-id');
        if (confirm("¿Seguro que querés borrar este post entero de la base de datos?")) {
            db.collection("posts").doc(postId).delete();
        }
    }

    if (e.target.classList.contains('borrar-comentario')) {
        const postId = e.target.getAttribute('data-post-id');
        const index = e.target.getAttribute('data-comment-index');
        db.collection("posts").doc(postId).get().then(doc => {
            let datos = doc.data();
            datos.comentarios.splice(index, 1);
            db.collection("posts").doc(postId).update({ comentarios: datos.comentarios });
        });
    }
});

// TEXTAREA AUTO-RESIZE
document.body.addEventListener('input', function(e) {
    if (e.target.classList.contains('comentar-input') || e.target.id === 'nuevo-cuerpo') {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    }
});

// --- 7. GESTIÓN DE SUSCRIPTORES ---
const inputEmail = document.getElementById('email-suscripcion');

document.getElementById('btn-suscribir').addEventListener('click', function() {
    const email = inputEmail.value.trim();
    if (email.includes('@') && email.includes('.')) {
        db.collection("suscriptores").doc(email).set({
            email: email,
            fechaSuscripcion: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert(`¡Genial! El correo ${email} se guardó en la lista de suscripciones.`);
            inputEmail.value = "";
        }).catch(error => {
            alert("Hubo un error al suscribirse: " + error.message);
        });
    } else {
        alert("Por favor, ingresá un correo electrónico válido.");
    }
});

document.getElementById('btn-desuscribir').addEventListener('click', function() {
    const email = inputEmail.value.trim();
    if (email.includes('@') && email.includes('.')) {
        const confirmacion = confirm(`¿Seguro que querés dar de baja el correo ${email}?`);
        if (confirmacion) {
            db.collection("suscriptores").doc(email).delete().then(() => {
                alert("Te has desuscrito correctamente. Ya no estás en la lista de la base de datos.");
                inputEmail.value = "";
            }).catch(error => {
                alert("Hubo un error al darse de baja: " + error.message);
            });
        }
    } else {
        alert("Para desuscribirte, primero escribí tu correo en la caja y luego tocá 'Dar de baja'.");
    }
});