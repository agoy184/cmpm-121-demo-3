/* eslint-disable @typescript-eslint/quotes */
import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";

const MERRILL_CLASSROOM = leaflet.latLng({
  lat: 36.9995,
  lng: -122.0533,
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
  center: MERRILL_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>"',
  })
  .addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);
//const originLatLng = playerMarker.getLatLng();

let points = 0;

interface Coin {
  i: number;
  j: number;
  serial: number;
}

// Buttons at top of screen from index.html
document.addEventListener("DOMContentLoaded", () => {
  const sensorButton = document.querySelector("#sensor")!;
  const northButton = document.querySelector("#north")!;
  const southButton = document.querySelector("#south")!;
  const westButton = document.querySelector("#west")!;
  const eastButton = document.querySelector("#east")!;
  const resetButton = document.querySelector("#reset")!;

  // Add event listeners to the buttons
  sensorButton.addEventListener("click", () => {
    navigator.geolocation.watchPosition((position) => {
      playerMarker.setLatLng(
        leaflet.latLng(position.coords.latitude, position.coords.longitude)
      );
      map.setView(playerMarker.getLatLng());
    });
    console.log("New location");
  });

  northButton.addEventListener("click", () => {
    const newLatLng = playerMarker.getLatLng();
    newLatLng.lat += TILE_DEGREES;
    playerMarker.setLatLng(newLatLng);
    map.setView(newLatLng);
  });

  southButton.addEventListener("click", () => {
    const newLatLng = playerMarker.getLatLng();
    newLatLng.lat -= TILE_DEGREES;
    playerMarker.setLatLng(newLatLng);
    map.setView(newLatLng);
  });

  westButton.addEventListener("click", () => {
    const newLatLng = playerMarker.getLatLng();
    newLatLng.lng -= TILE_DEGREES;
    playerMarker.setLatLng(newLatLng);
    map.setView(newLatLng);
  });

  eastButton.addEventListener("click", () => {
    const newLatLng = playerMarker.getLatLng();
    newLatLng.lng += TILE_DEGREES;
    playerMarker.setLatLng(newLatLng);
    map.setView(newLatLng);
  });

  resetButton.addEventListener("click", () => {
    //playerMarker.setLatLng(originLatLng);
    //map.setView(originLatLng);
  });
});

const coinArray: Coin[] = [];
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No coins yet...";

function makePit(i: number, j: number) {
  const bounds = leaflet.latLngBounds([
    [
      MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + j * TILE_DEGREES,
    ],
    [
      MERRILL_CLASSROOM.lat + (i + 1) * TILE_DEGREES,
      MERRILL_CLASSROOM.lng + (j + 1) * TILE_DEGREES,
    ],
  ]);

  const pit = leaflet.rectangle(bounds) as leaflet.Layer;

  pit.bindPopup(() => {
    let value = Math.floor(luck([i, j, "initialValue"].toString()) * 100);
    const container = document.createElement("div");
    container.innerHTML = `
                <div>There is a pit here at "${i},${j}". It has value <span id="value">${value}</span>.</div>
                <button id="poke">poke</button>
                <button id ="deposit">deposit</button>`;
    const poke = container.querySelector<HTMLButtonElement>("#poke")!;
    const initialValue: number = value;
    const pitArray: Coin[] = [];

    poke.addEventListener("click", () => {
      const serial = initialValue - value;
      value--;
      container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
        value.toString();
      points++;
      if (pitArray.length != 0) {
        const temp: Coin = pitArray.pop()!;
        coinArray.push(temp);
        statusPanel.innerHTML = `${points} coins accumulated. You got coin from { i:${temp?.i}, j:${temp?.j}, serial:${temp?.serial}}`;
      }
      coinArray.push({ i, j, serial });
      statusPanel.innerHTML = `${points} coins accumulated. You got coin from { i:${i}, j:${j}, serial:${serial}}`;
    });

    const deposit = container.querySelector<HTMLButtonElement>("#deposit")!;
    deposit.addEventListener("click", () => {
      if (points != 0) {
        const temp: Coin = coinArray.pop()!;
        statusPanel.innerHTML = `${points} coins accumulated. You just deposited the coin { i:${temp?.i}, j:${temp?.j}, serial:${temp?.serial}}`;
        pitArray.push(temp);
        value++;
        container.querySelector<HTMLSpanElement>("#value")!.innerHTML =
          value.toString();
        points--;
      }
    });

    return container;
  });
  pit.addTo(map);
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
      makePit(i, j);
    }
  }
}
