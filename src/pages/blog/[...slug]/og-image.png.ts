import { promises as fs } from "fs";
import satori from "satori";
import sharp from "sharp";
import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import OpenAI from "openai";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post: CollectionEntry<"blog">) => ({
    params: { slug: post.slug },
    props: post,
  }));
}

export const GET: APIRoute = async function get({ params, request }) {
  const openai = new OpenAI({
    apiKey: import.meta.env.OPENAI_API_KEY,
  });

  const post = (await getCollection("blog"))
    .filter((item: CollectionEntry<"blog">) => item.slug === params.slug)
    .at(0);
  if (!post) {
    return new Response("Not found", {
      status: 404,
    });
  }

  // Access environment variables using import.meta.env
  const { title, description, publishedAt } = post.data;
  const content = post.body;
  const imagePath = `./public/og-images/${post.slug}.png`;
  try {
    const image = await fs.readFile(imagePath);
  } catch (error) {
    const summary = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes blog posts.",
        },
        {
          role: "user",
          content: `Here's the blog post content:
          ${content}
          
          Please summarize the blog post.`,
        },
      ],
    });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a humorous and eye-catching Twitter OG image based on the following blog post:
  
      Title: "${title}"
      Description: "${description}"
  
      Here's a summary of the blog post:
      ${summary.choices[0].message.content}
  
      Instructions:
      1. Use vibrant, attention-grabbing colors that contrast well.
      2. Incorporate playful, cartoon-style illustrations related to the blog topic.
      3. Include a witty visual pun or joke based on the title or main theme.
      4. Add small, quirky details that reward closer inspection.
      5. Create a visually balanced layout with an element of surprise.
      6. Include a funny mascot or character reacting to the blog's topic.
      7. Use exaggerated proportions or perspectives for comedic effect.
      8. Ensure the image is eye-catching and humorous without any text.
  
      The image should be instantly engaging, make people smile, and entice them to click through to read the full blog post.`,
      n: 1,
      size: "1024x1024",
    });

    const image_url = response.data[0].url as string;
    const image_encoding = await fetch(image_url).then((res) =>
      res.arrayBuffer()
    );
    await fs.writeFile(imagePath, Buffer.from(image_encoding));
  }

  const image = await fs.readFile(imagePath);
  const image_encoding = image.toString("base64");

  // You can use these variables for server-side operations

  // Note: Only variables prefixed with PUBLIC_ will be available client-side
  // For example: import.meta.env.PUBLIC_SITE_URL would be accessible in the browser

  const robotoData = await fs.readFile(
    "./public/fonts/roboto/Roboto-Regular.ttf"
  );

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "40px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "64px",
                      fontWeight: "bold",
                      color: "#000000",
                      textAlign: "left",
                      marginBottom: "20px",
                    },
                    children: title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "32px",
                      color: "#666666",
                      textAlign: "left",
                    },
                    children: description,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "24px",
                      color: "#999999",
                      textAlign: "left",
                      marginTop: "20px",
                    },
                    children: `Published on ${new Date(
                      publishedAt
                    ).toLocaleDateString("en-us", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}`,
                  },
                },
              ],
            },
          },
          {
            type: "img",
            props: {
              src: `data:image/png;base64,${image_encoding}`,
              style: {
                width: "400px",
                height: "400px",
                objectFit: "cover",
                borderRadius: "10px",
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Roboto",
          data: robotoData,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
    },
  });
};
