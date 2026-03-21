import logoSvg from "@/assets/medical-shield.jpg";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src={logoSvg} 
                alt="MediCode-AI Logo" 
                className="w-10 h-10 invert"
              />
              <span className="font-poppins font-bold text-2xl">MediCode-AI</span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Revolutionizing medical coding with AI-powered automation for hospitals and healthcare providers.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Product</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Company</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">News</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Support</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Training</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/60">
            © 2024 MediCode-AI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-primary-foreground/60 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-primary-foreground/60 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-primary-foreground/60 hover:text-white transition-colors">Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;