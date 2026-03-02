import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "calendar-composer-state-v1";
const IMAGE_DB_NAME = "calendar-composer-db";
const IMAGE_STORE_NAME = "project_assets";
const IMAGE_RECORD_KEY = "current_images";

const pageFormats = [
  { id: "A0", label: "A0", width: 841, height: 1189 },
  { id: "A1", label: "A1", width: 594, height: 841 },
  { id: "A2", label: "A2", width: 420, height: 594 },
  { id: "A3", label: "A3", width: 297, height: 420 },
  { id: "A4", label: "A4", width: 210, height: 297 },
  { id: "A5", label: "A5", width: 148, height: 210 },
  { id: "B0", label: "B0", width: 1000, height: 1414 },
  { id: "B1", label: "B1", width: 707, height: 1000 },
  { id: "B2", label: "B2", width: 500, height: 707 },
  { id: "B3", label: "B3", width: 353, height: 500 },
  { id: "B4", label: "B4", width: 250, height: 353 },
  { id: "B5", label: "B5", width: 176, height: 250 }
];

const fonts = [
  "Abril Fatface",
  "Alegreya Sans",
  "Alfa Slab One",
  "Anton",
  "Archivo Narrow",
  "Arvo",
  "Barlow Condensed",
  "Bebas Neue",
  "Bitter",
  "Bricolage Grotesque",
  "Cabin",
  "Cardo",
  "Caveat",
  "Cormorant Garamond",
  "DM Sans",
  "DM Serif Display",
  "Domine",
  "EB Garamond",
  "Figtree",
  "Francois One",
  "IBM Plex Sans",
  "Inconsolata",
  "Josefin Sans",
  "Jost",
  "Kanit",
  "Lato",
  "Libre Baskerville",
  "Lora",
  "Manrope",
  "Merriweather",
  "Montserrat",
  "Newsreader",
  "Nunito",
  "Oswald",
  "Outfit",
  "Playfair Display",
  "Poppins",
  "Quicksand",
  "Raleway",
  "Space Grotesk"
];

const styleOptions = [
  { id: 1, label: "Hero Edge", className: "style-1", printClass: "print-style-1" },
  { id: 2, label: "Band Frame", className: "style-2", printClass: "print-style-2" },
  { id: 3, label: "Caption Card", className: "style-3", printClass: "print-style-3" },
  { id: 4, label: "Split Poster", className: "style-4", printClass: "print-style-4" },
  { id: 5, label: "Soft Collage", className: "style-5", printClass: "print-style-5" },
  { id: 6, label: "Minimal Arch", className: "style-6", printClass: "print-style-6" },
  { id: 7, label: "Ribbon Panel", className: "style-7", printClass: "print-style-7" },
  { id: 8, label: "Studio Grid", className: "style-8", printClass: "print-style-8" }
];

const layoutOptions = [
  {
    id: "half-top",
    label: "Meta Pagina Sopra",
    description: "Immagine nella meta superiore, calendario nella meta inferiore, piega orizzontale."
  },
  {
    id: "half-bottom",
    label: "Meta Pagina Sotto",
    description: "Calendario nella meta superiore, immagine nella meta inferiore, piega orizzontale."
  },
  {
    id: "vertical-split",
    label: "Split Verticale",
    description: "Immagine a sinistra e griglia mese a destra, piega verticale al centro."
  },
  {
    id: "booklet-center",
    label: "Pieghevole Centrale",
    description: "Doppia anta con cerniera centrale, adatto a piega netta e impaginazione da stampa."
  }
];

const months = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre"
];

const weekdays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const starterImages = [
  createPlaceholderImage("Aurora", "#607ddb", "#f5b76e"),
  createPlaceholderImage("Atelier", "#1a936f", "#ffd166"),
  createPlaceholderImage("Terra", "#bc4b51", "#f4a259"),
  createPlaceholderImage("Ocean", "#0d3b66", "#7bdff2")
];

function buildMonthMatrix(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1);
  const startShift = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startShift + 1;
    cells.push(dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null);
  }

  return cells;
}

function createPlaceholderImage(label, colorA, colorB) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#g)" />
      <circle cx="920" cy="210" r="140" fill="rgba(255,255,255,0.18)" />
      <circle cx="260" cy="700" r="180" fill="rgba(255,255,255,0.16)" />
      <text x="80" y="770" fill="white" font-size="132" font-family="Arial, sans-serif" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function toImageItem(src, name, isPreset = false) {
  return {
    id: `${name}-${Math.random().toString(36).slice(2, 9)}`,
    src,
    name,
    isPreset
  };
}

