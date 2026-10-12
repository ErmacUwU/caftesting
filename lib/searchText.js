// Búsqueda de texto insensible a mayúsculas y acentos: "maria" encuentra
// "María", "nunez" encuentra "Núñez". Se usa como `searchBy` de los
// SelectPicker de rsuite (su búsqueda por defecto sí distingue acentos).
export function normalizeSearchText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function searchByLabel(keyword, label) {
  return normalizeSearchText(label).includes(normalizeSearchText(keyword));
}
