
import type { PropsWithChildren } from "react";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";

const DefaultLayout = ({ children }: PropsWithChildren) => {
    return (
        <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
            <Header />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
        </div>
    );
};

export default DefaultLayout;
