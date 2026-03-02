import { useEffect, useMemo, useRef, useState } from "react";

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

function toImageItem(src, name, isPreset = false, isObjectUrl = false) {
  return {
    id: `${name}-${Math.random().toString(36).slice(2, 9)}`,
    src,
    name,
    isPreset,
    isObjectUrl
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPrintDocument({ year, pageFormat, fontFamily, styleDefinition, layoutDefinition, monthsData }) {
  const fontQuery = fonts.map((font) => `family=${font.replaceAll(" ", "+")}:wght@400;500;700`).join("&");
  const css = `
    @page {
      size: ${pageFormat.width}mm ${pageFormat.height}mm;
      margin: 0;
    }

    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body { font-family: '${fontFamily}', sans-serif; color: #101828; }
    .print-root { width: ${pageFormat.width}mm; margin: 0 auto; }
    .print-page {
      position: relative;
      width: ${pageFormat.width}mm;
      height: ${pageFormat.height}mm;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      background: #ffffff;
    }
    .print-page:last-child { page-break-after: auto; break-after: auto; }
    .print-page__bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .print-page__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(8, 15, 28, 0.02), rgba(8, 15, 28, 0.16));
    }
    .print-sheet {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      padding: 8mm;
      display: grid;
      gap: 6mm;
    }
    .print-layout-half-top,
    .print-layout-half-bottom {
      grid-template-rows: 1fr 1fr;
    }
    .print-layout-vertical-split,
    .print-layout-booklet-center {
      grid-template-columns: 1fr 1fr;
    }
    .print-layout-half-bottom .print-image-panel { order: 2; }
    .print-layout-half-bottom .print-calendar-panel { order: 1; }
    .print-fold-guide {
      position: absolute;
      z-index: 2;
      opacity: 0.9;
      pointer-events: none;
    }
    .print-fold-guide--horizontal {
      left: 8mm;
      right: 8mm;
      top: 50%;
      border-top: 0.4mm dashed rgba(16, 24, 40, 0.3);
    }
    .print-fold-guide--vertical {
      top: 8mm;
      bottom: 8mm;
      left: 50%;
      border-left: 0.4mm dashed rgba(16, 24, 40, 0.3);
    }
    .print-image-panel,
    .print-calendar-panel {
      position: relative;
      overflow: hidden;
      border-radius: 5mm;
    }
    .print-image-panel {
      min-height: 0;
      background:
        linear-gradient(180deg, rgba(6, 12, 21, 0.08), rgba(6, 12, 21, 0.18)),
        linear-gradient(135deg, #6283e5, #f0aa62);
      background-size: cover;
      background-position: center;
    }
    .print-booklet-cover {
      position: absolute;
      left: 4mm;
      top: 4mm;
      padding: 2mm 3mm;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.82);
      font-size: 3mm;
      font-weight: 700;
      letter-spacing: 0.4mm;
      text-transform: uppercase;
    }
    .print-heading {
      position: absolute;
      left: 5mm;
      right: 5mm;
      bottom: 5mm;
      color: #ffffff;
    }
    .print-heading__index {
      display: block;
      margin-bottom: 1.5mm;
      font-size: 3.2mm;
      letter-spacing: 0.8mm;
      text-transform: uppercase;
      opacity: 0.82;
    }
    .print-heading h2 {
      margin: 0;
      font-size: 11mm;
      line-height: 0.94;
    }
    .print-calendar-panel {
      display: grid;
      grid-template-rows: auto auto 1fr;
      padding: 5mm;
      background: rgba(255, 255, 255, 0.96);
      color: #101828;
      border: 0.25mm solid rgba(16, 24, 40, 0.08);
    }
    .print-calendar-header {
      display: flex;
      justify-content: space-between;
      gap: 4mm;
      align-items: flex-end;
      margin-bottom: 4mm;
    }
    .print-calendar-header h3 {
      margin: 0;
      font-size: 6mm;
      line-height: 1;
    }
    .print-calendar-header span {
      font-size: 3mm;
      letter-spacing: 0.5mm;
      text-transform: uppercase;
      color: rgba(16, 24, 40, 0.66);
    }
    .print-weekdays,
    .print-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1.4mm;
    }
    .print-weekdays {
      margin-bottom: 1.8mm;
      font-size: 2.7mm;
      font-weight: 700;
      text-transform: uppercase;
      color: rgba(16, 24, 40, 0.62);
    }
    .print-day {
      min-height: 8.5mm;
      display: grid;
      place-items: center;
      border-radius: 2mm;
      font-size: 3.4mm;
      background: rgba(16, 24, 40, 0.05);
    }
    .print-day.is-empty { background: rgba(16, 24, 40, 0.025); color: transparent; }
    .print-page__footer {
      display: flex;
      justify-content: space-between;
      margin-top: 3mm;
      font-size: 2.6mm;
      color: rgba(16, 24, 40, 0.62);
    }
    .print-layout-booklet-center .print-calendar-panel,
    .print-layout-vertical-split .print-calendar-panel {
      height: calc(100% - 0mm);
    }
    .print-layout-booklet-center .print-image-panel,
    .print-layout-vertical-split .print-image-panel {
      height: calc(100% - 0mm);
    }
    .print-layout-booklet-center .print-image-panel {
      border-top-right-radius: 1.2mm;
      border-bottom-right-radius: 1.2mm;
    }
    .print-layout-booklet-center .print-calendar-panel {
      border-top-left-radius: 1.2mm;
      border-bottom-left-radius: 1.2mm;
      box-shadow: inset -0.6mm 0 0 rgba(16, 24, 40, 0.08);
    }
    .print-style-1 .print-page__overlay { background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.32) 100%); }
    .print-style-2 .print-calendar-panel { background: #f6ead7; }
    .print-style-2 .print-image-panel::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0));
    }
    .print-style-3 .print-calendar-panel { background: rgba(255, 249, 239, 0.98); border: 0.25mm solid rgba(158, 111, 66, 0.18); }
    .print-style-4 .print-page__overlay { background: linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 45%, rgba(0, 0, 0, 0.1) 100%); }
    .print-style-5 .print-image-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.26), transparent 18%),
        radial-gradient(circle at 82% 16%, rgba(255, 255, 255, 0.16), transparent 16%);
    }
    .print-style-6 .print-image-panel::before {
      content: "";
      position: absolute;
      inset: 4mm 4mm auto;
      height: 32mm;
      border: 0.35mm solid rgba(255, 255, 255, 0.4);
      border-bottom: 0;
      border-radius: 50mm 50mm 0 0;
    }
    .print-style-7 .print-calendar-panel { box-shadow: inset 3mm 0 0 rgba(16, 24, 40, 0.08); }
    .print-style-8 .print-image-panel::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0.2mm, transparent 0.2mm),
        linear-gradient(rgba(255, 255, 255, 0.08) 0.2mm, transparent 0.2mm);
      background-size: 14mm 14mm;
    }
  `;

  const pages = monthsData
    .map((month) => {
      const imageStyle = month.image ? ` style="background-image: url('${month.image.src}');"` : "";
      const foldClass =
        layoutDefinition.id === "vertical-split" || layoutDefinition.id === "booklet-center"
          ? "print-fold-guide print-fold-guide--vertical"
          : "print-fold-guide print-fold-guide--horizontal";

      const calendarDays = month.grid
        .map(
          (day) =>
            `<div class="print-day${day ? "" : " is-empty"}">${day ? escapeHtml(day) : "&nbsp;"}</div>`
        )
        .join("");

      return `
        <section class="print-page ${styleDefinition.printClass}">
          <div class="print-page__bg"></div>
          <div class="print-page__overlay"></div>
          <div class="print-sheet print-layout-${layoutDefinition.id}">
            <div class="print-image-panel"${imageStyle}>
              <div class="print-booklet-cover">${escapeHtml(pageFormat.label)} • ${escapeHtml(layoutDefinition.label)}</div>
              <div class="print-heading">
                <span class="print-heading__index">${String(month.monthIndex + 1).padStart(2, "0")}</span>
                <h2>${escapeHtml(month.label)}</h2>
              </div>
            </div>
            <div class="print-calendar-panel">
              <div class="print-calendar-header">
                <div>
                  <span>${escapeHtml(layoutDefinition.label)}</span>
                  <h3>${escapeHtml(month.label)} ${escapeHtml(year)}</h3>
                </div>
                <span>${escapeHtml(month.image ? month.image.name : "No image")}</span>
              </div>
              <div class="print-weekdays">${weekdays.map((weekday) => `<div>${escapeHtml(weekday)}</div>`).join("")}</div>
              <div class="print-days">${calendarDays}</div>
              <div class="print-page__footer">
                <span>Formato ${escapeHtml(pageFormat.label)} ${pageFormat.width} x ${pageFormat.height} mm</span>
                <span>${escapeHtml(fontFamily)}</span>
              </div>
            </div>
          </div>
          <div class="${foldClass}"></div>
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="it">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Calendario ${escapeHtml(year)} ${escapeHtml(pageFormat.label)}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fontQuery}&display=swap">
        <style>${css}</style>
      </head>
      <body>
        <main class="print-root">${pages}</main>
        <script>
          const runPrint = async () => {
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
            setTimeout(() => window.print(), 150);
          };
          window.addEventListener("load", runPrint);
          window.addEventListener("afterprint", () => window.close());
        </script>
      </body>
    </html>
  `;
}

export default function App() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [formatId, setFormatId] = useState("A4");
  const [fontFamily, setFontFamily] = useState(fonts[0]);
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0].id);
  const [selectedLayout, setSelectedLayout] = useState(layoutOptions[0].id);
  const [isDragActive, setIsDragActive] = useState(false);
  const [images, setImages] = useState(
    starterImages.map((src, index) => toImageItem(src, `Preset ${index + 1}`, true))
  );
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const fontMenuRef = useRef(null);
  const objectUrlsRef = useRef(new Set());

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

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    },
    []
  );

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

  function appendImages(files) {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return;
    }

    const nextImages = imageFiles.map((file) => {
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(objectUrl);
      return toImageItem(objectUrl, file.name, false, true);
    });

    setImages((current) => [...current, ...nextImages]);
  }

  function handleImageUpload(event) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    appendImages(files);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragActive(false);
    appendImages(event.dataTransfer.files);
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
    setImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove?.isObjectUrl) {
        URL.revokeObjectURL(imageToRemove.src);
        objectUrlsRef.current.delete(imageToRemove.src);
      }
      return current.filter((image) => image.id !== imageId);
    });
  }

  function handleGeneratePdf() {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      window.alert("Impossibile aprire la finestra di stampa. Verifica il blocco popup del browser.");
      return;
    }

    const printDocument = buildPrintDocument({
      year,
      pageFormat,
      fontFamily,
      styleDefinition: selectedStyleDef,
      layoutDefinition: selectedLayoutDef,
      monthsData
    });

    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();
  }

  return (
    <div className="app-shell" style={{ "--calendar-font": `'${fontFamily}', sans-serif` }}>
      <header className="toolbar">
        <div className="toolbar__brand">
          <span className="toolbar__eyebrow">Calendar Composer</span>
          <h1>Calendari illustrati annuali</h1>
          <p className="toolbar__summary">
            Layout di stampa pieghevoli, preview mensile e generazione PDF nel formato pagina selezionato.
          </p>
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
            <div className="layout-picker">
              {layoutOptions.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  className={layout.id === selectedLayout ? "layout-card is-active" : "layout-card"}
                  onClick={() => setSelectedLayout(layout.id)}
                >
                  <strong>{layout.label}</strong>
                  <span>{layout.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field field--wide">
            <span>Stile Grafico</span>
            <div className="style-picker">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={style.id === selectedStyle ? "style-chip is-active" : "style-chip"}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field field--wide field--actions">
            <span>Output</span>
            <button type="button" className="export-button" onClick={handleGeneratePdf}>
              Genera PDF
            </button>
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
            <div className="calendar-meta">
              <span>{pageFormat.label}</span>
              <span>{selectedLayoutDef.label}</span>
              <span>{selectedStyleDef.label}</span>
              <span style={{ fontFamily: `'${fontFamily}', sans-serif` }}>{fontFamily}</span>
            </div>
          </div>

          <div className="print-specs">
            <div>
              <strong>Pagina finale</strong>
              <span>
                {pageFormat.width} x {pageFormat.height} mm
              </span>
            </div>
            <div>
              <strong>Guida piega</strong>
              <span>{selectedLayoutDef.id === "vertical-split" || selectedLayoutDef.id === "booklet-center" ? "Verticale centrale" : "Orizzontale centrale"}</span>
            </div>
            <div>
              <strong>PDF</strong>
              <span>Stampa browser con `@page` precisa e colori forzati</span>
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
                layoutLabel={selectedLayoutDef.label}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function PrintSheetPreview({ month, format, fontFamily, styleName, layoutName, layoutLabel }) {
  const ratio = format.width / format.height;
  const foldClass =
    layoutName === "vertical-split" || layoutName === "booklet-center"
      ? "sheet-preview__fold sheet-preview__fold--vertical"
      : "sheet-preview__fold sheet-preview__fold--horizontal";

  return (
    <article
      className={`sheet-preview ${styleName} layout-${layoutName}`}
      style={{
        "--card-ratio": `${ratio}`,
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
        <div className="month-card__image-badge">{month.image ? month.image.name : "No image"}</div>
        <div className="month-card__heading">
          <span>{month.monthIndex + 1}</span>
          <h3>{month.label}</h3>
        </div>
      </div>

      <div className="sheet-preview__calendar">
        <div className="sheet-preview__calendar-header">
          <div>
            <span>{layoutLabel}</span>
            <strong>{month.label}</strong>
          </div>
          <small>{format.label}</small>
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

      <div className={foldClass}></div>
    </article>
  );
}
