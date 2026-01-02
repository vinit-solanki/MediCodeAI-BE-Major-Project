"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactSection = () => {
  const [form, setForm] = useState({ hospital: "", name: "", email: "", phone: "", date: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.hospital) next.hospital = "Hospital name is required";
    if (!form.name) next.name = "Your name is required";
    if (!form.email) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.phone) next.phone = "Phone is required";
    if (!form.date) next.date = "Preferred date is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    setForm({ hospital: "", name: "", email: "", phone: "", date: "" });
    setTimeout(() => setSubmitted(false), 4000);
  };

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <section id="contact" className="py-12 sm:py-16 lg:py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-10 lg:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-poppins text-foreground">Get Started Today</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Ready to revolutionize your medical coding process? Contact our team for a personalized demonstration and implementation strategy.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground font-poppins">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Email</div>
                    <div className="text-muted-foreground">contact@medicore-ai.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Phone</div>
                    <div className="text-muted-foreground">+1 (555) 123-4567</div>
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
              <h4 className="text-base font-semibold text-foreground font-poppins">Implementation Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• 24/7 technical support during rollout</li>
                <li>• Comprehensive staff training programs</li>
                <li>• Custom integration with existing systems</li>
                <li>• Ongoing optimization and updates</li>
              </ul>
            </div>
          </div>

          <Card className="gradient-card border-0 shadow-lg">
            <CardContent className="p-7 space-y-5">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-foreground font-poppins">Request a Demo</h3>
                <p className="text-muted-foreground">See MediCore-AI in action with your own data</p>
              </div>

              {submitted && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-center">
                  ✅ Thanks! We'll be in touch soon.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="hospital" className="block text-sm font-medium text-foreground mb-2">
                    Hospital Name
                  </label>
                  <input
                    id="hospital"
                    type="text"
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your hospital name"
                    value={form.hospital}
                    onChange={(e) => update("hospital", e.target.value)}
                  />
                  {errors.hospital && <p className="text-red-500 text-sm mt-1">{errors.hospital}</p>}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your phone number"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                      Preferred Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={form.date}
                      onChange={(e) => update("date", e.target.value)}
                    />
                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Notes
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Tell us about your workflow or challenges"
                  />
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-sm font-semibold">
                  {submitted ? "Submitted" : "Schedule a Demo"}
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
