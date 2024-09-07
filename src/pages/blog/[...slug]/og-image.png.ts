import fs from "fs/promises";
import satori from "satori";
import sharp from "sharp";
import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

export async function getStaticPaths() {
    const posts = await getCollection("blog");
    return posts.map((post) => ({
      params: { slug: post.slug },
      props: post,
    }));
  }

  
  
  export const GET: APIRoute = async function get({ params , request }) {
    
    const post = (await getCollection("blog")).filter(item => item.slug === params.slug).at(0)
    if(!post) {
        return new Response("Not found", {
            status: 404
        })
    }
    
    const { title, description, publishedAt } = post.data

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
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              backgroundColor: "#ffffff",
              padding: "40px",
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
                  children: `Published on ${new Date(publishedAt).toLocaleDateString("en-us", {
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