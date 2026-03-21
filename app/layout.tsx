import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nexus AI Suite - Free AI for Indian Students',
  description: 'Complete AI workspace with 150+ models, Python IDE, RoboBuilder, team collaboration & more. Built for government school students.',
  keywords: 'AI education, free AI tools, Python IDE, robot builder, CBSE learning, Indian students',
  authors: [{ name: 'Dhairya' }],
  openGraph: {
    title: 'Nexus AI Suite',
    description: 'Free AI-powered learning platform for Indian students',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body>
        <div className="matrix-bg" />
        {children}
      </body>
    </html>
  );
}
