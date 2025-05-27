import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ReactNode } from "react";
import { Dumbbell } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
  footerLinkHref: string;
  footerLinkText: string;
  footerText: string;
}

export function AuthFormWrapper({
  title,
  description,
  children,
  footerLinkHref,
  footerLinkText,
  footerText,
}: AuthFormWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{APP_NAME}</span>
          </Link>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            {footerText}{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href={footerLinkHref}>{footerLinkText}</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
