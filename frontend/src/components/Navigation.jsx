import { Button } from "@/components/ui/button";
import logoSvg from "@/assets/medical-shield.jpg";
import { useLocation, useNavigate, Link } from "react-router-dom";
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="sticky top-4 z-50 ">
      <div className="max-w-[70%] mx-auto flex items-center justify-between px-6 py-3 rounded-2xl backdrop-blur-md shadow-md border border-gray-200 border-b border-gray-200 bg-blue-700/10 backdrop-blur-lg">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={logoSvg} 
            alt="MediCode-AI Logo" 
            className="rounded-full w-9 h-9 lg:w-10 lg:h-10"
          />
          <span className="font-bold text-lg lg:text-xl text-blue-800 tracking-tight">
            MediCode-AI
          </span>
        </div>

        {/* Navigation links */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-10">
          <a
            href="#features"
            className="text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base transition-colors"
          >
            Features
          </a>
          <a
            href="#benefits"
            className="text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base transition-colors"
          >
            Benefits
          </a>
          <a
            href="#contact"
            className="text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base transition-colors"
          >
            Contact
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="hidden md:inline-flex text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm lg:text-base px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate("/login")}
          >
            Request Demo
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
