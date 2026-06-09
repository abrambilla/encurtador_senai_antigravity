// Variáveis globais para o mapa e roteamento
let map;
let routingControl;
let waypoints = []; // Array para armazenar as coordenadas de origem, paradas e destino
let waypointMarkers = {}; // Objeto para armazenar os marcadores das paradas
let currentWaypointId = 0; // Contador para gerar IDs únicos para as paradas

// Ícones personalizados
const startIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const endIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const waypointIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Inicializa o mapa
function initMap() {
    map = L.map('map-container').setView([-14.235, -53.18], 5); // Centro no Brasil

    // Camadas de mapa
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const darkMatterLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a>'
    }).addTo(map); // Adiciona o tema escuro como padrão

    const esriSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const baseMaps = {
        "Modo Escuro (CartoDB)": darkMatterLayer,
        "Mapa de Ruas (OSM)": osmLayer,
        "Satélite (Esri)": esriSatelliteLayer
    };

    L.control.layers(baseMaps).addTo(map);

    // Inicializa o Leaflet Routing Machine
    routingControl = L.Routing.control({
        waypoints: [],
        routeWhileDragging: true,
        showAlternatives: false,
        addWaypoints: true,
        fitSelectedRoutes: true,
        lineOptions: {
            styles: [{ color: '#3182ce', weight: 6 }] // Azul-Cobalto para a rota
        },
        createMarker: function(i, waypoint, n) {
            let icon;
            if (i === 0) {
                icon = startIcon;
            } else if (i === n - 1) {
                icon = endIcon;
            } else {
                icon = waypointIcon;
            }
            return L.marker(waypoint.latLng, { icon: icon });
        },
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
    }).addTo(map);

    // Evento para atualizar os detalhes da rota
    routingControl.on('routesfound', function(e) {
        const route = e.routes[0];
        const distance = (route.summary.totalDistance / 1000).toFixed(2); // em km
        const time = formatTime(route.summary.totalTime);

        document.getElementById('total-distance').innerText = `${distance} km`;
        document.getElementById('total-time').innerText = time;

        const instructionsContainer = document.getElementById('route-instructions');
        instructionsContainer.innerHTML = '<ul>' + route.instructions.map(inst => `<li>${inst.text}</li>`).join('') + '</ul>';
    });
}

// Formata o tempo para um formato legível
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    let timeString = '';
    if (hours > 0) {
        timeString += `${hours}h `;
    }
    if (minutes > 0) {
        timeString += `${minutes}min `;
    }
    if (remainingSeconds > 0 || timeString === '') { // Garante que algo seja exibido, mesmo que seja 0s
        timeString += `${remainingSeconds}s`;
    }
    return timeString.trim();
}

// Funções para geocodificação e autocomplete
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search?";
const USER_AGENT = 'MeuAppDeRotasEscolar/1.0';
let debounceTimeout;

