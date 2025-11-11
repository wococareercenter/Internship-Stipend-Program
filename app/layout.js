import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScaleProvider } from "./context/ScaleContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ISP Platform",
  description: "automated scoring for the Internship Stipend Program",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ScaleProvider>
          {children}
        </ScaleProvider>
      </body>
    </html>
  );
}
