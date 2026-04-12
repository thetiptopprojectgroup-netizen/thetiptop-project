import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingPlayButton from './FloatingPlayButton';
import GameReviewsSection from '../reviews/GameReviewsSection';

export default function Layout() {
  return (
    <div className="site-playful-bg min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <GameReviewsSection />
      <Footer />
      <FloatingPlayButton />
    </div>
  );
}
