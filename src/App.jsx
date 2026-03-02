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
  { id: "A6", label: "A6", width: 105, height: 148 },
  { id: "A7", label: "A7", width: 74, height: 105 },
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

function waitForNodeImages(node) {
  const imageNodes = Array.from(node.querySelectorAll("img"));
  if (imageNodes.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(
    imageNodes.map(
      (imageNode) =>
        new Promise((resolve) => {
          if (imageNode.complete && imageNode.naturalWidth > 0) {
            if (typeof imageNode.decode === "function") {
              imageNode.decode().catch(() => {}).finally(resolve);
              return;
            }

            resolve();
            return;
          }

          const complete = () => {
            imageNode.removeEventListener("load", complete);
            imageNode.removeEventListener("error", complete);
            resolve();
          };

          imageNode.addEventListener("load", complete, { once: true });
          imageNode.addEventListener("error", complete, { once: true });
        })
    )
  ).then(() => undefined);
}

function isValidOption(value, options, key = "id") {
  return options.some((option) => option[key] === value);
}

function getDefaultImages() {
  return [];
}

function getDefaultImageTransform() {
  return { x: 0, y: 0, zoom: 1 };
}

function sanitizeImageTransforms(value, mode = "viewport-v2") {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, transform]) => {
      const rawX = Number.isFinite(transform?.x) ? transform.x : 0;
      const rawY = Number.isFinite(transform?.y) ? transform.y : 0;
      let nextX = rawX;
      let nextY = rawY;

      if (mode === "legacy-position-v0") {
        nextX = (rawX - 50) / 50;
        nextY = (rawY - 50) / 50;
      } else if (mode === "translate-v1") {
        nextX = rawX / 100;
        nextY = rawY / 100;
      }

      return [
        key,
        {
          x: Math.min(1, Math.max(-1, nextX)),
          y: Math.min(1, Math.max(-1, nextY)),
          zoom: Number.isFinite(transform?.zoom) ? transform.zoom : 1
        }
      ];
    })
  );
}

function sanitizeMonthImageAssignments(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, imageId]) => typeof imageId === "string" && imageId.trim() !== "")
  );
}

