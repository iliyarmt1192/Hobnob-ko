// Skript für den Tier‑Geburtstagsgenerator
// Dieses Skript initialisiert die Benutzeroberfläche, verwaltet die Datenablage
// (via localStorage) und steuert die Generierung sowie Anzeige der QR‑Codes.

// Optional: Überschreibe diesen Wert mit der URL deiner gehosteten Website,
// damit QR‑Codes auch auf anderen Geräten funktionieren. Beispielsweise:
// const BASE_URL_OVERRIDE = 'https://deine-domain.de/pfad/index.html';
const BASE_URL_OVERRIDE = '';

document.addEventListener('DOMContentLoaded', () => {
  // Abfragen, ob die Seite als Scan‑Ziel aufgerufen wurde. Wenn eine id als
  // Query‑Parameter vorhanden ist, befinden wir uns im Scan‑Modus und
  // sollten bestehende Daten nicht löschen.
  const urlParams = new URLSearchParams(window.location.search);
  const scanMode = urlParams.has('id');
  const scanId = urlParams.get('id');
  const scanDate = urlParams.get('date');
  const scanAnimal = urlParams.get('animal');
  const scanName = urlParams.get('name');

  // Basis‑URL (ohne Query‑Parameter) für die QR‑Codes. Beim Erstellen eines
  // QR‑Codes wird diese Basis verwendet, um einen Link zu erzeugen, der
  // zurück auf dieselbe Seite verweist. Dadurch können gescannte Codes die
  // Informationen über die URL übertragen.
  /**
   * Erzeuge die Basis‑URL für QR‑Codes. Falls eine externe URL in
   * BASE_URL_OVERRIDE angegeben ist, wird diese verwendet. Andernfalls
   * wird die aktuelle Seite (ohne Query‑Parameter und Fragment) als
   * Grundlage genommen. Dadurch funktionieren gescannte QR‑Codes sowohl
   * lokal (wenn die Seite über http(s) bereitgestellt wird) als auch,
   * sofern gehostet, über das Internet. Bei lokalem file://‑Zugriff
   * können andere Geräte die Datei nicht öffnen; daher sollte die
   * Website öffentlich gehostet werden.
   */
  function getBaseUrl() {
    if (BASE_URL_OVERRIDE && typeof BASE_URL_OVERRIDE === 'string') {
      return BASE_URL_OVERRIDE;
    }
    // Standard: voller Pfad der aktuellen Seite ohne Suchparameter/Hash
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    return url.toString();
  }

  const baseUrl = getBaseUrl();

  // Nur im Generator‑Modus (wenn kein Scan) sollen alte Daten beim Laden
  // entfernt werden, damit nach einem Refresh alles zurückgesetzt ist.
  if (!scanMode) {
    localStorage.removeItem('qrData');
  }
  /**
   * Liste der verfügbaren Tiere. Jedes Tier ist durch die Nummer des Buttons,
   * seinen bestimmten Artikel, den Namen sowie den Pfad zur Bilddatei definiert.
   * Die Bilddateien stammen aus dem OpenMoji‑Projekt (CC BY‑SA 4.0).
   */
  const animals = [
    { num: 1, article: 'die', name: 'Katze', img: 'assets/1F408.png' },
    { num: 2, article: 'das', name: 'Kaninchen', img: 'assets/1F407.png' },
    { num: 3, article: 'das', name: 'Pferd', img: 'assets/1F434.png' },
    { num: 4, article: 'der', name: 'Löwe', img: 'assets/1F981.png' },
    { num: 5, article: 'der', name: 'Tiger', img: 'assets/1F42F.png' },
    { num: 6, article: 'der', name: 'Elefant', img: 'assets/1F418.png' },
    { num: 7, article: 'der', name: 'Panda', img: 'assets/1F43C.png' },
    { num: 8, article: 'die', name: 'Giraffe', img: 'assets/1F992.png' },
    { num: 9, article: 'der', name: 'Bär', img: 'assets/1F43B.png' },
    { num: 10, article: 'der', name: 'Delfin', img: 'assets/1F42C.png' },
    { num: 11, article: 'die', name: 'Schildkröte', img: 'assets/1F422.png' },
    { num: 12, article: 'das', name: 'Eichhörnchen', img: 'assets/1F43F.png' },
    { num: 13, article: 'der', name: 'Igel', img: 'assets/1F994.png' },
    { num: 14, article: 'der', name: 'Koala', img: 'assets/1F428.png' },
    { num: 15, article: 'der', name: 'Pinguin', img: 'assets/1F427.png' },
    { num: 16, article: 'der', name: 'Otter', img: 'assets/1F9A6.png' },
    { num: 17, article: 'der', name: 'Waschbär', img: 'assets/1F99D.png' },
    { num: 18, article: 'das', name: 'Känguru', img: 'assets/1F998.png' },
    { num: 19, article: 'die', name: 'Eule', img: 'assets/1F989.png' },
    { num: 20, article: 'der', name: 'Papagei', img: 'assets/1F99C.png' }
  ];

  // DOM‑Elemente referenzieren
  const numberButtonsContainer = document.getElementById('number-buttons');
  const selectedAnimalSection = document.getElementById('selected-animal');
  const animalNameEl = document.getElementById('animal-name');
  const animalImageEl = document.getElementById('animal-image');
  const qrListContainer = document.getElementById('codes-container');
  const birthdateInput = document.getElementById('birthdate');

  // Eingabefeld für den Vornamen des Gastes
  const firstNameInput = document.getElementById('firstname');

  // Modal‑Elemente
  const modal = document.getElementById('modal');
  const modalDateEl = document.getElementById('modal-date');
  const modalAnimalEl = document.getElementById('modal-animal');
  const modalAnimalImg = document.getElementById('modal-animal-image');
  const modalTotalEl = document.getElementById('modal-total');
  const goldenTickEl = document.getElementById('golden-tick');
  const amountInput = document.getElementById('amount');
  const addAmountBtn = document.getElementById('add-amount');
  const closeModalBtn = document.getElementById('close-modal');

  // Neues Element für den Namen im Modal
  const modalNameEl = document.getElementById('modal-name');

  // Bestätigungs‑Schaltfläche für das Zurücksetzen nach Erreichen der 50‑€‑Schwelle
  const confirmResetContainer = document.getElementById('confirm-reset-container');
  const confirmResetBtn = document.getElementById('confirm-reset');

  // Elemente für die Scan‑Ansicht
  const scanView = document.getElementById('scan-view');
  const scanDateEl = document.getElementById('scan-date');
  const scanAnimalEl = document.getElementById('scan-animal');
  const scanAnimalImg = document.getElementById('scan-animal-image');
  const scanTotalEl = document.getElementById('scan-total');
  const scanGoldenTickEl = document.getElementById('scan-golden-tick');
  const scanAmountInput = document.getElementById('scan-amount');
  const scanAddAmountBtn = document.getElementById('scan-add-amount');
  const scanConfirmContainer = document.getElementById('scan-confirm-container');
  const scanConfirmBtn = document.getElementById('scan-confirm-reset');

  // Neues Element für den Namen in der Scan‑Ansicht
  const scanNameEl = document.getElementById('scan-name');

  // Aktuell ausgewählte ID im Modal
  let currentId = null;

  /**
   * Liest die gespeicherten QR‑Code‑Einträge aus dem localStorage.
   * Falls noch keine Daten vorhanden sind, wird ein leeres Objekt zurückgegeben.
   */
  function loadData() {
    const data = localStorage.getItem('qrData');
    try {
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Fehler beim Einlesen der gespeicherten Daten:', e);
      return {};
    }
  }

  /**
   * Speichert die übergebenen Daten im localStorage.
   * @param {Object} data
   */
  function saveData(data) {
    localStorage.setItem('qrData', JSON.stringify(data));
  }

  /**
   * Liefert eine personalisierte Anrede basierend auf dem Artikel des Tieres.
   * @param {string} article - Artikel des Tieres (der/die/das)
   * @param {string} name - Name des Tieres
   * @returns {string} Anrede in der Form "lieber/liebe/liebes <Name>"
   */
  function getGreeting(article, name) {
    switch (article) {
      case 'der':
        return `lieber ${name}`;
      case 'die':
        return `liebe ${name}`;
      case 'das':
        return `liebes ${name}`;
      default:
        return `${name}`;
    }
  }

  /**
   * Erstellt den Text, der per Mail/WhatsApp geteilt wird. Die Nachricht mischt
   * eine lässige deutsche Ansprache mit dem Tiernamen. Sie ist bewusst
   * umgangssprachlich gehalten, um einen freundschaftlichen Ton zu treffen.
   * @param {Object} animal - Tierobjekt mit article und name
   * @returns {string} Nachricht
   */
  function createShareMessage(animal, firstName) {
    const greeting = getGreeting(animal.article, animal.name);
    // Wenn ein Vorname vorhanden ist, verwende ihn, sonst fällt zurück auf "Kumpel".
    const nameSegment = firstName && firstName.trim() ? `Hey ${firstName.trim()}!` : 'Hey Kumpel!';
    // Keine Trennstriche mehr vor der Begrüßung und Verwenden des Vornamens.
    return `${nameSegment} HobNob hier ${greeting} 🍻. Vergiss nicht, unseren Insta‑ und TikTok‑Account zu followen💌. Bring immer deinen persönlichen QR‑Code mit, das lohnt sich – versprochen 😉`;
  }

  /**
   * Teilt oder lädt einen QR‑Code als PNG mit einer persönlichen Nachricht.
   * Je nach Plattform wird versucht, die Web Share API zu nutzen, sonst wird
   * ein Download ausgelöst und die Nachricht kopiert. Bei WhatsApp wird die
   * entsprechende URL geöffnet.
   * @param {string} id - ID des QR‑Codes
   * @param {string} platform - 'share', 'email' oder 'whatsapp'
   */
  async function shareQRCode(id, platform) {
    const data = loadData();
    const entry = data[id];
    if (!entry) return;
    const animal = animals[entry.animalIndex];
    const message = createShareMessage(animal, entry.firstName);
    // Für die zu teilende Datei eine hochauflösende Version des QR‑Codes erstellen,
    // die den Nutzer hochgeladenen Logo in der Mitte enthält. Damit verbessern
    // wir die Qualität und stellen sicher, dass das Logo im exportierten Bild
    // eingebettet ist.
    // Lese Primärfarbe aus CSS‑Variable aus
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#0a3345';
    // Verwende die gleiche URL wie im gerenderten QR‑Code, damit gescannte
    // geteilte Codes ebenfalls korrekt funktionieren.
    const qrContent = `${baseUrl}?id=${encodeURIComponent(id)}&date=${encodeURIComponent(entry.date)}&animal=${encodeURIComponent(entry.animalIndex)}&name=${encodeURIComponent(entry.firstName || '')}`;
    // Für die hochauflösende Ausgabe verwenden wir eine größere Größe. Eine
    // Auflösung von 1000 Pixeln liefert ein scharfes Bild mit klaren Kanten.
    const size = 1000;
    const qr = new QRious({
      value: qrContent,
      size: size,
      level: 'H',
      background: '#ffffff',
      foreground: primaryColor
    });
    // Neues Canvas erstellen und QR‑Code hineinzeichnen
    const highCanvas = document.createElement('canvas');
    highCanvas.width = size;
    highCanvas.height = size;
    const ctx = highCanvas.getContext('2d');
    ctx.drawImage(qr.canvas, 0, 0);
    // Logo laden und in der Mitte einfügen
    const logoImgShare = new Image();
    logoImgShare.src = 'assets/logo_center.jpeg';
    await logoImgShare.decode();
    const logoSize = size * 0.2;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    ctx.drawImage(logoImgShare, logoX, logoY, logoSize, logoSize);
    // In Blob umwandeln
    const blob = await new Promise(resolve => highCanvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `qr-${id}.png`, { type: 'image/png' });

    // Versuchen, über die Web Share API zu teilen, sofern unterstützt
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message, title: 'HobNob QR‑Code' });
        return;
      } catch (err) {
        console.warn('Share abgebrochen oder nicht verfügbar:', err);
      }
    }
    // Fallback: Datei herunterladen und Nachricht kopieren
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `qr-${id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    try {
      await navigator.clipboard.writeText(message);
    } catch (e) {
      console.warn('Nachricht konnte nicht in die Zwischenablage kopiert werden:', e);
    }
    if (platform === 'email') {
      const mailtoUrl = `mailto:?subject=HobNob%20QR%20Code&body=${encodeURIComponent(message + '\n\nFüge bitte das heruntergeladene QR‑Code‑Bild als Anhang hinzu.')}`;
      window.location.href = mailtoUrl;
    } else if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n\n(Bitte füge das heruntergeladene QR‑Code‑Bild als Anhang hinzu.)')}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Bild wurde heruntergeladen und die Nachricht kopiert. Bitte teile die Datei manuell.');
    }
  }

  /**
   * Erstellt für jeden Eintrag in den gespeicherten Daten einen QR‑Code und
   * rendert die Liste der Codes in den dafür vorgesehenen Container.
   */
  function renderCodes() {
    qrListContainer.innerHTML = '';
    const data = loadData();
    Object.keys(data).forEach(id => {
      renderCode(id, data[id]);
    });
  }

  /**
   * Erzeugt einen neuen QR‑Code DOM‑Knoten für ein bestimmtes Datenobjekt.
   * Der QR‑Code enthält die eindeutige ID, das Geburtsdatum sowie den Index
   * des Tieres. Der Code wird anklickbar gemacht, sodass das Modal geöffnet
   * werden kann.
   * @param {string} id - Eindeutige ID
   * @param {Object} entry - Datenobjekt { date: string, animalIndex: number, total: number }
   */
  function renderCode(id, entry) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('qr-item');
    wrapper.dataset.id = id;

    const codeContainer = document.createElement('div');
    codeContainer.classList.add('qr-code');
    wrapper.appendChild(codeContainer);

    // QR‑Code erzeugen. Statt ein JSON‑Objekt zu kodieren, bauen wir
    // eine URL zusammen, die beim Scannen auf diese Seite verweist und die
    // relevanten Parameter (ID, Datum, Tierindex) überträgt.
    const qrContent = `${baseUrl}?id=${encodeURIComponent(id)}&date=${encodeURIComponent(entry.date)}&animal=${encodeURIComponent(entry.animalIndex)}&name=${encodeURIComponent(entry.firstName || '')}`;
    // Farbe aus den CSS‑Variablen auslesen (falls benötigt)
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#0a3345';

    // QR‑Code mit der Bibliothek Qrious erstellen. Qrious erzeugt ein
    // Canvas‑Element, das wir anschließend in den Code‑Container einfügen.
    const qr = new QRious({
      value: qrContent,
      size: 140,
      level: 'H',
      background: '#ffffff',
      foreground: primaryColor
    });
    // Das von Qrious erstellte Canvas dem Container hinzufügen
    codeContainer.appendChild(qr.canvas);

    // Logo überlagern: verwende die vom Benutzer hochgeladene Datei
    const logoImg = document.createElement('img');
    logoImg.src = 'assets/logo_center.jpeg';
    logoImg.classList.add('qr-logo');
    codeContainer.appendChild(logoImg);

    // Klick‑Event zum Öffnen des Modals
    wrapper.addEventListener('click', () => {
      openModal(id);
    });

    // Share‑Buttons unter dem QR‑Code hinzufügen
    const shareContainer = document.createElement('div');
    shareContainer.classList.add('share-buttons');
    // Zuordnung der Plattformen zu den entsprechenden Symbolen als SVG
    const platforms = [
      { key: 'share', src: 'assets/share-nodes.svg' },
      { key: 'email', src: 'assets/envelope.svg' },
      { key: 'whatsapp', src: 'assets/whatsapp.svg' }
    ];
    platforms.forEach(item => {
      const btn = document.createElement('div');
      btn.classList.add('share-btn');
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.key;
      btn.appendChild(img);
      // Klick‑Event nur für das Teilen, Modal soll dabei nicht geöffnet werden
      btn.addEventListener('click', event => {
        event.stopPropagation();
        shareQRCode(id, item.key);
      });
      shareContainer.appendChild(btn);
    });
    wrapper.appendChild(shareContainer);

    qrListContainer.appendChild(wrapper);
  }

  /**
   * Formatiert ein Datum von YYYY‑MM‑DD in das deutsche Format DD.MM.YYYY.
   * @param {string} dateString
   * @returns {string}
   */
  function formatDate(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  /**
   * Öffnet das Modal für einen bestimmten QR‑Code.
   * @param {string} id
   */
  function openModal(id) {
    currentId = id;
    updateModal();
    modal.classList.remove('hidden');
  }

  /**
   * Aktualisiert die Inhalte im Modal entsprechend der aktuell ausgewählten ID.
   */
  function updateModal() {
    if (!currentId) return;
    const data = loadData();
    const entry = data[currentId];
    if (!entry) return;
    const animal = animals[entry.animalIndex];
    modalDateEl.textContent = formatDate(entry.date);
    modalAnimalEl.textContent = `${animal.article} ${animal.name}`;
    modalAnimalImg.src = animal.img;
    // Zeige den gespeicherten Vornamen im Modal, falls vorhanden
    if (modalNameEl) {
      modalNameEl.textContent = entry.firstName || '';
    }
    modalTotalEl.textContent = entry.total.toFixed(2).replace('.', ',');
    // Zeige goldenes Häkchen und Bestätigungs‑Schaltfläche, falls die 50‑€‑Schwelle überschritten wurde
    if (entry.total >= 50) {
      modalTotalEl.classList.add('highlight');
      goldenTickEl.classList.remove('hidden');
      confirmResetContainer.classList.remove('hidden');
    } else {
      modalTotalEl.classList.remove('highlight');
      goldenTickEl.classList.add('hidden');
      confirmResetContainer.classList.add('hidden');
    }
  }

  /**
   * Logik für das Hinzufügen eines Betrags zu einem QR‑Code. Erhöht den
   * gespeicherten Gesamtbetrag und prüft, ob die Schwelle von 50&nbsp;€
   * überschritten wurde. In diesem Fall wird der Betrag kurz hervorgehoben,
   * ein goldenes Häkchen angezeigt und anschließend der Gesamtbetrag wieder
   * auf null gesetzt.
   */
  function handleAddAmount() {
    if (!currentId) return;
    const value = parseFloat(amountInput.value.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      // Bei ungültiger Eingabe nichts tun
      amountInput.value = '';
      return;
    }
    const data = loadData();
    const entry = data[currentId];
    entry.total += value;
    // Schwellenprüfung
    if (entry.total >= 50) {
      // Markieren und Häkchen anzeigen
      modalTotalEl.classList.add('highlight');
      goldenTickEl.classList.remove('hidden');
      // Bestätigungs‑Schaltfläche einblenden, um das Zurücksetzen manuell auszulösen
      confirmResetContainer.classList.remove('hidden');
    }
    saveData(data);
    renderCodes();
    updateModal();
    amountInput.value = '';
  }

  /**
   * Aktualisiert die Scan‑Ansicht entsprechend dem aktuellen Eintrag. Wird
   * aufgerufen, wenn die Seite im Scan‑Modus geladen ist. Es zeigt das
   * Geburtsdatum, den Tiernamen und das Tierbild an und aktualisiert den
   * Gesamtbetrag einschließlich Hervorhebung und Bestätigungsschaltfläche.
   */
  function updateScanView() {
    if (!scanId) return;
    const data = loadData();
    const entry = data[scanId];
    if (!entry) return;
    const animal = animals[entry.animalIndex];
    scanDateEl.textContent = formatDate(entry.date);
    scanAnimalEl.textContent = `${animal.article} ${animal.name}`;
    scanAnimalImg.src = animal.img;
    // Name anzeigen
    if (scanNameEl) {
      scanNameEl.textContent = entry.firstName || '';
    }
    scanTotalEl.textContent = entry.total.toFixed(2).replace('.', ',');
    if (entry.total >= 50) {
      scanTotalEl.classList.add('highlight');
      scanGoldenTickEl.classList.remove('hidden');
      scanConfirmContainer.classList.remove('hidden');
    } else {
      scanTotalEl.classList.remove('highlight');
      scanGoldenTickEl.classList.add('hidden');
      scanConfirmContainer.classList.add('hidden');
    }
  }

  /**
   * Fügt dem gescannten QR‑Code einen Betrag hinzu. Erstellt bei Bedarf
   * einen neuen Eintrag im localStorage und aktualisiert anschließend die
   * Ansicht.
   */
  function handleScanAddAmount() {
    const value = parseFloat(scanAmountInput.value.replace(',', '.'));
    if (isNaN(value) || value <= 0) {
      scanAmountInput.value = '';
      return;
    }
    const data = loadData();
    let entry = data[scanId];
    if (!entry) {
      // Falls kein Eintrag vorhanden ist (z. B. wenn der Code das erste Mal
      // gescannt wird), initialisiere ihn mit den Parametern aus der URL
      entry = { date: scanDate || '', animalIndex: parseInt(scanAnimal, 10) || 0, total: 0 };
      data[scanId] = entry;
    }
    entry.total += value;
    saveData(data);
    updateScanView();
    scanAmountInput.value = '';
  }

  /**
   * Bestätigt das Zurücksetzen des Gesamtbetrags für einen gescannten QR‑Code.
   * Diese Funktion wird ausgelöst, nachdem der Betrag über der 50‑€‑Schwelle
   * liegt und der Nutzer auf den OK‑Button klickt.
   */
  function handleScanConfirmReset() {
    const data = loadData();
    const entry = data[scanId];
    if (!entry) return;
    entry.total = 0;
    saveData(data);
    updateScanView();
  }

  /**
   * Legt einen neuen Eintrag an, sobald ein Tier ausgewählt wurde. Erstellt
   * eine eindeutige ID, speichert alle relevanten Informationen in
   * localStorage und rendert den neuen QR‑Code. Zeigt zudem das
   * ausgewählte Tier im oberen Bereich an.
   * @param {Object} animalObj
   * @param {string} birthDate
   */
  function selectAnimal(animalObj, birthDate) {
    // Verhindern, dass identische Daten mehrfach erstellt werden
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const entry = {
      date: birthDate,
      animalIndex: animals.findIndex(a => a.num === animalObj.num),
      total: 0,
      firstName: firstNameInput.value ? firstNameInput.value.trim() : ''
    };
    const data = loadData();
    data[id] = entry;
    saveData(data);
    renderCode(id, entry);

    // Tierinfo im oberen Bereich anzeigen
    animalNameEl.textContent = `${animalObj.article} ${animalObj.name}`;
    animalImageEl.src = animalObj.img;
    selectedAnimalSection.classList.remove('hidden');
  }

  /**
   * Erzeugt die Buttons 1–20 dynamisch anhand der animals‑Liste.
   */
  function initButtons() {
    animals.forEach(animalObj => {
      const btn = document.createElement('button');
      btn.textContent = animalObj.num.toString();
      btn.classList.add('animal-btn');
      btn.addEventListener('click', () => {
        const birthDate = birthdateInput.value;
        if (!birthDate) {
          alert('Bitte gib zuerst ein Geburtsdatum ein.');
          return;
        }
        selectAnimal(animalObj, birthDate);
      });
      numberButtonsContainer.appendChild(btn);
    });
  }

  // Eventlistener für das Hinzufügen eines Betrags
  addAmountBtn.addEventListener('click', handleAddAmount);
  // Eventlistener zum Schließen des Modals
  closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    currentId = null;
  });
  // Schließen des Modals beim Klick auf den Hintergrund
  modal.addEventListener('click', event => {
    if (event.target === modal) {
      modal.classList.add('hidden');
      currentId = null;
    }
  });

  // Eventlistener für die Bestätigungs‑Schaltfläche: setzt den Gesamtbetrag
  // eines QR‑Codes zurück, nachdem die 50‑€‑Schwelle erreicht wurde.
  confirmResetBtn.addEventListener('click', () => {
    if (!currentId) return;
    const data = loadData();
    const entry = data[currentId];
    if (!entry) return;
    // Gesamtbetrag zurücksetzen und UI aktualisieren
    entry.total = 0;
    saveData(data);
    // Verberge die Hervorhebung, den goldenen Haken und die Bestätigungsschaltfläche
    modalTotalEl.classList.remove('highlight');
    goldenTickEl.classList.add('hidden');
    confirmResetContainer.classList.add('hidden');
    renderCodes();
    updateModal();
  });

  // Initialisierung abhängig vom Modus
  if (scanMode) {
    // Scan‑Modus: Generator‑Ansicht ausblenden und Scan‑Ansicht anzeigen
    const createSection = document.getElementById('create-section');
    const qrListSection = document.getElementById('qr-list');
    if (createSection) createSection.classList.add('hidden');
    if (qrListSection) qrListSection.classList.add('hidden');
    if (scanView) scanView.classList.remove('hidden');
    // Daten initialisieren: Eintrag aus dem localStorage laden oder anlegen
    const data = loadData();
    if (!data[scanId]) {
      // Legen wir einen neuen Eintrag an, falls nicht vorhanden.
      const idx = parseInt(scanAnimal, 10) || 0;
      data[scanId] = {
        date: scanDate || '',
        animalIndex: idx,
        total: 0,
        firstName: scanName && scanName.trim() ? scanName.trim() : ''
      };
      saveData(data);
    } else {
      // Wenn ein Name in der URL angegeben ist, aber noch nicht im Eintrag gespeichert wurde,
      // aktualisieren wir den bestehenden Eintrag.
      if (scanName && scanName.trim() && !data[scanId].firstName) {
        data[scanId].firstName = scanName.trim();
        saveData(data);
      }
    }
    // Initiale Ansicht rendern
    updateScanView();
    // Ereignisse für Scan‑Buttons registrieren
    scanAddAmountBtn.addEventListener('click', handleScanAddAmount);
    scanConfirmBtn.addEventListener('click', handleScanConfirmReset);
  } else {
    // Generator‑Modus: Buttons rendern und gespeicherte Codes anzeigen
    initButtons();
    renderCodes();
  }
});