function normalizeHexColor(value, fallback = "#4f7cff") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  if (/^#([0-9a-f]{3}){1,2}$/i.test(normalized)) {
    if (normalized.length === 4) {
      return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`.toLowerCase();
    }
    return normalized.toLowerCase();
  }

  return fallback;
}

function hexToRgb(value) {
  const normalized = normalizeHexColor(value);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
}

function mixColors(colorA, colorB, weightA = 0.5) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const weightB = 1 - weightA;
  const toHex = (channel) => Math.round(channel).toString(16).padStart(2, "0");

  return `#${toHex(a.r * weightA + b.r * weightB)}${toHex(a.g * weightA + b.g * weightB)}${toHex(a.b * weightA + b.b * weightB)}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error(`Errore lettura file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function isValidOption(value, options, key = "id") {
  return options.some((option) => option[key] === value);
}

function getDefaultImages() {
  return starterImages.map((src, index) => toImageItem(src, `Preset ${index + 1}`, true));
}

function getInitialState(currentYear) {
  const fallback = {
    year: currentYear,
    formatId: "A4",
    fontFamily: fonts[0],
    selectedStyle: styleOptions[0].id,
    selectedLayout: layoutOptions[0].id,
    showFoldGuide: true,
    accentColor: "#4f7cff",
    borderColor: "#d7ddea",
    surfaceColor: "#fff6ec",
    radiusScale: 18
  };

  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return fallback;
    }

    const parsedState = JSON.parse(rawState);
    return {
      year: Number(parsedState.year) || currentYear,
      formatId: isValidOption(parsedState.formatId, pageFormats) ? parsedState.formatId : fallback.formatId,
      fontFamily: isValidOption(parsedState.fontFamily, fonts.map((font) => ({ id: font }))) ? parsedState.fontFamily : fallback.fontFamily,
      selectedStyle: isValidOption(parsedState.selectedStyle, styleOptions) ? parsedState.selectedStyle : fallback.selectedStyle,
      selectedLayout: isValidOption(parsedState.selectedLayout, layoutOptions) ? parsedState.selectedLayout : fallback.selectedLayout,
      showFoldGuide: typeof parsedState.showFoldGuide === "boolean" ? parsedState.showFoldGuide : fallback.showFoldGuide,
      accentColor: typeof parsedState.accentColor === "string" ? parsedState.accentColor : fallback.accentColor,
      borderColor: typeof parsedState.borderColor === "string" ? parsedState.borderColor : fallback.borderColor,
      surfaceColor: typeof parsedState.surfaceColor === "string" ? parsedState.surfaceColor : fallback.surfaceColor,
      radiusScale: Number(parsedState.radiusScale) || fallback.radiusScale
    };
  } catch {
    return fallback;
  }
}

function getLegacyLocalImages() {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return null;
    }

    const parsedState = JSON.parse(rawState);
    if (!Array.isArray(parsedState.images) || parsedState.images.length === 0) {
      return null;
    }

    return parsedState.images
      .filter((image) => typeof image?.src === "string" && typeof image?.name === "string")
      .map((image) => ({
        id: image.id || `${image.name}-${Math.random().toString(36).slice(2, 9)}`,
        src: image.src,
        name: image.name,
        isPreset: Boolean(image.isPreset)
      }));
  } catch {
    return null;
  }
}

function openImageDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(IMAGE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        database.createObjectStore(IMAGE_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Impossibile aprire IndexedDB"));
  });
}

function loadImagesFromIndexedDb() {
  return new Promise((resolve, reject) => {
    openImageDatabase()
      .then((database) => {
        const transaction = database.transaction(IMAGE_STORE_NAME, "readonly");
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.get(IMAGE_RECORD_KEY);

        request.onsuccess = () => {
          database.close();
          resolve(Array.isArray(request.result) ? request.result : null);
        };
        request.onerror = () => {
          database.close();
          reject(request.error ?? new Error("Impossibile leggere le immagini salvate"));
        };
      })
      .catch(reject);
  });
}

