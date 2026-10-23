import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PLACES, addPlace, parsePlaces, removePlace, renamePlace, serializePlaces, type Place } from "../src/lib/places";

const HOME_PLACE: Place = { id: "casa", name: "Casa", lat: -32.9468, lon: -60.6393 };
const WORK_PLACE: Place = { id: "trabajo", name: "Trabajo", lat: -32.9552, lon: -60.6723 };

test("saving and reading keeps name and coordinates", () => {
  assert.deepEqual(parsePlaces(serializePlaces([HOME_PLACE, WORK_PLACE])), [HOME_PLACE, WORK_PLACE]);
});

test("corrupt or foreign data returns an empty list without throwing", () => {
  assert.deepEqual(parsePlaces(null), []);
  assert.deepEqual(parsePlaces("{no es json"), []);
  assert.deepEqual(parsePlaces(JSON.stringify({ home: HOME_PLACE })), []);
  assert.deepEqual(parsePlaces(JSON.stringify([{ ...HOME_PLACE, lat: "-32.9" }, { ...HOME_PLACE, id: "x", name: "  " }])), []);
});

test("points outside Rosario are dropped and the list is capped", () => {
  const good = Array.from({ length: MAX_PLACES + 2 }, (_, i) => ({ ...HOME_PLACE, id: `l${i}`, lat: HOME_PLACE.lat - i * 0.001 }));
  const cordoba = { ...HOME_PLACE, id: "cba", lat: -31.42, lon: -64.18 };
  const read = parsePlaces(JSON.stringify([cordoba, ...good]));
  assert.equal(read.length, MAX_PLACES);
  assert.ok(!read.some((place) => place.id === "cba"));
});

test("adding rejects duplicates within 30 m, outside points, empty names and a full list", () => {
  assert.equal(addPlace([HOME_PLACE], { ...WORK_PLACE }).error, null);
  assert.equal(addPlace([HOME_PLACE], { ...HOME_PLACE, id: "otra", lat: HOME_PLACE.lat + 0.0001 }).error, "duplicate");
  assert.equal(addPlace([], { ...HOME_PLACE, lat: -34.6, lon: -58.4 }).error, "outside");
  assert.equal(addPlace([], { ...HOME_PLACE, name: "   " }).error, "name");
  const full = Array.from({ length: MAX_PLACES }, (_, i) => ({ ...HOME_PLACE, id: `l${i}`, lat: HOME_PLACE.lat - i * 0.002 }));
  const result = addPlace(full, WORK_PLACE);
  assert.equal(result.error, "full");
  assert.equal(result.places.length, MAX_PLACES);
});

test("removing and renaming do not mutate the original list", () => {
  const list = [HOME_PLACE, WORK_PLACE];
  assert.deepEqual(removePlace(list, "casa"), [WORK_PLACE]);
  assert.equal(renamePlace(list, "casa", "  Depto  ")[0].name, "Depto");
  assert.equal(renamePlace(list, "casa", "   ")[0].name, "Casa");
  assert.equal(list[0].name, "Casa");
  assert.equal(list.length, 2);
});
