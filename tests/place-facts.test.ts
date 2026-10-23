import { test } from "node:test";
import assert from "node:assert/strict";
import { hechosDelLugar } from "../src/lib/placeFacts";
import type { Hallazgo, TerrainMeta } from "../src/lib/lookup";

const TERRENO = { escalaMaximaMetros: 3, ventanaMetros: 300 } as TerrainMeta;
const BASE: Hallazgo = { etiqueta: "Casa", dentro: false, cercano: { zona: "A2", metros: 640 }, terreno: null, clima: null, distrito: null, barrio: null };

test("fuera del mapa oficial informa la zona más cercana sin alarmar", () => {
  const [oficial] = hechosDelLugar(BASE, TERRENO);
  assert.equal(oficial.clave, "oficial");
  assert.equal(oficial.veredicto, "Fuera");
  assert.equal(oficial.tono, "neutro");
  assert.match(oficial.detalle, /A2.*640 m/);
});

test("dentro del mapa oficial toma el tono del nivel de hoy", () => {
  const [normal] = hechosDelLugar({ ...BASE, dentro: true, zona: "B1", nivel: "normal" }, TERRENO);
  assert.equal(normal.veredicto, "Zona B1");
  assert.equal(normal.tono, "atencion");
  const [alerta] = hechosDelLugar({ ...BASE, dentro: true, zona: "B1", nivel: "alerta" }, TERRENO);
  assert.equal(alerta.tono, "alerta");
});

test("sólo aparecen los hechos que tienen dato", () => {
  assert.deepEqual(hechosDelLugar(BASE, TERRENO).map((hecho) => hecho.clave), ["oficial"]);
  const completo = hechosDelLugar({ ...BASE, clima: "alto", terreno: { estado: "bajo", metros: 1.24 }, distrito: { distrito: "OESTE", participacion: 18, mesPico: null } }, TERRENO);
  assert.deepEqual(completo.map((hecho) => hecho.clave), ["oficial", "clima", "relieve", "historial"]);
});

test("el relieve bajo muestra los metros y respeta el tope de la escala", () => {
  const bajo = hechosDelLugar({ ...BASE, terreno: { estado: "bajo", metros: 1.24 } }, TERRENO).find((hecho) => hecho.clave === "relieve");
  assert.equal(bajo?.veredicto, "1.2 m abajo");
  assert.equal(bajo?.tono, "atencion");
  const tope = hechosDelLugar({ ...BASE, terreno: { estado: "bajo", metros: 4 } }, TERRENO).find((hecho) => hecho.clave === "relieve");
  assert.equal(tope?.veredicto, "más de 3 m abajo");
  const edificado = hechosDelLugar({ ...BASE, terreno: { estado: "edificado", metros: 0 } }, TERRENO).find((hecho) => hecho.clave === "relieve");
  assert.equal(edificado?.veredicto, "Sin lectura");
});

test("el clima municipal alto o medio se marca, el bajo no", () => {
  const alto = hechosDelLugar({ ...BASE, clima: "alto" }, TERRENO).find((hecho) => hecho.clave === "clima");
  assert.equal(alto?.tono, "alerta");
  const bajo = hechosDelLugar({ ...BASE, clima: "muy bajo" }, TERRENO).find((hecho) => hecho.clave === "clima");
  assert.equal(bajo?.tono, "neutro");
  assert.equal(bajo?.veredicto, "Muy bajo");
});
