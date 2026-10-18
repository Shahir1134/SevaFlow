import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ServiceUnavailable } from '../../components/ServiceUnavailable'
import { I18nProvider } from '../../i18n/useI18n'

describe('ServiceUnavailable component', () => {
  it('renders feature name and SERVICE_UNAVAILABLE badge', () => {
    render(
      <I18nProvider>
        <ServiceUnavailable featureName="Policy Analysis AI" />
      </I18nProvider>
    )

    expect(screen.getByText('SERVICE_UNAVAILABLE')).toBeInTheDocument()
    expect(screen.getAllByText(/Policy Analysis AI/).length).toBeGreaterThan(0)
  })

  it('renders custom reason message and official source link', () => {
    render(
      <I18nProvider>
        <ServiceUnavailable
          featureName="Hospital Search"
          reason="NHA API is offline."
          officialSourceUrl="https://hospitals.pmjay.gov.in"
          officialSourceName="NHA Portal"
        />
      </I18nProvider>
    )

    expect(screen.getByText('NHA API is offline.')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /NHA Portal/ })
    expect(link).toHaveAttribute('href', 'https://hospitals.pmjay.gov.in')
  })

  it('calls onRetry callback when retry button is clicked', async () => {
    const user = userEvent.setup()
    const handleRetry = vi.fn()

    render(
      <I18nProvider>
        <ServiceUnavailable
          featureName="Claims Gateway"
          onRetry={handleRetry}
        />
      </I18nProvider>
    )

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    await user.click(retryBtn)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
