import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ScrollToTop from '../../components/common/ScrollToTop';

function NavTest() {
  const navigate = useNavigate();
  return (
    <div>
      <button type="button" onClick={() => navigate('/b')}>
        Aller B
      </button>
      <Routes>
        <Route path="/a" element={<div>Page A</div>} />
        <Route path="/b" element={<div>Page B</div>} />
      </Routes>
    </div>
  );
}

describe('ScrollToTop (intégration router)', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  it('appelle scrollTo(0) au changement de route', () => {
    render(
      <MemoryRouter
        initialEntries={['/a']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ScrollToTop />
        <NavTest />
      </MemoryRouter>
    );
    expect(screen.getByText('Page A')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalled();
    window.scrollTo.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /aller b/i }));
    expect(screen.getByText('Page B')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0, left: 0, behavior: 'auto' })
    );
  });
});
