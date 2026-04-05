import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '../App'

// Placeholder test - will be replaced with real tests later
test('App mounts without crashing', () => {
  render(<App />)
  expect(document.body).toBeTruthy()
})
