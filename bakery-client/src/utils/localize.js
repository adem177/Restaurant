/**
 * Localized text helpers.
 *
 * API entities expose parallel columns per language (name_fr, name_ar, name_en).
 * These helpers resolve the active language and fall back to French when the
 * translation is missing, so English never shows an empty label.
 */

/**
 * @param {{ [key: string]: unknown } | null | undefined} entity
 * @param {'name' | 'description'} field
 * @param {string} lang - active language code (fr | en | ar)
 * @returns {string}
 */
export function localized(entity, field, lang) {
  if (!entity) return ''
  const value = entity[`${field}_${lang}`]
  return value || entity[`${field}_fr`] || ''
}

/**
 * @param {{ name_fr?: string, name_en?: string, name_ar?: string } | null} product
 * @param {string} lang
 * @returns {string}
 */
export function localizedName(product, lang) {
  return localized(product, 'name', lang)
}

/**
 * @param {{ description_fr?: string, description_en?: string, description_ar?: string } | null} product
 * @param {string} lang
 * @returns {string}
 */
export function localizedDescription(product, lang) {
  return localized(product, 'description', lang)
}
