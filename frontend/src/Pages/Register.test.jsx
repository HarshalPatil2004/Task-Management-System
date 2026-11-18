import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Register from './Register'

const renderRegister = () => {
  const props = {
    onRegistered: vi.fn(),
    onExistingAccount: vi.fn(),
    onGoToLogin: vi.fn(),
  }
  render(<Register {...props} />)
  return props
}

const fillValidForm = async (user) => {
  await user.type(screen.getByLabelText('Name'), 'Harshal Patil')
  await user.type(screen.getByLabelText('Email address'), '  Harshal.Patil@example.com  ')
  await user.type(screen.getByLabelText('Password'), 'Password123')
  await user.type(screen.getByLabelText('Confirm password'), 'Password123')
}

describe('Register', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('TC-01 shows an error for a blank name', async () => {
    const user = userEvent.setup()
    renderRegister()

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter your name.')
  })

  it('TC-02 shows an error for an invalid email', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByLabelText('Name'), 'Harshal')
    await user.type(screen.getByLabelText('Email address'), 'invalid-email')

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.')
  })

  it('TC-03 shows an error for a password shorter than eight characters', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByLabelText('Name'), 'Harshal')
    await user.type(screen.getByLabelText('Email address'), 'harshal@example.com')
    await user.type(screen.getByLabelText('Password'), 'Short1')

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters.')
  })

  it('TC-04 shows an error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.type(screen.getByLabelText('Name'), 'Harshal')
    await user.type(screen.getByLabelText('Email address'), 'harshal@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123')
    await user.type(screen.getByLabelText('Confirm password'), 'Password456')

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.')
  })

  it('TC-05 registers valid normalized input', async () => {
    const user = userEvent.setup()
    const props = renderRegister()
    fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({ message: 'Registered' }),
    })
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: 'Harshal Patil',
        email: 'harshal.patil@example.com',
        password: 'Password123',
      }),
    })
    expect(props.onRegistered).toHaveBeenCalledWith('harshal.patil@example.com')
  })

  it('TC-06 redirects an existing account response', async () => {
    const user = userEvent.setup()
    const props = renderRegister()
    fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: vi.fn().mockResolvedValue({ message: 'Account exists' }),
    })
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(props.onExistingAccount).toHaveBeenCalledWith('harshal.patil@example.com')
  })

  it('TC-07 displays a server validation error', async () => {
    const user = userEvent.setup()
    renderRegister()
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ message: 'Email is already in use.' }),
    })
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Email is already in use.')
  })

  it('TC-08 displays a connection error when fetch throws a TypeError', async () => {
    const user = userEvent.setup()
    renderRegister()
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Cannot reach the registration service.')
  })
})