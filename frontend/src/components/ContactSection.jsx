import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";

const ContactSection = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data) => {
    console.log("Form submitted:", data);
    setSubmitted(true);
    reset();

    // Hide success message after 5s
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-poppins text-foreground">
            Get Started Today
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Ready to revolutionize your medical coding process? Contact our team
            for a personalized demonstration and implementation strategy.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-foreground font-poppins">
                Contact Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Email</div>
                    <div className="text-muted-foreground">
                      contact@MediCode-ai.com
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Phone</div>
                    <div className="text-muted-foreground">
                      +1 (555) 123-4567
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Address</div>
                    <div className="text-muted-foreground">
                      Healthcare Innovation Center
                      <br />
                      123 Medical Plaza, Suite 400
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-foreground font-poppins">
                Implementation Support
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 24/7 technical support during rollout</li>
                <li>• Comprehensive staff training programs</li>
                <li>• Custom integration with existing systems</li>
                <li>• Ongoing optimization and updates</li>
              </ul>
            </div>
          </div>

          {/* Request a Demo Form */}
          <Card className="gradient-card border-0 shadow-large">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-foreground font-poppins">
                  Request a Demo
                </h3>
                <p className="text-muted-foreground">
                  See MediCode-AI in action with your own data
                </p>
              </div>

              {submitted && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center">
                  ✅ Thanks! We'll be in touch soon.
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Hospital Name */}
                <div>
                  <label
                    htmlFor="hospital"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Hospital Name
                  </label>
                  <input
                    id="hospital"
                    type="text"
                    autoComplete="organization"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your hospital name"
                    {...register("hospital", {
                      required: "Hospital name is required",
                    })}
                  />
                  {errors.hospital && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.hospital.message}
                    </p>
                  )}
                </div>

                {/* Your Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your full name"
                    {...register("name", { required: "Your name is required" })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your phone number"
                    {...register("phone", {
                      required: "Phone number is required",
                    })}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gradient-primary text-white border-0 shadow-medium hover:scale-[1.02] hover:shadow-large transition-all duration-300"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Schedule Demo Call"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
