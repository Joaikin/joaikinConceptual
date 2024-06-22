// Configuración del diseño (ejemplo: tree)
const width = 960;
const height = 800;
const treeLayout = d3.tree()
    .size([height, width]) // Orientación vertical
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth); // Ajusta la separación entre nodos

// Crear el contenedor SVG
const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// Variable para controlar la solicitud en curso
let isLoading = false;

// Cargar datos JSON
d3.json("homo_ludens_2.json").then(data => {
    if (isLoading) return; // Evitar múltiples solicitudes
    isLoading = true;

    // Crear la jerarquía (adaptada a tu estructura)
    const root = d3.hierarchy(data[0], d => d.subnodos);
    root.x0 = height / 2; // Posición inicial del nodo raíz (ajustada para vertical)
    root.y0 = 0;

    // Colapsar todos los nodos excepto el raíz al inicio
    root.children.forEach(collapse);

    update(root); // Dibujar el mapa inicial

    // Función para colapsar/expandir nodos
    function toggleChildren(event, d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }

    // Función para colapsar un nodo y sus descendientes
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    // Función para actualizar el mapa
    function update(source) {
        // Recalcular el diseño del árbol
        treeLayout(root);

        // Actualizar la posición de los nodos y enlaces
        const node = svg.selectAll(".node")
            .data(root.descendants(), d => d.data.valor); // Usar valor como identificador único

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0}, ${source.x0})`) // Invertimos x e y

        // Calcular el ancho del rectángulo en función del texto
        nodeEnter.each(function (d) {
            const nodeText = d3.select(this).append("text")
                .attr("dy", "0.31em")
                .text(d.data.valor)
                .each(function () { d.width = this.getComputedTextLength() + 20; }); // Padding de 20px

            d3.select(this).insert("rect", "text") // Insertar el rectángulo antes del texto
                .attr("width", d.width)
                .attr("height", 20)
                .attr("x", -d.width / 2) // Centrar horizontalmente
                .attr("y", -10)
                .attr("rx", 5) // Bordes redondeados
                .attr("ry", 5)
                .on("click", toggleChildren); // Agregar evento de clic al rectángulo

            nodeText // Mover el texto al frente
                .raise();
        });

        // TRANSICIÓN DE NODOS EXISTENTES
        node
            .transition()
            .duration(500)
            .attr("transform", d => `translate(${d.y}, ${d.x})`); // Invertimos x e y

        // TRANSICIÓN DE NODOS QUE SALEN
        node.exit()
            .transition()
            .duration(500)
            .attr("transform", d => `translate(${source.y}, ${source.x})`) // Invertimos x e y
            .remove();

        // ENLACES (NUEVOS, EXISTENTES Y SALIENTES)
        const link = svg.selectAll(".link")
            .data(root.links(), d => d.target.data.valor);

        link.enter().append("path")
            .attr("class", "link")
            .attr("d", d3.linkHorizontal()
                .x(d => source.y0)
                .y(d => source.x0)) // Invertimos x e y
            .merge(link)
            .transition()
            .duration(500)
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x)); // Invertimos x e y

        link.exit()
            .transition()
            .duration(500)
            .attr("d", d3.linkHorizontal()
                .x(d => source.y)
                .y(d => source.x)) // Invertimos x e y
            .remove();

        // Guardar las posiciones antiguas para la animación
        node.each(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        isLoading = false; // Marcar la solicitud como finalizada
    }
}).catch(error => {
    console.error('Error al cargar el JSON:', error);
    isLoading = false;
});
