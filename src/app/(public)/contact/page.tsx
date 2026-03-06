import { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

// Metadata export pour SEO
export const metadata: Metadata = {
  title: 'Rejoindre la liste Early Adopter | Ultron CRM CGP',
  description: 'Inscrivez-vous pour accéder en avant-première au CRM IA conçu pour les CGP français. Tarif early adopter garanti.',
  keywords: ['CRM CGP', 'gestion patrimoine', 'early adopter', 'logiciel CGP'],
  openGraph: {
    title: 'Rejoindre la liste Early Adopter | Ultron CRM CGP',
    description: 'Inscrivez-vous pour accéder en avant-première au CRM IA conçu pour les CGP français.',
  }
};

export default function ContactPage() {
  return <ContactPageClient />;
}