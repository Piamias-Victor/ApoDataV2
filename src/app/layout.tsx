import type { Metadata } from "next";
import "./globals.css";

import { Providers } from "@/providers/Providers";
import { QueryProvider } from "@/lib/providers/QueryProvider";

import { SideNavBar } from "@/components/organisms/SideNavBar/SideNavBar";

export const metadata: Metadata = {
    title: "ApoData - Reprenez la main sur vos données",
    description: "Maîtrisez vos données pharmaceutiques avec une simplicité inégalée",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body>
                <QueryProvider>
                    <Providers>
                        <SideNavBar />
                        {children}
                    </Providers>
                </QueryProvider>
            </body>
        </html>
    );
}
