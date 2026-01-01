"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  return (
    <nav className="sticky top-4 z-50">
      <div className="max-w-[70%] mx-auto flex items-center justify-between px-6 py-3 rounded-2xl backdrop-blur-md shadow-md border border-gray-200 bg-blue-700/10">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/medical-shield.jpg"
            alt="MediCore-AI Logo"
            className="rounded-full"
            width={40}
            height={40}
            priority
          />
          <span className="font-bold text-lg lg:text-xl text-blue-800 tracking-tight">MediCore-AI</span>
        </div>

        <div className="hidden md:flex items-center space-x-6 lg:space-x-10">
          <Link href="#features" className="text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base transition-colors">
            Features
          </Link>
          <Link href="#benefits" className="text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base transition-colors">
            Benefits
          </Link>
          <Link href="#contact" className="text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base transition-colors">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="hidden md:inline-flex text-gray-700 hover:text-indigo-600 font-medium text-sm lg:text-base"
            onClick={() => router.push("/login")}
          >
            {isAuthPage ? "Back" : "Login"}
          </Button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm lg:text-base px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
            onClick={() => router.push("/login")}
          >
            Request Demo
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
