import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock some of the components that might cause issues in a basic test
vi.mock('./context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock HomePage as it's lazy loaded and might have its own logic
vi.mock('./pages/HomePage', () => ({
  default: () => <div>Home Page Content</div>,
}));

vi.mock('./pages/LoginPage', () => ({
  default: () => <div>Login Page Content</div>,
}));

vi.mock('./pages/RegisterPage', () => ({
  default: () => <div>Register Page Content</div>,
}));

describe('App', () => {
  it('renders loading state initially or home page', async () => {
    render(<App />);
    
    // Since everything is lazy loaded, we might see the loader or the home page depending on resolution
    const homePage = await screen.findByText(/Home Page Content/i);
    expect(homePage).toBeDefined();
  });
});
