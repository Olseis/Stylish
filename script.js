document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.querySelector(".galeria");
    const buscador = document.getElementById("buscador");
    const mensajeVacio = document.getElementById("no-resultados");

    // ✅ Cargar JSON
    fetch("rides.json")
        .then(res => res.json())
        .then(rides => {
            mostrarRides(rides);

            // ✅ Buscador
            buscador.addEventListener("input", () => {
                const texto = buscador.value.toLowerCase();
                const tarjetas = document.querySelectorAll(".tarjeta-item");

                let coincidencias = 0;

                tarjetas.forEach(t => {
                    const contenido = t.innerText.toLowerCase();
                    if (contenido.includes(texto)) {
                        t.style.display = "block";
                        coincidencias++;
                    } else {
                        t.style.display = "none";
                    }
                });

                mensajeVacio.style.display = (coincidencias === 0) ? "block" : "none";
            });
        });

    // ✅ Mostrar elementos en pantalla
    function mostrarRides(lista) {
        lista.forEach(item => {
            const card = document.createElement("div");
            card.className = "tarjeta-item";

            card.innerHTML = `
                <img src="${item.imagen}">
                <div class="tarjeta-info">
                    <small>${item.categoria}</small>
                    <h3>${item.nombre}</h3>
                    <p>${item.color}</p>
                    <p class="rareza ${item.rarity.toLowerCase()}">${item.rarity}</p>
                </div>
            `;

            contenedor.insertBefore(card, mensajeVacio);
        });

        mensajeVacio.style.display = "none";
    }
});
``