import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="space-y-4 text-center lg:text-left">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-4xl font-extrabold leading-snug">
              <span className="text-gray-900">Revolutionize</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Medical Coding</span>
              <br />
              <span className="text-gray-900">with AI</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Automate ICD-10 and CPT-4 coding, reduce claim rejections by 85%, and accelerate your revenue cycle with our AI-powered solution.
            </p>
          </div>

          <div className="space-y-4">
            {["99.7% coding accuracy with AI validation", "75% faster claim processing", "Real-time patient transparency dashboard"].map(
              (item, idx) => (
                <div key={idx} className="flex items-center gap-3 justify-center lg:justify-start">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-800 font-medium text-base">{item}</span>
                </div>
              )
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 lg:px-8 py-3 text-base rounded-xl shadow-md transition-all duration-300 group">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 lg:px-8 py-3 text-base rounded-xl"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        <div className="relative mt-12 lg:mt-0">
          <div className="bg-gradient-to-tr from-indigo-50 to-blue-100 rounded-3xl p-5 lg:p-8 shadow-xl">
            <Image
              src="/assets/medical-team.jpg"
              alt="Professional medical team using MediCore-AI"
              className="w-full max-w-[540px] mx-auto h-auto object-cover rounded-2xl"
              width={540}
              height={560}
              priority
            />
          </div>

          <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 lg:p-5 shadow-xl border border-gray-200">
            <div className="text-sm text-gray-500">Claim Accuracy</div>
            <div className="text-xl lg:text-2xl font-bold text-green-600">99.7%</div>
          </div>

          <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 lg:p-5 shadow-xl border border-gray-200">
            <div className="text-sm text-gray-500">Processing Speed</div>
            <div className="text-xl lg:text-2xl font-bold text-indigo-600">3x Faster</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
