import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for each post
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return {
      title: "Post não encontrado",
    };
  }
  return {
    title: `${post.meta.title} | ${APP_NAME}`,
    description: post.meta.excerpt,
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const { meta, content } = post;

  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-16 md:py-24">
            <div className="container mx-auto px-4">
                 <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
                    <div className="mb-8 text-center">
                        <Link href="/blog" className="no-underline">
                           <Button variant="outline" size="sm" className="mb-6">
                                <ArrowLeft className="mr-2 h-4 w-4"/>
                                Voltar para o Blog
                           </Button>
                        </Link>
                        <h1 className="text-4xl font-extrabold tracking-tight mb-2">{meta.title}</h1>
                        <div className="flex items-center justify-center text-base text-muted-foreground">
                            <Calendar className="mr-2 h-5 w-5" />
                            <time dateTime={meta.date}>
                                {format(new Date(meta.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                            </time>
                        </div>
                    </div>
                    
                    {/* Render the compiled MDX content */}
                    {content}
                </article>
            </div>
        </main>
         <footer className="py-8 bg-background border-t">
            <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. Menos espera, mais resultados para sua academia.</p>
            </div>
        </footer>
    </div>
  );
}
