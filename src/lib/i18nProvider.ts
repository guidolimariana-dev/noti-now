import spanishMessages from "ra-language-spanish";
import polyglotI18nProvider from "ra-i18n-polyglot";
import { mergeTranslations } from "ra-core";

const customSpanishMessages = mergeTranslations(spanishMessages, {
  ra: {
    navigation: {
      page_rows_per_page: "Filas por página",
      page_range_info: "%{offsetBegin}-%{offsetEnd} de %{total}",
    },
    list: {
      no_results: "No se encuentran resultados",
    },
    validation: {
      required: "El campo %{field} es obligatorio. Por favor ingrese el dato correspondiente.",
    },
  },
});

export const i18nProvider = polyglotI18nProvider(
  () => customSpanishMessages,
  "es",
  [{ locale: "es", name: "Español" }],
  { allowMissing: true },
);
