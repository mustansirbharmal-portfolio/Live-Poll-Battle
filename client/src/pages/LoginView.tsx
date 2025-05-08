import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginViewProps {
  onLogin: (username: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError("Please enter a username");
      return;
    }
    
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    
    onLogin(trimmedUsername);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardContent className="pt-6 px-6 pb-8">
          <h2 className="text-2xl font-semibold text-center mb-6">Welcome to Poll Battle</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </Label>
              <Input
                type="text"
                id="username"
                name="username"
                placeholder="Enter a unique username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="w-full"
                required
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
            
            <div className="flex justify-center">
              <Button type="submit" className="w-full bg-primary text-white">
                Continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginView;
