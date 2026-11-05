"use strict";

const number = new Intl.NumberFormat("pt-BR");
const dateLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", timeZone: "UTC",
});
const svgNamespace = "http://www.w3.org/2000/svg";

function stats(id, entries) {
  const container = document.getElementById(id);
  for (const [label, value, key] of entries) {
    const item = document.createElement("div");
    item.className = key ? "stat is-key" : "stat";
    const term = document.createElement("dt");
    term.textContent = label;
    const definition = document.createElement("dd");
    definition.textContent = typeof value === "number" ? number.format(value) : value;
    item.append(term, definition);
    container.append(item);
  }
}

function table(id, rows) {
  const body = document.querySelector("#" + id + " tbody");
  for (const values of rows) {
    const row = body.insertRow();
    values.forEach((value, index) => {
      const cell = document.createElement(index === 0 ? "th" : "td");
      if (index === 0) cell.scope = "row";
      cell.textContent = typeof value === "number" ? number.format(value) : value;
      row.append(cell);
    });
  }
}

function svgElement(type, attributes, label) {
  const element = document.createElementNS(svgNamespace, type);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (label !== undefined) element.textContent = label;
  return element;
}

function capacityChart(rows) {
  const container = document.getElementById("capacity-chart");
  const render = () => {
    const width = Math.floor(container.clientWidth);
    if (!width) return;
    const height = width < 500 ? 215 : 275;
    const left = 36;
    const right = width - 6;
    const top = 15;
    const bottom = height - 30;
    const maximum = Math.max(...rows.flatMap(({arrivals, capacity, closing_queue}) => [
      arrivals, capacity, closing_queue,
    ]));
    const tick = Math.max(10, Math.ceil(maximum / 40) * 10);
    const scale = bottom - top;
    const y = value => bottom - (value / (tick * 4)) * scale;
    const step = (right - left) / rows.length;
    const bar = Math.min(31, step * .27);
    const center = index => left + step * (index + .5);
    const svg = svgElement("svg", {
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-labelledby": "svg-title svg-desc",
    });
    svg.append(
      svgElement("title", {id: "svg-title"}, "Demanda e capacidade em barras, fila ao fim do dia em linha"),
      svgElement("desc", {id: "svg-desc"}, "Gráfico em solicitações. Os valores exatos estão na tabela abaixo."),
    );

    for (let index = 0; index <= 4; index++) {
      const value = index * tick;
      svg.append(
        svgElement("line", {x1: left, x2: right, y1: y(value), y2: y(value), class: "grid-line"}),
        svgElement("text", {
          x: left - 7, y: y(value), dy: ".34em", "text-anchor": "end", class: "axis-label",
        }, number.format(value)),
      );
    }

    rows.forEach((row, index) => {
      const x = center(index);
      const demand = svgElement("rect", {
        x: x - bar - 2, y: y(row.arrivals), width: bar, height: bottom - y(row.arrivals),
        rx: 2, class: "bar-arrivals",
      });
      const capacity = svgElement("rect", {
        x: x + 2, y: y(row.capacity), width: bar, height: bottom - y(row.capacity),
        rx: 2, class: "bar-capacity",
      });
      demand.append(svgElement("title", {}, row.day + " · demanda: " + row.arrivals));
      capacity.append(svgElement("title", {}, row.day + " · capacidade: " + row.capacity));
      svg.append(demand, capacity, svgElement("text", {
        x, y: height - 6, "text-anchor": "middle", class: "day-label",
      }, row.day));
    });

    svg.append(svgElement("polyline", {
      points: rows.map((row, index) => center(index) + "," + y(row.closing_queue)).join(" "),
      class: "queue-line",
    }));
    rows.forEach((row, index) => {
      const dot = svgElement("circle", {cx: center(index), cy: y(row.closing_queue), r: 4.5, class: "queue-dot"});
      dot.append(svgElement("title", {}, row.day + " · fila final: " + row.closing_queue));
      svg.append(dot);
    });
    container.replaceChildren(svg);
  };

  render();
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(render);
    observer.observe(container);
  } else {
    window.addEventListener("resize", render);
  }
}

function capacityCase(rows) {
  const total = column => rows.reduce((sum, row) => sum + row[column], 0);
  const closing = rows.at(-1).closing_queue;
  stats("capacity-stats", [
    ["Demanda semanal", total("arrivals")],
    ["Capacidade semanal", total("capacity")],
    ["Concluídas na semana", total("completed")],
    ["Fila ao fechar a semana", closing, true],
  ]);
  table("capacity-table", rows.map(row => [
    row.day, row.opening_queue, row.arrivals, row.capacity, row.completed,
    row.closing_queue, row.unused_capacity,
  ]));
  const capacity = number.format(total("capacity"));
  const demand = number.format(total("arrivals"));
  const unused = number.format(total("unused_capacity"));
  document.getElementById("capacity-finding").textContent =
    "A semana tem capacidade para " + capacity + " solicitações e recebe " + demand +
    ". A diferença entre os dias deixa " + unused + " vagas ociosas ao longo da semana e " +
    number.format(closing) + " solicitações na fila de sexta.";
  capacityChart(rows);
}

function grainCase(rows) {
  const joined = rows.reduce((sum, row) => sum + row.joined_rows, 0);
  stats("grain-stats", [["Ordens distintas", rows.length, true], ["Linhas após LEFT JOIN", joined]]);
  table("grain-table", rows.map(row => [row.order_id, row.events, row.joined_rows]));
}

function cutoffCase(rows) {
  const sequence = field => rows.map(row => number.format(row[field])).join(" → ");
  stats("cutoff-stats", [
    ["Até o mesmo corte", sequence("count_at_cutoff"), true],
    ["No dia inteiro", sequence("daily_total")],
  ]);
  table("cutoff-table", rows.map(row => [
    dateLabel.format(new Date(row.day + "T00:00:00Z")), row.cutoff, row.count_at_cutoff, row.daily_total,
  ]));
}

async function load() {
  const status = document.getElementById("data-status");
  const regions = document.querySelectorAll(".data-region");
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Arquivo de dados indisponível.");
    const data = await response.json();
    if (data.synthetic !== true || !data.capacity?.length || !data.grain?.length || !data.cutoff?.length) {
      throw new Error("Arquivo de dados incompleto.");
    }
    regions.forEach(region => { region.hidden = false; });
    capacityCase(data.capacity);
    grainCase(data.grain);
    cutoffCase(data.cutoff);
    status.hidden = true;
  } catch {
    regions.forEach(region => { region.hidden = true; });
    status.textContent = "Os dados não carregaram. Tente atualizar a página ou consulte as consultas SQL abaixo.";
  }
}

load();
