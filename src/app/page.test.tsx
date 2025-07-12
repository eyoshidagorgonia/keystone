import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import DashboardPage from './page'

// Mock the apiKeyService used by the page
jest.mock('@/lib/apiKeyService', () => ({
  getApiKeys: jest.fn().mockResolvedValue([]),
}));

// Mock the client component
jest.mock('@/components/dashboard-client-page', () => ({
    DashboardClientPage: ({ initialKeys }: { initialKeys: any[] }) => (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome to your KeyStone API dashboard.</p>
            <div data-testid="keys-count">{initialKeys.length}</div>
        </div>
    )
}));

describe('DashboardPage', () => {
  it('renders a heading', async () => {
    // We need to resolve the promise returned by the async component
    const Page = await DashboardPage({});
    render(Page);
 
    const heading = screen.getByRole('heading', { level: 1, name: /Dashboard/i })
 
    expect(heading).toBeInTheDocument()
  })
})
