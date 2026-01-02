import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Target, Users } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "85% Reduction in Claim Rejections",
    description: "Drastically reduce claim denials with AI-validated coding accuracy",
    metric: "85%",
    color: "text-green-600",
  },
  {
    icon: Clock,
    title: "75% Faster Processing",
    description: "Accelerate your revenue cycle with automated workflows",
    metric: "3x",
    color: "text-indigo-600",
  },
  {
    icon: TrendingUp,
    title: "99.7% Coding Accuracy",
    description: "Industry-leading precision with AI confidence scoring",
    metric: "99.7%",
    color: "text-blue-600",
  },
  {
    icon: Users,
    title: "Enhanced Patient Trust",
    description: "Transparent billing promotes patient satisfaction and trust",
    metric: "100%",
    color: "text-amber-500",
  },
];

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Measurable Business Impact
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Transform your hospital's financial performance with quantifiable improvements in efficiency, accuracy, and patient satisfaction.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                </div>

                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${benefit.color}`}>{benefit.metric}</div>
                  <h3 className="text-base font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-tr from-indigo-50 to-blue-100 rounded-3xl p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Transform Your Medical Coding?</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Join leading hospitals that have already reduced coding errors, accelerated revenue cycles, and improved patient satisfaction with MediCore-AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300">
                Schedule Consultation
              </button>
              <button className="px-7 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                Download Case Studies
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
