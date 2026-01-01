import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image src="/assets/medical-shield.jpg" alt="MediCore-AI Logo" className="rounded-full" width={40} height={40} />
              <span className="font-poppins font-bold text-2xl">MediCore-AI</span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Revolutionizing medical coding with AI-powered automation for hospitals and healthcare providers.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Product</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">API Documentation</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Company</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">News</Link></li>
              <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold font-poppins">Support</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Training</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/60">© 2024 MediCore-AI. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-primary-foreground/60 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-primary-foreground/60 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="text-primary-foreground/60 hover:text-white transition-colors">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
