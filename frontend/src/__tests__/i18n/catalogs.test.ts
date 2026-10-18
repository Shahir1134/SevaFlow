import { describe, it, expect } from 'vitest'
import { en } from '../../i18n/catalogs/en'
import { hi } from '../../i18n/catalogs/hi'

describe('i18n Message Catalogs Parity', () => {
  const enKeys = Object.keys(en).sort()
  const hiKeys = Object.keys(hi).sort()

  it('verifies en and hi catalogs have identical key sets', () => {
    const missingInHi = enKeys.filter((k) => !(k in hi))
    const missingInEn = hiKeys.filter((k) => !(k in en))

    expect(
      missingInHi,
      `Keys present in English but missing in Hindi: ${missingInHi.join(', ')}`
    ).toEqual([])

    expect(
      missingInEn,
      `Keys present in Hindi but missing in English: ${missingInEn.join(', ')}`
    ).toEqual([])

    expect(enKeys).toEqual(hiKeys)
  })

  it('ensures no keys have empty or whitespace-only translation values in English', () => {
    Object.entries(en).forEach(([key, value]) => {
      expect(
        typeof value === 'string' && value.trim().length > 0,
        `English key '${key}' has an empty or invalid value`
      ).toBe(true)
    })
  })

  it('ensures no keys have empty or whitespace-only translation values in Hindi', () => {
    Object.entries(hi).forEach(([key, value]) => {
      expect(
        typeof value === 'string' && value.trim().length > 0,
        `Hindi key '${key}' has an empty or invalid value`
      ).toBe(true)
    })
  })
})
