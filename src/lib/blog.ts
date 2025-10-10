import fs from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';
import { z } from 'zod';

const contentDirectory = path.join(process.cwd(), 'content', 'blog');

const PostFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  excerpt: z.string(),
});

type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;
type Post<TFrontmatter> = {
  meta: TFrontmatter;
  slug: string;
};

// Function to get a single post by slug
export async function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, '');
  const filePath = path.join(contentDirectory, `${realSlug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });

  const { frontmatter, content } = await compileMDX<PostFrontmatter>({
    source: fileContent,
    options: { parseFrontmatter: true },
  });
  
  const validatedFrontmatter = PostFrontmatterSchema.parse(frontmatter);

  return { meta: { ...validatedFrontmatter, slug: realSlug }, content };
}


// Function to get all posts metadata
export async function getAllPosts(): Promise<Post<PostFrontmatter>[]> {
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }
  
  const files = fs.readdirSync(contentDirectory);

  const posts: Post<PostFrontmatter>[] = [];
  
  for (const file of files) {
    const filePath = path.join(contentDirectory, file);
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });

    try {
        const { frontmatter } = await compileMDX<PostFrontmatter>({
            source: fileContent,
            options: { parseFrontmatter: true },
        });

        const validatedFrontmatter = PostFrontmatterSchema.parse(frontmatter);

        posts.push({
            meta: validatedFrontmatter,
            slug: file.replace(/\.mdx$/, ''),
        });
    } catch (error) {
        console.warn(`Could not process frontmatter for file: ${file}. Skipping. Error:`, error);
    }
  }

  return posts.sort((a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime());
}
