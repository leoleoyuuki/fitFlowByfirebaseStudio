import { getAllPosts } from "@/lib/blog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Header } from "@/components/layout/header";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Blog | ${APP_NAME}`,
  description: "Artigos e dicas para profissionais de educação física e nutrição otimizarem seus negócios e a experiência de seus clientes.",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Blog {APP_NAME}</h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Conteúdos estratégicos para ajudar sua academia a crescer.
              </p>
            </div>
            
            {posts.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhum post encontrado. Volte em breve!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                    <Card key={post.slug} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-xl leading-snug hover:text-primary transition-colors">
                        <Link href={`/blog/${post.slug}`}>
                            {post.meta.title}
                        </Link>
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground pt-2">
                        <Calendar className="mr-2 h-4 w-4" />
                        <time dateTime={post.meta.date}>
                            {format(new Date(post.meta.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                        </time>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardDescription>{post.meta.excerpt}</CardDescription>
                    </CardContent>
                    <CardFooter>
                        <Button asChild variant="outline" className="w-full">
                        <Link href={`/blog/${post.slug}`}>Ler Artigo Completo</Link>
                        </Button>
                    </CardFooter>
                    </Card>>
                ))}
                </div>
            )}
          </div>
        </section>
      </main>
       <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. Menos espera, mais resultados para sua academia.</p>
        </div>
      </footer>
    </div>
  );
}
