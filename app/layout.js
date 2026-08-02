import './globals.css';

export const metadata = {
  title: 'ಫೀಲ್ಡ್ ಮಾರ್ಷಲ್ ಕರಿಯಪ್ಪ ಕಾಲೋನಿ — ಖರೀದಿದಾರರ ನೋಂದಣಿ | Buyer Registry',
  description:
    'Register your details for the affected buyers list being submitted to the Superintendent of Police, Vijayapura District.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="kn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Kannada:wght@500;700&family=Noto+Sans+Kannada:wght@400;500;600&family=Fraunces:wght@500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
