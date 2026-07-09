/**
 * Generatore di QR code. A differenza di password/UUID questo calcolatore è
 * PURO: non disegna nulla e non usa il caso. Ritorna il testo da codificare e
 * i parametri di rendering; è il runtime (modalità generatore, formato "qr")
 * a costruire la matrice SVG con la libreria vendored assets/js/data/qrcode.js.
 * Così la logica resta portabile 1:1 a .ts e testabile senza DOM.
 *
 * Ritorna { qr, level, cell, margin, info }.
 */
function generaQr(input) {
  var testo = (input.testo == null ? "" : String(input.testo)).trim();
  var livello = input.correzione || "M";
  if (["L", "M", "Q", "H"].indexOf(livello) === -1) livello = "M";
  var conBordo = input.bordo !== false;

  var info;
  if (!testo) {
    info = "Inserisci un testo o un URL";
  } else if (/^(https?:\/\/|www\.)/i.test(testo)) {
    info = "URL · " + testo.length + " caratteri";
  } else {
    info = "Testo · " + testo.length + (testo.length === 1 ? " carattere" : " caratteri");
  }

  return {
    qr: testo,
    level: livello,
    cell: 8,               // scala interna della matrice (l'SVG poi è scalabile)
    margin: conBordo ? 4 : 0,
    info: info
  };
}

registerCalculator("qr-gen-v1", generaQr);
