import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { KeysClientPage } from './client-page';
import type { ApiKey } from '@/types';

// Mock server actions
jest.mock('./actions', () => ({
  deleteApiKey: jest.fn().mockResolvedValue(undefined),
  revokeApiKey: jest.fn().mockResolvedValue(undefined),
}));

const mockInitialKeys: ApiKey[] = [
  {
    id: 'key_1',
    name: 'WebApp Production',
    key: 'ks_ollama_prod_xxxxxxxxxxxxxxxxxxxxxx_a1b2',
    status: 'active',
    createdAt: '2023-05-15T10:00:00Z',
    lastUsed: '2024-07-20T14:30:00Z',
    usage: 5420,
    rateLimit: 100,
  },
  {
    id: 'key_2',
    name: 'Mobile App iOS',
    key: 'ks_ollama_ios_xxxxxxxxxxxxxxxxxxxxxxx_c3d4',
    status: 'revoked',
    createdAt: '2023-06-01T11:00:00Z',
    lastUsed: '2024-07-21T09:15:00Z',
    usage: 3105,
    rateLimit: 100,
  },
];

// Mock the fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockInitialKeys),
  })
) as jest.Mock;


describe('KeysClientPage', () => {
  it('renders the main heading and subheading', () => {
    render(<KeysClientPage initialKeys={mockInitialKeys} />);

    const heading = screen.getByRole('heading', { level: 1, name: /API Keys/i });
    expect(heading).toBeInTheDocument();

    const subheading = screen.getByText(/Manage API keys for accessing your services./i);
    expect(subheading).toBeInTheDocument();
  });

  it('renders the "Generate New Key" and "Refresh" buttons', () => {
    render(<KeysClientPage initialKeys={mockInitialKeys} />);

    const generateButton = screen.getByRole('button', { name: /Generate New Key/i });
    expect(generateButton).toBeInTheDocument();

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('renders the table with the correct number of initial keys', () => {
    render(<KeysClientPage initialKeys={mockInitialKeys} />);

    const rows = screen.getAllByRole('row');
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3); 
  });

  it('displays the names and statuses of the API keys correctly', () => {
    render(<KeysClientPage initialKeys={mockInitialKeys} />);

    expect(screen.getByText('WebApp Production')).toBeInTheDocument();
    expect(screen.getByText('Mobile App iOS')).toBeInTheDocument();

    const activeBadges = screen.getAllByText('active');
    expect(activeBadges.length).toBeGreaterThan(0);

    const revokedBadges = screen.getAllByText('revoked');
    expect(revokedBadges.length).toBeGreaterThan(0);
  });
});

