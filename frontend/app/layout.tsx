import "./globals.css";
import { AuthProvider } from "@/src/context/AuthContext";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChatProvider } from "@/src/context/ChatContext";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>

        <AuthProvider>

          <ChatProvider>
            
            {children}
            
          </ChatProvider>

        </AuthProvider>

      </body>
    </html>
  );
}