function saveImagesToIndexedDb(images) {
  return new Promise((resolve, reject) => {
    openImageDatabase()
      .then((database) => {
        const transaction = database.transaction(IMAGE_STORE_NAME, "readwrite");
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        store.put(images, IMAGE_RECORD_KEY);

        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error ?? new Error("Impossibile salvare le immagini"));
        };
      })
      .catch(reject);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function App() {
  const currentYear = new Date().getFullYear();
  const initialState = useMemo(() => getInitialState(currentYear), [currentYear]);
  const [year, setYear] = useState(initialState.year);
  const [formatId, setFormatId] = useState(initialState.formatId);
  const [fontFamily, setFontFamily] = useState(initialState.fontFamily);
  const [selectedStyle, setSelectedStyle] = useState(initialState.selectedStyle);
  const [selectedLayout, setSelectedLayout] = useState(initialState.selectedLayout);
  const [showFoldGuide, setShowFoldGuide] = useState(initialState.showFoldGuide);
  const [accentColor, setAccentColor] = useState(initialState.accentColor);
  const [borderColor, setBorderColor] = useState(initialState.borderColor);
  const [surfaceColor, setSurfaceColor] = useState(initialState.surfaceColor);
  const [radiusScale, setRadiusScale] = useState(initialState.radiusScale);
  const [isDragActive, setIsDragActive] = useState(false);
  const [images, setImages] = useState(getDefaultImages);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStatus, setPdfStatus] = useState("");
  const fontMenuRef = useRef(null);
  const pdfRenderRef = useRef(null);

  useEffect(() => {
    const fontQuery = fonts.map((font) => `family=${font.replaceAll(" ", "+")}:wght@400;500;700`).join("&");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target)) {
        setIsFontMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateStorage() {
      try {
        const storedImages = await loadImagesFromIndexedDb();
        if (isCancelled) {
          return;
        }

        if (Array.isArray(storedImages) && storedImages.length > 0) {
          setImages(storedImages);
        } else {
          const legacyImages = getLegacyLocalImages();
          if (legacyImages?.length) {
            setImages(legacyImages);
            await saveImagesToIndexedDb(legacyImages);
          }
        }
      } catch {
        const legacyImages = getLegacyLocalImages();
        if (!isCancelled && legacyImages?.length) {
          setImages(legacyImages);
        }
        if (!isCancelled) {
          setStorageNotice("Persistenza immagini ridotta: IndexedDB non disponibile.");
        }
      } finally {
        if (!isCancelled) {
          setHasHydratedStorage(true);
        }
      }
    }

    hydrateStorage();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }

    try {
      const stateToPersist = {
        year,
        formatId,
        fontFamily,
        selectedStyle,
        selectedLayout,
        showFoldGuide,
        accentColor,
        borderColor,
        surfaceColor,
        radiusScale
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {
      setStorageNotice("Impossibile salvare la configurazione in localStorage.");
    }
  }, [
    accentColor,
    borderColor,
    fontFamily,
    formatId,
    hasHydratedStorage,
    radiusScale,
    showFoldGuide,
    selectedLayout,
    selectedStyle,
    surfaceColor,
    year
  ]);

  useEffect(() => {
    if (!hasHydratedStorage) {
      return;
    }

    saveImagesToIndexedDb(
      images.map((image) => ({
        id: image.id,
        src: image.src,
        name: image.name,
        isPreset: image.isPreset
      }))
    ).catch(() => {
      setStorageNotice("Immagini non persistite localmente: esporta JSON per salvarle.");
    });
  }, [hasHydratedStorage, images]);

  const pageFormat = useMemo(
    () => pageFormats.find((format) => format.id === formatId) ?? pageFormats[4],
    [formatId]
  );
  const selectedStyleDef = useMemo(
    () => styleOptions.find((style) => style.id === selectedStyle) ?? styleOptions[0],
    [selectedStyle]
  );
  const selectedLayoutDef = useMemo(
    () => layoutOptions.find((layout) => layout.id === selectedLayout) ?? layoutOptions[0],
    [selectedLayout]
  );

  const monthsData = useMemo(
    () =>
      months.map((label, monthIndex) => ({
        monthIndex,
        label,
        grid: buildMonthMatrix(year, monthIndex),
        image: images.length > 0 ? images[monthIndex % images.length] : null
      })),
    [images, year]
  );

  async function appendImages(files) {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return;
    }

    const nextImages = await Promise.all(
      imageFiles.map(async (file) => toImageItem(await fileToDataUrl(file), file.name))
    );

    setImages((current) => [...current, ...nextImages]);
  }

  async function handleImageUpload(event) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    await appendImages(files);
    event.target.value = "";
  }

  async function handleDrop(event) {
    event.preventDefault();
    setIsDragActive(false);
    await appendImages(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsDragActive(false);
  }

  function removeImage(imageId) {
    setImages((current) => current.filter((image) => image.id !== imageId));
  }

  async function handleExportPdf() {
    if (!pdfRenderRef.current || isExportingPdf) {
      return;
    }

    try {
      setIsExportingPdf(true);
      setPdfProgress(2);
      setPdfStatus("Preparazione pagine PDF");

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const pageNodes = Array.from(pdfRenderRef.current.querySelectorAll("[data-pdf-page='true']"));
      if (pageNodes.length === 0) {
        throw new Error("Nessuna pagina disponibile per l'export.");
      }

      const pdf = new jsPDF({
        orientation: pageFormat.width > pageFormat.height ? "landscape" : "portrait",
        unit: "mm",
        format: [pageFormat.width, pageFormat.height],
        compress: true
      });

      for (let index = 0; index < pageNodes.length; index += 1) {
        const pageNode = pageNodes[index];
        setPdfStatus(`Rendering mese ${index + 1} di ${pageNodes.length}`);
        setPdfProgress(Math.round((index / pageNodes.length) * 85) + 5);

        // Let React flush the progress state before heavy rendering.
        await new Promise((resolve) => window.requestAnimationFrame(resolve));

        const canvas = await html2canvas(pageNode, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false
        });

        const imageData = canvas.toDataURL("image/jpeg", 0.96);
        if (index > 0) {
          pdf.addPage([pageFormat.width, pageFormat.height], pageFormat.width > pageFormat.height ? "landscape" : "portrait");
        }
        pdf.addImage(imageData, "JPEG", 0, 0, pageFormat.width, pageFormat.height, undefined, "FAST");
      }

      setPdfProgress(96);
      setPdfStatus("Generazione file PDF");
      pdf.save(`calendario-${year}-${formatId}.pdf`);
      setPdfProgress(100);
      setPdfStatus("Download completato");
    } catch (error) {
      console.error(error);
      setPdfStatus("Esportazione PDF non riuscita");
    } finally {
      window.setTimeout(() => {
        setIsExportingPdf(false);
        setPdfProgress(0);
        setPdfStatus("");
      }, 900);
    }
  }

  function handleExportJson() {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        year,
        formatId,
        fontFamily,
        selectedStyle,
        selectedLayout,
        showFoldGuide,
        accentColor,
        borderColor,
        surfaceColor,
        radiusScale
      },
      images: images.map((image, index) => ({
        order: index + 1,
        id: image.id,
        name: image.name,
        src: image.src,
        isPreset: image.isPreset
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `calendario-${year}-${formatId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <div
      className="app-shell"
      style={{
        "--calendar-font": `'${fontFamily}', sans-serif`,
        "--accent-color": normalizeHexColor(accentColor, "#4f7cff"),
        "--accent-soft-10": mixColors(accentColor, "#ffffff", 0.1),
        "--accent-soft-14": mixColors(accentColor, "#ffffff", 0.14),
        "--accent-soft-18": mixColors(accentColor, "#ffffff", 0.18),
        "--accent-soft-30": mixColors(accentColor, "#ffffff", 0.3),
        "--accent-soft-35": mixColors(accentColor, "#ffcf94", 0.35),
        "--accent-soft-45": mixColors(accentColor, "#ffffff", 0.45),
        "--accent-dark-65": mixColors(accentColor, "#000000", 0.65),
        "--border-color": normalizeHexColor(borderColor, "#d7ddea"),
        "--border-soft-70": mixColors(borderColor, "#ffffff", 0.7),
        "--surface-color": normalizeHexColor(surfaceColor, "#fff6ec"),
        "--surface-warm-88": mixColors(surfaceColor, "#f0e0c7", 0.88),
        "--surface-light-92": mixColors(surfaceColor, "#ffffff", 0.92),
        "--radius-scale": `${radiusScale}px`
      }}
    >
      <header className="toolbar">
        <div className="toolbar__brand">
          <span className="toolbar__eyebrow">Calendar Composer</span>
          <h1>Calendari illustrati annuali</h1>
          <p className="toolbar__summary">
            Layout di stampa pieghevoli, preview mensile e generazione PDF nel formato pagina selezionato.
          </p>
          {storageNotice ? <p className="toolbar__notice">{storageNotice}</p> : null}
        </div>

        <div className="toolbar__controls">
          <label className="field">
            <span>Anno</span>
            <input
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(event) => setYear(Number(event.target.value) || currentYear)}
            />
          </label>

          <label className="field">
            <span>Formato Pagina</span>
            <select value={formatId} onChange={(event) => setFormatId(event.target.value)}>
              {pageFormats.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.label} ({format.width} x {format.height} mm)
                </option>
              ))}
            </select>
          </label>

          <div className="field field--wide" ref={fontMenuRef}>
            <span>Tema Font</span>
            <button
              type="button"
              className="font-picker"
              onClick={() => setIsFontMenuOpen((open) => !open)}
              style={{ fontFamily: `'${fontFamily}', sans-serif` }}
            >
              {fontFamily}
            </button>
            {isFontMenuOpen ? (
              <div className="font-menu">
                {fonts.map((font) => (
                  <button
                    key={font}
                    type="button"
                    className={font === fontFamily ? "font-menu__item is-active" : "font-menu__item"}
                    onClick={() => {
                      setFontFamily(font);
                      setIsFontMenuOpen(false);
                    }}
                    style={{ fontFamily: `'${font}', sans-serif` }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="field field--wide">
            <span>Layout Stampa</span>
            <select value={selectedLayout} onChange={(event) => setSelectedLayout(event.target.value)}>
              {layoutOptions.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field field--wide">
            <span>Stile Grafico</span>
            <select value={selectedStyle} onChange={(event) => setSelectedStyle(Number(event.target.value))}>
              {styleOptions.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field field--wide">
            <span>Tema Calendario</span>
            <div className="theme-config">
              <label className="theme-swatch">
                <i style={{ backgroundColor: accentColor }}></i>
                <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: borderColor }}></i>
                <input type="color" value={borderColor} onChange={(event) => setBorderColor(event.target.value)} />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: surfaceColor }}></i>
                <input type="color" value={surfaceColor} onChange={(event) => setSurfaceColor(event.target.value)} />
              </label>
              <label className="radius-control">
                <span>{radiusScale}px</span>
                <input
                  type="range"
                  min="0"
                  max="36"
                  step="1"
                  value={radiusScale}
                  onChange={(event) => setRadiusScale(Number(event.target.value))}
                />
              </label>
              <label className="toggle-inline">
                <input
                  type="checkbox"
                  checked={showFoldGuide}
                  onChange={(event) => setShowFoldGuide(event.target.checked)}
                />
                <span>Guida</span>
              </label>
            </div>
          </div>

          <div className="field field--wide field--actions">
            <span>Output</span>
            <div className="action-buttons">
              <button type="button" className="export-button" onClick={handleExportPdf} disabled={isExportingPdf}>
                {isExportingPdf ? "Esportazione PDF..." : "Esporta PDF"}
              </button>
              <button type="button" className="secondary-button" onClick={handleExportJson} disabled={isExportingPdf}>
                Esporta JSON
              </button>
            </div>
            {isExportingPdf ? (
              <div className="progress-block" aria-live="polite">
                <div className="progress-block__label">
                  <strong>{pdfStatus || "Rendering PDF"}</strong>
                  <span>{pdfProgress}%</span>
                </div>
                <div className="progress-block__track">
                  <div className="progress-block__value" style={{ width: `${pdfProgress}%` }}></div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="workspace">
        <aside className="filmstrip">
          <div className="filmstrip__header">
            <div>
              <span className="panel-label">Filmstrip</span>
              <h2>Immagini</h2>
            </div>
            <label className="upload-button">
              Carica
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
            </label>
          </div>

          <p className="filmstrip__hint">
            Trascina o carica molte immagini. I 12 mesi le assegnano in sequenza e il PDF usa le stesse risorse.
          </p>

          <div
            className={isDragActive ? "filmstrip-dropzone is-active" : "filmstrip-dropzone"}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="filmstrip-dropzone__copy">
              <strong>Drop multiplo immagini</strong>
              <span>Supporto drag and drop di piu file contemporaneamente.</span>
            </div>
          </div>

          <div className="filmstrip__list">
            {images.map((image, index) => (
              <article key={image.id} className="filmstrip-card">
                <button
                  type="button"
                  className="filmstrip-card__remove"
                  onClick={() => removeImage(image.id)}
                  aria-label={`Rimuovi ${image.name}`}
                >
                  x
                </button>
                <img src={image.src} alt={image.name} />
                <div className="filmstrip-card__meta">
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <span>{image.name}</span>
                </div>
              </article>
            ))}
            {images.length === 0 ? (
              <div className="filmstrip-empty">
                <p>Nessuna immagine caricata.</p>
                <p>Il calendario usera uno sfondo grafico senza foto.</p>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="calendar-content">
          <div className="calendar-content__header">
            <div>
              <span className="panel-label">Preview</span>
              <h2>Calendario {year}</h2>
            </div>
          </div>

          <div className="sheet-grid">
            {monthsData.map((month) => (
              <PrintSheetPreview
                key={month.label}
                month={month}
                fontFamily={fontFamily}
                styleName={selectedStyleDef.className}
                layoutName={selectedLayoutDef.id}
                showFoldGuide={showFoldGuide}
              />
            ))}
          </div>
        </section>
      </main>

      <div className="pdf-render-root" ref={pdfRenderRef} aria-hidden="true">
        {monthsData.map((month) => (
          <ExportSheetPage
            key={`pdf-${month.label}`}
            month={month}
            fontFamily={fontFamily}
            styleName={selectedStyleDef.className}
            layoutName={selectedLayoutDef.id}
            year={year}
            showFoldGuide={showFoldGuide}
            borderColor={borderColor}
            surfaceColor={surfaceColor}
          />
        ))}
      </div>
    </div>
  );
}

function PrintSheetPreview({ month, fontFamily, styleName, layoutName, showFoldGuide }) {
  const foldClass =
    layoutName === "vertical-split" || layoutName === "booklet-center"
      ? "sheet-preview__fold sheet-preview__fold--vertical"
      : "sheet-preview__fold sheet-preview__fold--horizontal";

  return (
    <article
      className={`sheet-preview ${styleName} layout-${layoutName}`}
      style={{
        "--month-font": `'${fontFamily}', sans-serif`
      }}
    >
      <div
        className="sheet-preview__image"
        style={{
          backgroundImage: month.image
            ? `linear-gradient(180deg, rgba(7, 12, 22, 0.08), rgba(7, 12, 22, 0.46)), url(${month.image.src})`
            : undefined
        }}
      >
        <div className="month-card__heading">
          <h3>{month.label}</h3>
        </div>
      </div>

      <div className="sheet-preview__calendar">
        <div className="sheet-preview__calendar-header">
          <strong>{month.label}</strong>
        </div>

        <div className="weekday-row">
          {weekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="day-grid">
          {month.grid.map((day, index) => (
            <span key={`${month.label}-${index}`} className={day ? "day-cell" : "day-cell day-cell--empty"}>
              {day ?? ""}
            </span>
          ))}
        </div>
      </div>

      {showFoldGuide ? <div className={foldClass}></div> : null}
    </article>
  );
}

function ExportSheetPage({ month, fontFamily, styleName, layoutName, year, showFoldGuide, borderColor, surfaceColor }) {
  const foldClass =
    layoutName === "vertical-split" || layoutName === "booklet-center"
      ? "sheet-preview__fold sheet-preview__fold--vertical"
      : "sheet-preview__fold sheet-preview__fold--horizontal";

  return (
    <article
      data-pdf-page="true"
      className={`sheet-preview sheet-preview--pdf ${styleName} layout-${layoutName}`}
      style={{
        "--month-font": `'${fontFamily}', sans-serif`,
        "--pdf-border-color": borderColor,
        "--pdf-surface-color": surfaceColor
      }}
    >
      <div
        className="sheet-preview__image"
        style={{
          backgroundImage: month.image
            ? `linear-gradient(180deg, rgba(7, 12, 22, 0.08), rgba(7, 12, 22, 0.46)), url(${month.image.src})`
            : undefined
        }}
      >
        <div className="month-card__heading">
          <h3>{month.label}</h3>
        </div>
      </div>

      <div className="sheet-preview__calendar">
        <div className="sheet-preview__calendar-header">
          <strong>
            {month.label} {year}
          </strong>
        </div>

        <div className="weekday-row">
          {weekdays.map((weekday) => (
            <span key={`${month.label}-pdf-${weekday}`}>{weekday}</span>
          ))}
        </div>

        <div className="day-grid">
          {month.grid.map((day, index) => (
            <span key={`${month.label}-pdf-${index}`} className={day ? "day-cell" : "day-cell day-cell--empty"}>
              {day ?? ""}
            </span>
          ))}
        </div>

      </div>

      {showFoldGuide ? <div className={foldClass}></div> : null}
    </article>
  );
}
