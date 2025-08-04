import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Building, Users, Mail, Lock, ArrowRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageCarousel } from "@/components/admin/ImageCarousel";
import { useNavigate } from "react-router-dom";

type UserRole = "super-admin" | "property-owner" | "agent";

interface LoginForm {
  email: string;
  password: string;
  role: UserRole | null;
}

const roleConfig = {
  "super-admin": {
    title: "Super Admin Portal",
    description: "Complete system control and analytics",
    icon: Shield,
    color: "text-red-600",
    badge: "Admin"
  },
  "property-owner": {
    title: "Property Owner Portal",
    description: "Manage properties & maximize revenue", 
    icon: Building,
    color: "text-orange-600",
    badge: "Owner"
  },
  "agent": {
    title: "Agent Dashboard",
    description: "Client relations & booking management",
    icon: Users,
    color: "text-red-500",
    badge: "Agent"
  }
};

export const LoginPage = () => {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    role: null
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    setForm(prev => ({ ...prev, role: role as UserRole }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.role || !form.email || !form.password) {
      toast({
        title: "Missing Information",
        description: "Please select a role and fill in all fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Login Successful",
      description: `Welcome to the ${roleConfig[form.role].title}!`,
    });

    // Navigate based on role
    if (form.role === "super-admin") {
      navigate("/super-admin-dashboard");
    } else {
      console.log("Logging in as:", form.role, form.email);
      // Handle other role redirects here
    }
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/50 to-red-50/30 flex">
      {/* Left Side - Carousel */}
      <div className="hidden lg:flex lg:w-3/5 relative">
        <div className="w-full h-screen">
          <ImageCarousel />
        </div>
        
        {/* Floating Logo */}
        <div className="absolute top-8 left-8 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/40 shadow-lg">
            <img 
              src="/lovable-uploads/7777450f-e840-48c6-999b-89029812533f.png" 
              alt="Picnify Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>

        {/* Floating Welcome Text */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2 text-white z-10 max-w-md">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8">
            <h1 className="text-4xl font-bold mb-4 animate-fade-in">
              Welcome to Picnify
            </h1>
            <p className="text-xl opacity-90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Your comprehensive property management platform for seamless operations
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-white/80 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          {/* Mobile Logo & Header */}
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <img 
                src="/lovable-uploads/7777450f-e840-48c6-999b-89029812533f.png" 
                alt="Picnify Logo" 
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sign In
            </h1>
            <p className="text-gray-600">
              Access your property management portal
            </p>
          </div>

          {/* Login Form */}
          <Card className="shadow-2xl border-gray-200/80 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl text-gray-900">
                {form.role ? (
                  <span>Login to {roleConfig[form.role].title}</span>
                ) : (
                  "Choose Portal & Login"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Role Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                  Select Your Portal
                </Label>
                <Select onValueChange={handleRoleSelect} value={form.role || ""}>
                  <SelectTrigger className="w-full h-12 bg-white border-gray-300 text-gray-900">
                    <div className="flex items-center gap-3">
                      <SelectValue placeholder="Choose your access level" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-xl z-50">
                    {Object.entries(roleConfig).map(([role, config]) => {
                      return (
                        <SelectItem 
                          key={role} 
                          value={role}
                          className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 text-gray-900"
                        >
                          <div className="flex items-center gap-3 py-2">
                            <div className="text-left">
                              <div className="font-medium text-sm hover:text-black transition-colors">{config.title}</div>
                              <div className="text-xs text-gray-500">{config.description}</div>
                            </div>
                            <div className="ml-auto px-2 py-1 bg-gray-200 rounded-full text-xs font-medium text-gray-700">
                              {config.badge}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10 h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                      value={form.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10 h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                      value={form.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold group mt-6 bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 transition-all duration-300" 
                  disabled={!form.role}
                >
                  {form.role ? (
                    <>
                      Access {roleConfig[form.role].badge} Portal
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    "Select a Portal First"
                  )}
                </Button>
                
                <div className="text-center pt-4">
                  <Button variant="link" type="button" className="text-sm text-gray-600 hover:text-gray-900">
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 Picnify. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};