function getInitialState(currentYear) {
  const fallback = {
    year: currentYear,
    formatId: "A4",
    fontFamily: fonts[0],
    selectedStyle: styleOptions[0].id,
    selectedLayout: layoutOptions[0].id,
    showFoldGuide: true,
    monthImageTransforms: {},
    monthImageAssignments: {},
    accentColor: "#4f7cff",
    dayCellColor: "#eef3ff",
    monthBorderColor: "#d7ddea",
    dayBorderColor: "#c9d4ea",
    surfaceColor: "#fff6ec",
    radiusScale: 18,
    showMonthTextOnImage: true,
    showMonthTextOutline: true,
    monthTextColor: "#ffffff",
    monthTextOutlineColor: "#070c16"
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
      monthImageTransforms: sanitizeImageTransforms(parsedState.monthImageTransforms, parsedState.imageTransformMode ?? "legacy-position-v0"),
      monthImageAssignments: sanitizeMonthImageAssignments(parsedState.monthImageAssignments),
      accentColor: typeof parsedState.accentColor === "string" ? parsedState.accentColor : fallback.accentColor,
      dayCellColor: typeof parsedState.dayCellColor === "string" ? parsedState.dayCellColor : fallback.dayCellColor,
      monthBorderColor:
        typeof parsedState.monthBorderColor === "string"
          ? parsedState.monthBorderColor
          : typeof parsedState.borderColor === "string"
            ? parsedState.borderColor
            : fallback.monthBorderColor,
      dayBorderColor: typeof parsedState.dayBorderColor === "string" ? parsedState.dayBorderColor : fallback.dayBorderColor,
      surfaceColor: typeof parsedState.surfaceColor === "string" ? parsedState.surfaceColor : fallback.surfaceColor,
      radiusScale: Number(parsedState.radiusScale) || fallback.radiusScale,
      showMonthTextOnImage:
        typeof parsedState.showMonthTextOnImage === "boolean"
          ? parsedState.showMonthTextOnImage
          : fallback.showMonthTextOnImage,
      showMonthTextOutline:
        typeof parsedState.showMonthTextOutline === "boolean"
          ? parsedState.showMonthTextOutline
          : fallback.showMonthTextOutline,
      monthTextColor: typeof parsedState.monthTextColor === "string" ? parsedState.monthTextColor : fallback.monthTextColor,
      monthTextOutlineColor:
        typeof parsedState.monthTextOutlineColor === "string"
          ? parsedState.monthTextOutlineColor
          : fallback.monthTextOutlineColor
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

function importProjectState(payload, currentYear) {
  const settings = payload?.settings ?? {};
  const importedImages = Array.isArray(payload?.images)
    ? payload.images
        .filter((image) => typeof image?.src === "string" && typeof image?.name === "string")
        .map((image) => ({
          id: image.id || `${image.name}-${Math.random().toString(36).slice(2, 9)}`,
          src: image.src,
          name: image.name,
          isPreset: Boolean(image.isPreset)
        }))
    : [];

  return {
    year: Number(settings.year) || currentYear,
    formatId: isValidOption(settings.formatId, pageFormats) ? settings.formatId : "A4",
    fontFamily: isValidOption(settings.fontFamily, fonts.map((font) => ({ id: font }))) ? settings.fontFamily : fonts[0],
    selectedStyle: isValidOption(settings.selectedStyle, styleOptions) ? settings.selectedStyle : styleOptions[0].id,
    selectedLayout: isValidOption(settings.selectedLayout, layoutOptions) ? settings.selectedLayout : layoutOptions[0].id,
    showFoldGuide: typeof settings.showFoldGuide === "boolean" ? settings.showFoldGuide : true,
    monthImageTransforms: sanitizeImageTransforms(settings.monthImageTransforms, settings.imageTransformMode ?? "legacy-position-v0"),
    monthImageAssignments: sanitizeMonthImageAssignments(settings.monthImageAssignments),
    accentColor: typeof settings.accentColor === "string" ? settings.accentColor : "#4f7cff",
    dayCellColor: typeof settings.dayCellColor === "string" ? settings.dayCellColor : "#eef3ff",
    monthBorderColor:
      typeof settings.monthBorderColor === "string"
        ? settings.monthBorderColor
        : typeof settings.borderColor === "string"
          ? settings.borderColor
          : "#d7ddea",
    dayBorderColor: typeof settings.dayBorderColor === "string" ? settings.dayBorderColor : "#c9d4ea",
    surfaceColor: typeof settings.surfaceColor === "string" ? settings.surfaceColor : "#fff6ec",
    radiusScale: Number(settings.radiusScale) || 18,
    showMonthTextOnImage: typeof settings.showMonthTextOnImage === "boolean" ? settings.showMonthTextOnImage : true,
    showMonthTextOutline: typeof settings.showMonthTextOutline === "boolean" ? settings.showMonthTextOutline : true,
    monthTextColor: typeof settings.monthTextColor === "string" ? settings.monthTextColor : "#ffffff",
    monthTextOutlineColor:
      typeof settings.monthTextOutlineColor === "string" ? settings.monthTextOutlineColor : "#070c16",
    images: importedImages
  };
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
  const [monthImageTransforms, setMonthImageTransforms] = useState(initialState.monthImageTransforms);
  const [monthImageAssignments, setMonthImageAssignments] = useState(initialState.monthImageAssignments);
  const [accentColor, setAccentColor] = useState(initialState.accentColor);
  const [dayCellColor, setDayCellColor] = useState(initialState.dayCellColor);
  const [monthBorderColor, setMonthBorderColor] = useState(initialState.monthBorderColor);
  const [dayBorderColor, setDayBorderColor] = useState(initialState.dayBorderColor);
  const [surfaceColor, setSurfaceColor] = useState(initialState.surfaceColor);
  const [radiusScale, setRadiusScale] = useState(initialState.radiusScale);
  const [showMonthTextOnImage, setShowMonthTextOnImage] = useState(initialState.showMonthTextOnImage);
  const [showMonthTextOutline, setShowMonthTextOutline] = useState(initialState.showMonthTextOutline);
  const [monthTextColor, setMonthTextColor] = useState(initialState.monthTextColor);
  const [monthTextOutlineColor, setMonthTextOutlineColor] = useState(initialState.monthTextOutlineColor);
  const [isDragActive, setIsDragActive] = useState(false);
  const [images, setImages] = useState(getDefaultImages);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPreviewingPdfMonth, setIsPreviewingPdfMonth] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfPreviewMonthIndex, setPdfPreviewMonthIndex] = useState(new Date().getMonth());
  const [pdfPreviewImage, setPdfPreviewImage] = useState("");
  const fontMenuRef = useRef(null);
  const previewRefs = useRef(new Map());
  const importInputRef = useRef(null);

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
        imageTransformMode: "viewport-v2",
        monthImageTransforms,
        monthImageAssignments,
        accentColor,
        dayCellColor,
        monthBorderColor,
        dayBorderColor,
        surfaceColor,
        radiusScale,
        showMonthTextOnImage,
        showMonthTextOutline,
        monthTextColor,
        monthTextOutlineColor
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {
      setStorageNotice("Impossibile salvare la configurazione in localStorage.");
    }
  }, [
    accentColor,
    dayCellColor,
    monthBorderColor,
    dayBorderColor,
    fontFamily,
    formatId,
    hasHydratedStorage,
    monthTextColor,
    monthTextOutlineColor,
    monthImageAssignments,
    monthImageTransforms,
    radiusScale,
    showMonthTextOnImage,
    showMonthTextOutline,
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
    () => {
      const imageMap = new Map(images.map((image) => [image.id, image]));

      return months.map((label, monthIndex) => {
        const assignedImageId = monthImageAssignments[monthIndex];
        const assignedImage = assignedImageId ? imageMap.get(assignedImageId) ?? null : null;

        return {
          monthIndex,
          label,
          grid: buildMonthMatrix(year, monthIndex),
          image: assignedImage ?? (images.length > 0 ? images[monthIndex % images.length] : null),
          imageTransform: monthImageTransforms[monthIndex] ?? getDefaultImageTransform()
        };
      });
    },
    [images, monthImageAssignments, monthImageTransforms, year]
  );

  function updateMonthImageTransform(monthIndex, updater) {
    setMonthImageTransforms((current) => {
      const base = current[monthIndex] ?? getDefaultImageTransform();
      const next = typeof updater === "function" ? updater(base) : updater;

      return {
        ...current,
        [monthIndex]: {
          x: Math.min(1, Math.max(-1, next.x)),
          y: Math.min(1, Math.max(-1, next.y)),
          zoom: Math.min(3, Math.max(1, next.zoom))
        }
      };
    });
  }

  function resetMonthImageTransform(monthIndex) {
    setMonthImageTransforms((current) => ({
      ...current,
      [monthIndex]: getDefaultImageTransform()
    }));
  }

  function assignImageToMonth(monthIndex, imageId) {
    setMonthImageAssignments((current) => ({
      ...current,
      [monthIndex]: imageId
    }));
  }

  async function appendImages(files) {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return [];
    }

    const nextImages = await Promise.all(
      imageFiles.map(async (file) => toImageItem(await fileToDataUrl(file), file.name))
    );

    setImages((current) => [...current, ...nextImages]);
    return nextImages;
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
    setMonthImageAssignments((current) =>
      Object.fromEntries(Object.entries(current).filter(([, assignedImageId]) => assignedImageId !== imageId))
    );
  }

  async function captureMonthPreview(monthIndex) {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const month = monthsData[monthIndex];
    const pageNode = month ? previewRefs.current.get(month.label) : null;
    if (!pageNode) {
      throw new Error("Pagina mese non disponibile per la preview.");
    }

    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    await waitForNodeImages(pageNode);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    return html2canvas(pageNode, {
      scale: 4,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false
    });
  }

  async function handlePreviewPdfMonth() {
    if (isPreviewingPdfMonth || isExportingPdf) {
      return;
    }

    try {
      setIsPreviewingPdfMonth(true);
      const canvas = await captureMonthPreview(pdfPreviewMonthIndex);
      setPdfPreviewImage(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error(error);
      setStorageNotice("Anteprima PDF mese non disponibile.");
    } finally {
      setIsPreviewingPdfMonth(false);
    }
  }

  async function handleExportPdf() {
    if (isExportingPdf) {
      return;
    }

    try {
      setIsExportingPdf(true);
      setPdfProgress(2);
      setPdfStatus("Preparazione pagine PDF");

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const pageNodes = monthsData
        .map((month) => previewRefs.current.get(month.label))
        .filter(Boolean);

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

        const canvas = await captureMonthPreview(index);

        const imageData = canvas.toDataURL("image/png");
        if (index > 0) {
          pdf.addPage([pageFormat.width, pageFormat.height], pageFormat.width > pageFormat.height ? "landscape" : "portrait");
        }
        pdf.addImage(imageData, "PNG", 0, 0, pageFormat.width, pageFormat.height, undefined, "FAST");
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
        imageTransformMode: "viewport-v2",
        monthImageTransforms,
        monthImageAssignments,
        accentColor,
        dayCellColor,
        monthBorderColor,
        dayBorderColor,
        surfaceColor,
        radiusScale,
        showMonthTextOnImage,
        showMonthTextOutline,
        monthTextColor,
        monthTextOutlineColor
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

  async function handleImportJson(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const importedState = importProjectState(parsed, currentYear);

      setYear(importedState.year);
      setFormatId(importedState.formatId);
      setFontFamily(importedState.fontFamily);
      setSelectedStyle(importedState.selectedStyle);
      setSelectedLayout(importedState.selectedLayout);
      setShowFoldGuide(importedState.showFoldGuide);
      setMonthImageTransforms(importedState.monthImageTransforms);
      setMonthImageAssignments(importedState.monthImageAssignments);
      setAccentColor(importedState.accentColor);
      setDayCellColor(importedState.dayCellColor);
      setMonthBorderColor(importedState.monthBorderColor);
      setDayBorderColor(importedState.dayBorderColor);
      setSurfaceColor(importedState.surfaceColor);
      setRadiusScale(importedState.radiusScale);
      setShowMonthTextOnImage(importedState.showMonthTextOnImage);
      setShowMonthTextOutline(importedState.showMonthTextOutline);
      setMonthTextColor(importedState.monthTextColor);
      setMonthTextOutlineColor(importedState.monthTextOutlineColor);
      setImages(importedState.images);
      setStorageNotice("");
    } catch {
      setStorageNotice("Import JSON non valido.");
    } finally {
      event.target.value = "";
    }
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
        "--day-cell-color": normalizeHexColor(dayCellColor, "#eef3ff"),
        "--month-border-color": normalizeHexColor(monthBorderColor, "#d7ddea"),
        "--day-border-color": normalizeHexColor(dayBorderColor, "#c9d4ea"),
        "--day-border-soft": mixColors(dayBorderColor, "#ffffff", 0.7),
        "--surface-color": normalizeHexColor(surfaceColor, "#fff6ec"),
        "--surface-warm-88": mixColors(surfaceColor, "#f0e0c7", 0.88),
        "--surface-light-92": mixColors(surfaceColor, "#ffffff", 0.92),
        "--radius-scale": `${radiusScale}px`,
        "--month-text-color": normalizeHexColor(monthTextColor, "#ffffff"),
        "--month-text-outline-color": normalizeHexColor(monthTextOutlineColor, "#070c16")
      }}
    >
      <header className="toolbar">
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
        </div>

        <div className="toolbar__theme-row">
          <div className="field field--theme">
            <span>Tema Calendario</span>
            <div className="theme-config">
              <label className="theme-swatch">
                <i style={{ backgroundColor: accentColor }}></i>
                <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: dayCellColor }}></i>
                <input type="color" value={dayCellColor} onChange={(event) => setDayCellColor(event.target.value)} />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: monthBorderColor }}></i>
                <input
                  type="color"
                  value={monthBorderColor}
                  onChange={(event) => setMonthBorderColor(event.target.value)}
                />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: dayBorderColor }}></i>
                <input
                  type="color"
                  value={dayBorderColor}
                  onChange={(event) => setDayBorderColor(event.target.value)}
                />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: surfaceColor }}></i>
                <input type="color" value={surfaceColor} onChange={(event) => setSurfaceColor(event.target.value)} />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: monthTextColor }}></i>
                <input type="color" value={monthTextColor} onChange={(event) => setMonthTextColor(event.target.value)} />
              </label>
              <label className="theme-swatch">
                <i style={{ backgroundColor: monthTextOutlineColor }}></i>
                <input
                  type="color"
                  value={monthTextOutlineColor}
                  onChange={(event) => setMonthTextOutlineColor(event.target.value)}
                />
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
              <label className="toggle-inline">
                <input
                  type="checkbox"
                  checked={showMonthTextOnImage}
                  onChange={(event) => setShowMonthTextOnImage(event.target.checked)}
                />
                <span>Mese</span>
              </label>
              <label className="toggle-inline">
                <input
                  type="checkbox"
                  checked={showMonthTextOutline}
                  onChange={(event) => setShowMonthTextOutline(event.target.checked)}
                />
                <span>Outline</span>
              </label>
            </div>
          </div>
        </div>

        {storageNotice ? <p className="toolbar__notice toolbar__notice--row">{storageNotice}</p> : null}
        <div className="toolbar__actions">
          <div className="action-buttons">
            <select
              className="secondary-select"
              value={pdfPreviewMonthIndex}
              onChange={(event) => setPdfPreviewMonthIndex(Number(event.target.value))}
              disabled={isExportingPdf || isPreviewingPdfMonth}
            >
              {months.map((monthLabel, monthIndex) => (
                <option key={monthLabel} value={monthIndex}>
                  Preview {monthLabel}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="secondary-button"
              onClick={handlePreviewPdfMonth}
              disabled={isExportingPdf || isPreviewingPdfMonth}
            >
              {isPreviewingPdfMonth ? "Preview..." : "Preview PDF Mese"}
            </button>
            <button type="button" className="export-button" onClick={handleExportPdf} disabled={isExportingPdf}>
              {isExportingPdf ? "Esportazione PDF..." : "Esporta PDF"}
            </button>
            <button type="button" className="secondary-button" onClick={handleExportJson} disabled={isExportingPdf}>
              Esporta JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => importInputRef.current?.click()}
              disabled={isExportingPdf}
            >
              Importa JSON
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="visually-hidden"
              onChange={handleImportJson}
            />
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
              <article
                key={image.id}
                className="filmstrip-card"
                draggable="true"
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData("application/x-calendar-image-id", image.id);
                }}
              >
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
                format={pageFormat}
                fontFamily={fontFamily}
                styleName={selectedStyleDef.className}
                layoutName={selectedLayoutDef.id}
                showFoldGuide={showFoldGuide}
                showMonthTextOnImage={showMonthTextOnImage}
                showMonthTextOutline={showMonthTextOutline}
                onImageAdjust={updateMonthImageTransform}
                onImageReset={resetMonthImageTransform}
                onImageAssign={assignImageToMonth}
                onImageUpload={appendImages}
                registerNode={(node) => {
                  if (node) {
                    previewRefs.current.set(month.label, node);
                  } else {
                    previewRefs.current.delete(month.label);
                  }
                }}
              />
            ))}
          </div>
        </section>
      </main>

      {pdfPreviewImage ? (
        <div className="pdf-preview-modal" role="dialog" aria-modal="true" aria-label="Anteprima PDF mese">
          <div className="pdf-preview-modal__backdrop" onClick={() => setPdfPreviewImage("")}></div>
          <div className="pdf-preview-modal__panel">
            <div className="pdf-preview-modal__header">
              <strong>{months[pdfPreviewMonthIndex]}</strong>
              <button type="button" className="pdf-preview-modal__close" onClick={() => setPdfPreviewImage("")}>
                Chiudi
              </button>
            </div>
            <div className="pdf-preview-modal__content">
              <img src={pdfPreviewImage} alt={`Anteprima PDF ${months[pdfPreviewMonthIndex]}`} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PrintSheetPreview({
  month,
  format,
  fontFamily,
  styleName,
  layoutName,
  showFoldGuide,
  showMonthTextOnImage,
  showMonthTextOutline,
  onImageAdjust,
  onImageReset,
  onImageAssign,
  onImageUpload,
  registerNode
}) {
  const ratio = format.width / format.height;
  const dragStateRef = useRef(null);
  const imageViewportRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [imageRatio, setImageRatio] = useState(1);
  const [imageElement, setImageElement] = useState(null);
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const foldClass =
    layoutName === "vertical-split" || layoutName === "booklet-center"
      ? "sheet-preview__fold sheet-preview__fold--vertical"
      : "sheet-preview__fold sheet-preview__fold--horizontal";

  useEffect(() => {
    const viewportNode = imageViewportRef.current;
    if (!viewportNode) {
      return undefined;
    }

    const updateViewportSize = () => {
      const bounds = viewportNode.getBoundingClientRect();
      setViewportSize({
        width: Math.max(bounds.width, 1),
        height: Math.max(bounds.height, 1)
      });
    };

    updateViewportSize();

    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", updateViewportSize);
      return () => window.removeEventListener("resize", updateViewportSize);
    }

    const observer = new ResizeObserver(() => updateViewportSize());
    observer.observe(viewportNode);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!month.image?.src) {
      setImageRatio(1);
      setImageElement(null);
      return;
    }

    const nextImage = new Image();
    nextImage.onload = () => {
      if (nextImage.naturalWidth > 0 && nextImage.naturalHeight > 0) {
        setImageRatio(nextImage.naturalWidth / nextImage.naturalHeight);
        setImageElement(nextImage);
      }
    };
    nextImage.onerror = () => {
      setImageRatio(1);
      setImageElement(null);
    };
    nextImage.src = month.image.src;
  }, [month.image?.src]);

  const viewportRatio = viewportSize.width / viewportSize.height;
  const baseWidthPx =
    imageRatio > viewportRatio ? viewportSize.height * imageRatio : viewportSize.width;
  const baseHeightPx =
    imageRatio > viewportRatio ? viewportSize.height : viewportSize.width / imageRatio;
  const renderedWidthPx = baseWidthPx * month.imageTransform.zoom;
  const renderedHeightPx = baseHeightPx * month.imageTransform.zoom;
  const maxPanXPx = Math.max(0, (renderedWidthPx - viewportSize.width) / 2);
  const maxPanYPx = Math.max(0, (renderedHeightPx - viewportSize.height) / 2);

  useEffect(() => {
    const canvas = imageCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const cssWidth = Math.max(Math.round(viewportSize.width), 1);
    const cssHeight = Math.max(Math.round(viewportSize.height), 1);
    const deviceScale = window.devicePixelRatio || 1;
    canvas.width = Math.max(Math.round(cssWidth * deviceScale), 1);
    canvas.height = Math.max(Math.round(cssHeight * deviceScale), 1);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!imageElement) {
      return;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.scale(deviceScale, deviceScale);

    const scaleToCover = Math.max(viewportSize.width / imageElement.naturalWidth, viewportSize.height / imageElement.naturalHeight);
    const visibleSourceWidth = Math.min(
      imageElement.naturalWidth,
      viewportSize.width / (scaleToCover * month.imageTransform.zoom)
    );
    const visibleSourceHeight = Math.min(
      imageElement.naturalHeight,
      viewportSize.height / (scaleToCover * month.imageTransform.zoom)
    );
    const maxSourceX = Math.max(0, imageElement.naturalWidth - visibleSourceWidth);
    const maxSourceY = Math.max(0, imageElement.naturalHeight - visibleSourceHeight);
    const sourceX = Math.min(maxSourceX, Math.max(0, ((month.imageTransform.x + 1) / 2) * maxSourceX));
    const sourceY = Math.min(maxSourceY, Math.max(0, ((month.imageTransform.y + 1) / 2) * maxSourceY));
    const destinationBleedPx = 2;

    context.drawImage(
      imageElement,
      sourceX,
      sourceY,
      visibleSourceWidth,
      visibleSourceHeight,
      -destinationBleedPx,
      -destinationBleedPx,
      cssWidth + destinationBleedPx * 2,
      cssHeight + destinationBleedPx * 2
    );
  }, [
    baseHeightPx,
    baseWidthPx,
    imageElement,
    month.imageTransform.x,
    month.imageTransform.y,
    month.imageTransform.zoom,
    viewportSize.height,
    viewportSize.width
  ]);

  function stopImageDrag(event) {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      dragStateRef.current = null;
      setIsDraggingImage(false);
    }
  }

  function handleImagePointerDown(event) {
    if (!month.image || event.button !== 0) {
      return;
    }

    const mode = event.altKey ? "zoom" : event.shiftKey ? "pan" : null;
    if (!mode) {
      return;
    }

    event.preventDefault();
    const bounds = imageViewportRef.current?.getBoundingClientRect();
    dragStateRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTransform: month.imageTransform,
      viewportWidth: bounds?.width ?? 1,
      viewportHeight: bounds?.height ?? 1,
      maxPanXPx,
      maxPanYPx
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDraggingImage(true);
  }

  function handleImagePointerMove(event) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (dragState.mode === "pan") {
      onImageAdjust(month.monthIndex, (current) => ({
        ...current,
        x:
          dragState.maxPanXPx > 0
            ? dragState.startTransform.x + deltaX / dragState.maxPanXPx
            : 0,
        y:
          dragState.maxPanYPx > 0
            ? dragState.startTransform.y + deltaY / dragState.maxPanYPx
            : 0
      }));
      return;
    }

    if (dragState.mode === "zoom") {
      const zoomDelta = (deltaX / dragState.viewportWidth) * 2;
      onImageAdjust(month.monthIndex, (current) => ({
        ...current,
        zoom: dragState.startTransform.zoom + zoomDelta
      }));
    }
  }

  async function handleImageDrop(event) {
    event.preventDefault();
    setIsDropTarget(false);

    const draggedImageId = event.dataTransfer.getData("application/x-calendar-image-id");
    if (draggedImageId) {
      onImageAssign(month.monthIndex, draggedImageId);
      resetMonthImageTransform(month.monthIndex);
      return;
    }

    const imageFiles = Array.from(event.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return;
    }

    const nextImages = await onImageUpload(imageFiles);
    if (nextImages[0]) {
      onImageAssign(month.monthIndex, nextImages[0].id);
      resetMonthImageTransform(month.monthIndex);
    }
  }

  return (
    <article
      ref={registerNode}
      className={`sheet-preview ${styleName} layout-${layoutName}`}
      style={{
        "--card-ratio": `${ratio}`,
        "--month-font": `'${fontFamily}', sans-serif`
      }}
    >
      <div
        ref={imageViewportRef}
        className={isDropTarget ? "sheet-preview__image is-drop-target" : "sheet-preview__image"}
        onPointerDown={handleImagePointerDown}
        onPointerMove={handleImagePointerMove}
        onPointerUp={stopImageDrag}
        onPointerCancel={stopImageDrag}
        onDoubleClick={() => onImageReset(month.monthIndex)}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setIsDropTarget(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDropTarget(false);
          }
        }}
        onDrop={handleImageDrop}
        title="Shift + drag per pan, Alt + drag per zoom, doppio click per reset, drop immagine per sostituire"
      >
        {month.image ? (
          <div className="sheet-preview__image-viewport" aria-hidden="true">
            <canvas
              ref={imageCanvasRef}
              className={isDraggingImage ? "sheet-preview__image-canvas is-dragging" : "sheet-preview__image-canvas"}
            />
          </div>
        ) : null}
        {showMonthTextOnImage ? (
          <div className="month-card__heading">
            <h3 className={showMonthTextOutline ? "" : "month-card__title--no-outline"}>{month.label}</h3>
          </div>
        ) : null}
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
