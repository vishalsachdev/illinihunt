import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders its message and action button', async () => {
    const user = userEvent.setup()
    const handleAction = vi.fn()

    render(
      <EmptyState
        icon={Search}
        title="No projects yet"
        description="Try a different search."
        actionLabel="Reset filters"
        onAction={handleAction}
      />
    )

    expect(screen.getByRole('heading', { name: 'No projects yet' })).toBeInTheDocument()
    expect(screen.getByText('Try a different search.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset filters' }))

    expect(handleAction).toHaveBeenCalledTimes(1)
  })
})
