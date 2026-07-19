import AdminLayout from '@/components/layout/AdminLayout'
import React from 'react'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AdminLayout>{children}</AdminLayout>
    )
}