async function geocodeAddress(address, retries = 0) {
    const MAX_RETRIES = 2;
    const searchParams = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: 1,
        countrycodes: 'br' // Foca a busca no Brasil
    });

    try {
        const response = await fetch(`${NOMINATIM_BASE_URL}${searchParams.toString()}`, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                address: data[0].display_name
            };
        } else if (retries < MAX_RETRIES) {
            // Sistema de Fallback
            const parts = address.split(',');
            if (parts.length > 2) { // Tentar "Rua, Cidade - Estado"
                const genericAddress = `${parts[0].trim()}, ${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
                console.log(`Fallback: Tentando busca genérica: ${genericAddress}`);
                return await geocodeAddress(genericAddress, retries + 1);
            } else if (parts.length > 1) { // Tentar "Cidade - Estado"
                const genericAddress = `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
                console.log(`Fallback: Tentando busca mais genérica: ${genericAddress}`);
                return await geocodeAddress(genericAddress, retries + 1);
            }
        }
        return null; // Não encontrou resultados após os fallbacks
    } catch (error) {
        console.error("Erro na geocodificação:", error);
        if (retries < MAX_RETRIES) {
            const parts = address.split(',');
            if (parts.length > 2) { // Tentar "Rua, Cidade - Estado"
                const genericAddress = `${parts[0].trim()}, ${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
                console.log(`Fallback: Tentando busca genérica após erro: ${genericAddress}`);
                return await geocodeAddress(genericAddress, retries + 1);
            } else if (parts.length > 1) { // Tentar "Cidade - Estado"
                const genericAddress = `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim()}`;
                console.log(`Fallback: Tentando busca mais genérica após erro: ${genericAddress}`);
                return await geocodeAddress(genericAddress, retries + 1);
            }
        }
        return null;
    }
}

async function autocompleteAddress(inputElement) {
    const query = inputElement.value;

    if (query.length < 3) {
        closeAllLists(inputElement);
        return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        const searchParams = new URLSearchParams({
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            countrycodes: 'br'
        });

        try {
            const response = await fetch(`${NOMINATIM_BASE_URL}${searchParams.toString()}`, {
                headers: {
                    'User-Agent': USER_AGENT
                }
            });
            const data = await response.json();
            displayAutocompleteResults(inputElement, data);
        } catch (error) {
            console.error("Erro no autocomplete:", error);
        }
    }, 400); // Debounce de 400ms
}

function displayAutocompleteResults(inputElement, results) {
    closeAllLists(inputElement);

    if (!results || results.length === 0) {
        return;
    }

    const autocompleteList = document.createElement("div");
    autocompleteList.setAttribute("id", inputElement.id + "-autocomplete-list");
    autocompleteList.setAttribute("class", "autocomplete-items");
    inputElement.parentNode.appendChild(autocompleteList);

    results.forEach(result => {
        const item = document.createElement("div");
        item.innerHTML = result.display_name;
        item.addEventListener("click", function() {
            inputElement.value = result.display_name;
            closeAllLists(inputElement);
        });
        autocompleteList.appendChild(item);
    });
}

function closeAllLists(elmnt) {
    const x = document.querySelectorAll(".autocomplete-items");
    for (let i = 0; i < x.length; i++) {
        if (elmnt !== x[i] && elmnt !== x[i].previousElementSibling) {
            x[i].parentNode.removeChild(x[i]);
        }
    }
}

document.addEventListener("click", function(e) {
    closeAllLists(e.target);
});

// Lógica para adicionar e remover paradas
document.getElementById('add-waypoint').addEventListener('click', function() {
    currentWaypointId++;
    const waypointsContainer = document.getElementById('waypoints-container');

    const newWaypointGroup = document.createElement('div');
    newWaypointGroup.classList.add('input-group');
    newWaypointGroup.id = `waypoint-group-${currentWaypointId}`;

    newWaypointGroup.innerHTML = `
        <label for="waypoint-input-${currentWaypointId}">Parada ${currentWaypointId}:</label>
        <input type="text" id="waypoint-input-${currentWaypointId}" placeholder="Digite o endereço da parada...">
        <button type="button" class="remove-waypoint-btn" data-waypoint-id="${currentWaypointId}">X</button>
    `;
    waypointsContainer.appendChild(newWaypointGroup);

    const newWaypointInput = document.getElementById(`waypoint-input-${currentWaypointId}`);
    newWaypointInput.addEventListener('input', () => autocompleteAddress(newWaypointInput));
    newWaypointInput.addEventListener('change', () => autocompleteCEP(newWaypointInput)); // Adiciona autocomplete de CEP

    // Adicionar listener para o botão de remover
    newWaypointGroup.querySelector('.remove-waypoint-btn').addEventListener('click', function() {
        newWaypointGroup.remove();
        // Atualizar waypoints e rota se necessário
        calculateAndDisplayRoute();
    });
});


// Lógica de Busca de CEP integrado ao ViaCEP API
async function autocompleteCEP(inputElement) {
    const cep = inputElement.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                inputElement.value = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
            }
        } catch (error) {
            console.error("Erro na busca de CEP:", error);
        }
    }
}

// Event Listeners para os inputs de origem e destino
document.getElementById('origin-input').addEventListener('input', (e) => autocompleteAddress(e.target));
document.getElementById('origin-input').addEventListener('change', (e) => autocompleteCEP(e.target));

document.getElementById('destination-input').addEventListener('input', (e) => autocompleteAddress(e.target));
document.getElementById('destination-input').addEventListener('change', (e) => autocompleteCEP(e.target));

// Lógica para calcular e exibir a rota
document.getElementById('calculate-route').addEventListener('click', calculateAndDisplayRoute);

async function calculateAndDisplayRoute() {
    waypoints = [];
    // Limpa marcadores existentes, exceto os do routingControl
    for (const id in waypointMarkers) {
        map.removeLayer(waypointMarkers[id]);
    }
    waypointMarkers = {};

    const originAddress = document.getElementById('origin-input').value;
    const destinationAddress = document.getElementById('destination-input').value;

    const originCoords = await geocodeAddress(originAddress);
    const destinationCoords = await geocodeAddress(destinationAddress);

    if (originCoords) {
        waypoints.push(L.latLng(originCoords.lat, originCoords.lon));
    }

    // Adiciona as paradas intermediárias
    const waypointInputs = document.querySelectorAll('#waypoints-container input[type="text"]');
    for (const input of waypointInputs) {
        const waypointAddress = input.value;
        if (waypointAddress) {
            const coords = await geocodeAddress(waypointAddress);
            if (coords) {
                waypoints.push(L.latLng(coords.lat, coords.lon));
            }
        }
    }

    if (destinationCoords) {
        waypoints.push(L.latLng(destinationCoords.lat, destinationCoords.lon));
    }

    if (waypoints.length >= 2) {
        routingControl.setWaypoints(waypoints);
    } else {
        alert('Por favor, insira pelo menos um endereço de origem e um de destino.');
    }
}


// Inicializa o mapa quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initMap);
