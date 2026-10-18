import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiSelect, handleMultiSelectToggle } from '../../onboarding/components/MultiSelect'
import { I18nProvider } from '../../i18n/useI18n'
import type { QuestionOption } from '../../onboarding/types'

const testOptions: QuestionOption[] = [
  { value: 'none', labelKey: 'None of the above', exclusive: true },
  { value: 'diabetes', labelKey: 'Diabetes' },
  { value: 'hypertension', labelKey: 'Hypertension' },
  { value: 'heart', labelKey: 'Heart disease' },
  { value: 'prefer_not', labelKey: 'Prefer not to say', exclusive: true },
]

describe('MultiSelect component and Exclusivity Logic', () => {
  describe('handleMultiSelectToggle helper', () => {
    it('selects a regular option when list is empty', () => {
      const result = handleMultiSelectToggle([], testOptions[1]!, testOptions)
      expect(result).toEqual(['diabetes'])
    })

    it('adds multiple regular options', () => {
      const result = handleMultiSelectToggle(['diabetes'], testOptions[2]!, testOptions)
      expect(result).toEqual(['diabetes', 'hypertension'])
    })

    it('removes an already selected regular option', () => {
      const result = handleMultiSelectToggle(['diabetes', 'hypertension'], testOptions[1]!, testOptions)
      expect(result).toEqual(['hypertension'])
    })

    it('clears all regular selections when an exclusive option (None) is selected', () => {
      const current = ['diabetes', 'hypertension', 'heart']
      const result = handleMultiSelectToggle(current, testOptions[0]!, testOptions)
      // Only 'none' should be in the returned array
      expect(result).toEqual(['none'])
    })

    it('clears exclusive option when a regular option is subsequently selected', () => {
      const current = ['none']
      const result = handleMultiSelectToggle(current, testOptions[1]!, testOptions)
      // 'none' must be removed, only 'diabetes' remains
      expect(result).toEqual(['diabetes'])
    })

    it('switches to new exclusive option if another exclusive option was already selected', () => {
      const current = ['none']
      const result = handleMultiSelectToggle(current, testOptions[4]!, testOptions)
      expect(result).toEqual(['prefer_not'])
    })

    it('deselects exclusive option when clicked again', () => {
      const current = ['none']
      const result = handleMultiSelectToggle(current, testOptions[0]!, testOptions)
      expect(result).toEqual([])
    })
  })

  describe('MultiSelect UI rendering & clicks', () => {
    it('renders all options as checkboxes', () => {
      render(
        <I18nProvider>
          <MultiSelect
            options={testOptions}
            value={['diabetes']}
            onChange={() => {}}
          />
        </I18nProvider>
      )

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(testOptions.length)

      const diabetesBtn = screen.getByRole('checkbox', { name: /Diabetes/i })
      expect(diabetesBtn).toHaveAttribute('aria-checked', 'true')

      const noneBtn = screen.getByRole('checkbox', { name: /None of the above/i })
      expect(noneBtn).toHaveAttribute('aria-checked', 'false')
    })

    it('invokes onChange with exclusive value when None is clicked', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()

      render(
        <I18nProvider>
          <MultiSelect
            options={testOptions}
            value={['diabetes', 'heart']}
            onChange={handleChange}
          />
        </I18nProvider>
      )

      const noneBtn = screen.getByRole('checkbox', { name: /None of the above/i })
      await user.click(noneBtn)

      expect(handleChange).toHaveBeenCalledWith(['none'])
    })
  })
})
