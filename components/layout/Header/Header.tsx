
import { MainHeader } from "./MainHeader";
import { NavBar } from "./NavBar";

const Header = () => {
    return (
        <header className="flex flex-col w-full relative z-50 bg-industrial-black">
            {/* TopBar is removed to match reference design */}
            <div className="w-full">
                <MainHeader />
                <NavBar />
            </div>
        </header>
    );
};

export default Header;
