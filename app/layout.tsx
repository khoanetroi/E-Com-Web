import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const SITE_URL = "https://www.telectric.vn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TELECTRIC - Chuyên Dụng Cụ Đo Lường Điện Chính Hãng",
    template: "%s | TELECTRIC",
  },
  description: "Chuyên cung cấp các loại dụng cụ đo lường điện chính hãng, giá tốt nhất thị trường. Fluke, Hioki, Kyoritsu, Sanwa, APECH.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "TELECTRIC - Chuyên Dụng Cụ Đo Lường Điện Chính Hãng",
    description: "Chuyên cung cấp các loại dụng cụ đo lường điện chính hãng, giá tốt nhất thị trường.",
    type: "website",
    siteName: "TELECTRIC",
    url: SITE_URL,
    locale: "vi_VN",
    images: [`${SITE_URL}/img/banner.png`],
  },
  icons: {
    icon: [
      { url: '/img/icon.png' },
    ],
    apple: [
      { url: '/img/icon.png' },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TELECTRIC - Chuyên Dụng Cụ Đo Lường Điện Chính Hãng",
    description: "Chuyên cung cấp các loại dụng cụ đo lường điện chính hãng, giá tốt nhất thị trường.",
    images: [`${SITE_URL}/img/banner.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // TODO: Thêm Google Search Console verification code
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

import { Toaster } from "@/components/ui/toaster";
import ZaloButton from "@/components/common/ZaloButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        {/* Organization Structured Data cho Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "TELECTRIC",
              url: SITE_URL,
              logo: `${SITE_URL}/img/icon.png`,
              description: "Nhà phân phối dụng cụ đo lường điện chính hãng hàng đầu Việt Nam. Fluke, Hioki, Kyoritsu, Sanwa, APECH.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+84-934-001-435",
                contactType: "sales",
                areaServed: "VN",
                availableLanguage: "Vietnamese",
              },
              sameAs: [
                "https://zalo.me/0934001435",
              ],
            }),
          }}
        />
        {/* LocalBusiness for Google Maps / Local SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "TELECTRIC - Thiết Bị Đo Lường Chính Hãng",
              url: SITE_URL,
              telephone: "+84-934-001-435",
              priceRange: "₫₫",
              image: `${SITE_URL}/img/icon.png`,
              description: "Chuyên cung cấp dụng cụ đo lường điện chính hãng từ các thương hiệu Fluke, Hioki, Kyoritsu, Sanwa, APECH với giá tốt nhất.",
            }),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          {/* <DefaultLayout> */}
          {children}
          {/* </DefaultLayout> */}
          <Toaster />
          <ZaloButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
